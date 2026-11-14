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
          acoes.innerHTML = '<button type="button" class="botaoPrimario" data-acao="escolher-entregador">Escolher entregador</button>';
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

        if (botao.dataset.acao === "escolher-entregador") {
          abrirModalEntregador(pedido);
          return;
        }

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

      /* =====================================================
         ESCOLHER ENTREGADOR
         ===================================================== */

      const CHAVE_ENTREGAS = "cafezin_gestor_pedidos_entregas";

      // Entregadores da tabela Entregador/Usuario (hardcoded por enquanto).
      const ENTREGADORES = [
        { id: 1, nome: "Lucas Oliveira",   telefone: "(32) 98811-2234" },
        { id: 2, nome: "Fernanda Costa",   telefone: "(32) 98722-9981" },
        { id: 3, nome: "Rafael Almeida",   telefone: "(32) 98633-4456" },
        { id: 4, nome: "Bruno Carvalho",   telefone: "(32) 98844-5566" },
        { id: 5, nome: "Diego Martins",    telefone: "(32) 98755-6677" },
        { id: 6, nome: "Juliana Ferreira", telefone: "(32) 98666-7788" },
        { id: 7, nome: "Thiago Rocha",     telefone: "(32) 98577-8899" },
        { id: 8, nome: "Camila Nunes",     telefone: "(32) 98488-9900" }
      ];

      const modalEntregadores = document.getElementById("modalEntregadores");
      const listaModalEntregadores = document.getElementById("listaEntregadoresModal");
      const listaEntregas = document.querySelector(".listaEntregas");
      let pedidoEmEscolha = null;

      function escaparHtml(texto) {
        const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
        return String(texto).replace(/[&<>"']/g, (c) => mapa[c]);
      }

      function montarListaEntregadores() {
        listaModalEntregadores.innerHTML = ENTREGADORES.map((e) =>
          '<li class="entregadorOpcao">' +
            '<i class="bi bi-person-circle entregadorAvatar" aria-hidden="true"></i>' +
            '<div class="entregadorDados">' +
              "<strong>" + escaparHtml(e.nome) + "</strong>" +
              "<span>" + escaparHtml(e.telefone) + "</span>" +
            "</div>" +
            '<button type="button" class="botaoPrimario" data-entregador-id="' + e.id + '">Selecionar</button>' +
          "</li>"
        ).join("");
      }

      function abrirModalEntregador(pedido) {
        pedidoEmEscolha = pedido;
        document.getElementById("modalEntregadoresPedido").textContent =
          pedido.querySelector("h3").textContent;
        document.body.classList.add("modalAberto");
        listaModalEntregadores.scrollTop = 0;
        modalEntregadores.showModal();
      }

      function adicionarCardEntrega(dados) {
        const card = document.createElement("article");
        card.className = "entrega aguardando";
        card.dataset.pedidoId = dados.pedidoId;
        card.dataset.entregaStatus = "Aguardando";
        card.innerHTML =
          '<div class="entregaCabecalho"><span class="statusBadge aguardando">Aguardando retirada</span><time>Agora</time></div>' +
          '<div class="entregaInfo">' +
            "<h3>" + escaparHtml(dados.titulo) + "</h3>" +
            '<div class="entregaDado lojaEntrega"><i class="bi bi-truck"></i>' +
              '<div><span class="dadoTitulo">Entregador(a): </span><strong>' + escaparHtml(dados.entregador) + "</strong></div></div>" +
            '<div class="entregaDado produtosEntrega"><i class="bi bi-bag"></i>' +
              '<div><span class="dadoTitulo">Produtos:</span><p><strong>' + escaparHtml(dados.produtos) + "</strong></p></div></div>" +
            '<div class="entregaDado enderecoEntrega"><i class="bi bi-geo-alt"></i>' +
              '<div><span class="dadoTitulo">Entrega: </span><strong>' + escaparHtml(dados.endereco) + "</strong></div></div>" +
          "</div>" +
          '<div class="entregaRodape"><strong>' + escaparHtml(dados.valor) + '</strong><span class="avisoSomenteLeitura">Aguardando entregador</span></div>';
        listaEntregas.prepend(card);
      }

      function lerEntregasSalvas() {
        try {
          return JSON.parse(localStorage.getItem(CHAVE_ENTREGAS)) || {};
        } catch (erro) {
          return {};
        }
      }

      function salvarEntrega(dados) {
        try {
          const entregas = lerEntregasSalvas();
          entregas[dados.pedidoId] = dados;
          localStorage.setItem(CHAVE_ENTREGAS, JSON.stringify(entregas));
          return true;
        } catch (erro) {
          return false;
        }
      }

      function carregarEntregasSalvas() {
        Object.values(lerEntregasSalvas()).forEach((dados) => {
          const pedido = document.querySelector('.colunasPedidos [data-pedido-id="' + dados.pedidoId + '"]');
          if (pedido) pedido.remove();
          if (!listaEntregas.querySelector('[data-pedido-id="' + dados.pedidoId + '"]')) {
            adicionarCardEntrega(dados);
          }
        });
      }

      function atribuirEntregador(pedido, entregador) {
        const dados = {
          pedidoId: pedido.dataset.pedidoId,
          titulo: pedido.querySelector("h3").textContent,
          produtos: pedido.querySelector("p").textContent,
          endereco: pedido.dataset.endereco || "Endereço não informado",
          valor: pedido.querySelector(".pedidoRodape strong").textContent,
          entregador: entregador.nome
        };

        const salvou = salvarEntrega(dados);
        adicionarCardEntrega(dados);
        historicoAlteracoes.delete(dados.pedidoId);
        pedido.remove();
        atualizarContadores();

        if (salvou) {
          mensagemSalvamento.textContent = dados.titulo + " enviado para entrega com " + entregador.nome + ".";
          mensagemSalvamento.classList.add("salvamentoSucesso");
        } else {
          mensagemSalvamento.textContent = "Pedido enviado, mas não foi possível salvar neste navegador.";
          mensagemSalvamento.classList.remove("salvamentoSucesso");
        }
      }

      listaModalEntregadores.addEventListener("click", (evento) => {
        const botao = evento.target.closest("button[data-entregador-id]");
        if (!botao || !pedidoEmEscolha) return;

        const entregador = ENTREGADORES.find((e) => String(e.id) === botao.dataset.entregadorId);
        if (!entregador) return;

        const pedido = pedidoEmEscolha;
        modalEntregadores.close();
        atribuirEntregador(pedido, entregador);
      });

      modalEntregadores.addEventListener("click", (evento) => {
        if (evento.target === modalEntregadores || evento.target.closest("[data-fechar-modal]")) {
          modalEntregadores.close();
        }
      });

      modalEntregadores.addEventListener("close", () => {
        document.body.classList.remove("modalAberto");
        pedidoEmEscolha = null;
      });

      montarListaEntregadores();
      carregarEntregasSalvas();

      botaoSalvar.addEventListener("click", salvarStatusLocalmente);

      carregarStatusSalvo();
      atualizarContadores();
    });
