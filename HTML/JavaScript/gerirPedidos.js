     document.addEventListener("DOMContentLoaded", () => {
      const CHAVE_LOCAL_STORAGE = "cafezin_gestor_pedidos_status";
      const quadro = document.querySelector(".colunasPedidos");
      const botaoSalvar = document.getElementById("salvarAlteracoesPedidos");
      const mensagemSalvamento = document.getElementById("mensagemSalvamentoPedidos");
      const historicoAlteracoes = new Map();

      function atualizarContadores() {
        document.querySelectorAll(".colunaPedidos").forEach((coluna) => {
          const lista = coluna.querySelector(".listaPedidosColuna");
          const contador = coluna.querySelector(".contadorColunaPedidos");
          contador.textContent = lista.querySelectorAll(".pedido").length;
        });
      }

      function atualizarPedido(pedido, status) {
        pedido.dataset.status = status;
        pedido.classList.remove("novo", "preparo", "pronto");

        const badge = pedido.querySelector(".statusBadge");
        const acoes = pedido.querySelector(".pedidoAcoes");
        const historico = historicoAlteracoes.get(pedido.dataset.pedidoId) || [];

        badge.textContent = status;

        if (status === "Pendente") {
          pedido.classList.add("novo");
          badge.className = "statusBadge aguardando";
          acoes.innerHTML = '<button type="button" class="botaoPrimario" data-acao="iniciar-preparo">Iniciar preparo</button>';
        } else if (status === "Em preparo") {
          pedido.classList.add("preparo");
          badge.className = "statusBadge aguardando";
          acoes.innerHTML = '<button type="button" class="botaoPrimario" data-acao="marcar-pronto">Marcar como pronto</button>';
        } else {
          pedido.classList.add("pronto");
          badge.className = "statusBadge entregue";
          acoes.innerHTML = '<button type="button" class="botaoPrimario">Escolher entregador</button>';
        }

        // A seta só aparece enquanto houver uma alteração ainda não salva.
        if (historico.length > 0) {
          const botaoReverter = document.createElement("button");
          botaoReverter.type = "button";
          botaoReverter.className = "botaoReverterPedido";
          botaoReverter.dataset.acao = "reverter";
          botaoReverter.setAttribute("aria-label", "Reverter última alteração");
          botaoReverter.title = "Reverter última alteração";
          botaoReverter.innerHTML = '<i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>';
          acoes.appendChild(botaoReverter);
        }

        const destino = document.querySelector('[data-lista-status="' + status + '"]');
        destino.appendChild(pedido);
      }

      function salvarStatusLocalmente() {
        const estados = {};
        document.querySelectorAll(".listaPedidosColuna .pedido").forEach((pedido) => {
          estados[pedido.dataset.pedidoId] = pedido.dataset.status;
        });

        try {
          localStorage.setItem(CHAVE_LOCAL_STORAGE, JSON.stringify(estados));

          // Salvar confirma os estados atuais e encerra o histórico reversível.
          historicoAlteracoes.clear();
          document.querySelectorAll(".listaPedidosColuna .pedido").forEach((pedido) => {
            atualizarPedido(pedido, pedido.dataset.status);
          });

          mensagemSalvamento.textContent = "Alterações salvas.";
          mensagemSalvamento.classList.add("salvamentoSucesso");
          atualizarContadores();
        } catch (erro) {
          mensagemSalvamento.textContent = "Não foi possível salvar as alterações neste navegador.";
          mensagemSalvamento.classList.remove("salvamentoSucesso");
        }
      }

      function carregarStatusSalvo() {
        try {
          const dadosSalvos = localStorage.getItem(CHAVE_LOCAL_STORAGE);
          if (!dadosSalvos) return;

          const estados = JSON.parse(dadosSalvos);
          Object.entries(estados).forEach(([id, status]) => {
            if (!["Pendente", "Em preparo", "Pronto"].includes(status)) return;
            const pedido = document.querySelector('[data-pedido-id="' + id + '"]');
            if (pedido && pedido.closest(".colunasPedidos")) {
              historicoAlteracoes.delete(id);
              atualizarPedido(pedido, status);
            }
          });
        } catch (erro) {
          console.warn("Não foi possível recuperar os pedidos salvos.", erro);
        }
      }

      quadro.addEventListener("click", (evento) => {
        const botao = evento.target.closest("button[data-acao]");
        if (!botao) return;

        const pedido = botao.closest(".pedido");
        if (!pedido) return;

        const id = pedido.dataset.pedidoId;
        const statusAtual = pedido.dataset.status;
        const historico = historicoAlteracoes.get(id) || [];
        let proximoStatus = null;

        if (botao.dataset.acao === "iniciar-preparo" && statusAtual === "Pendente") {
          proximoStatus = "Em preparo";
          historico.push(statusAtual);
        } else if (botao.dataset.acao === "marcar-pronto" && statusAtual === "Em preparo") {
          proximoStatus = "Pronto";
          historico.push(statusAtual);
        } else if (botao.dataset.acao === "reverter" && historico.length > 0) {
          proximoStatus = historico.pop();
        }

        if (!proximoStatus) return;

        if (historico.length > 0) {
          historicoAlteracoes.set(id, historico);
        } else {
          historicoAlteracoes.delete(id);
        }

        atualizarPedido(pedido, proximoStatus);
        atualizarContadores();
        mensagemSalvamento.textContent = "Há alterações não salvas.";
        mensagemSalvamento.classList.remove("salvamentoSucesso");
      });

      botaoSalvar.addEventListener("click", salvarStatusLocalmente);

      carregarStatusSalvo();
      atualizarContadores();
    });
