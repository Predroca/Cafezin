(() => {
  "use strict";

  // Endereço do backend Flask (o mesmo do gerirPedidos.js).
  const API_URL = "http://127.0.0.1:5000";

  // Status pedidos ao backend (GET /loja/pedidos?status=...).
  // Remova "Entregue" e "Cancelado" para mostrar só pendentes, em preparo e prontos.
  const STATUS_HISTORICO = ["Pendente", "Em preparo", "Em andamento", "Entregue", "Cancelado"];

  // Status do backend -> texto e cor mostrados ao lado do pedido.
  // (No backend, "Em andamento" é o pedido pronto; "Entregue" é o pedido finalizado.)
  const SITUACAO = {
    "Pendente": { texto: "Pendente", classe: "statusPendente" },
    "Em preparo": { texto: "Em preparo", classe: "statusPreparo" },
    "Em andamento": { texto: "Pronto", classe: "statusPronto" },
    "Entregue": { texto: "Finalizado", classe: "statusFinalizado" },
    "Cancelado": { texto: "Cancelado", classe: "statusCancelado" },
  };

  const elLista = document.getElementById("listaHistorico");
  const elContador = document.getElementById("contadorHistorico");
  const elMensagem = document.getElementById("mensagemHistorico");
  const elNotificacao = document.getElementById("contadorNotificacao");

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatarData(iso) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  function resumoItens(itens) {
    return itens.map((i) => `${i.quantidade}x ${i.produto}`).join(", ");
  }

  function criarCard(pedido) {
    const situacao = SITUACAO[pedido.status] || { texto: pedido.status, classe: "" };

    const card = criar("article", "pedido");
    card.dataset.pedidoId = pedido.cod_pedido;
    card.dataset.status = pedido.status;

    const linha = criar("div", "historicoLinha");
    linha.append(
      criar("h3", null, `Pedido #${pedido.cod_pedido} de ${pedido.comprador}`),
      criar("span", `statusBadge statusHistorico ${situacao.classe}`, situacao.texto)
    );

    const data = criar("time", "dadoTitulo", formatarData(pedido.data_pedido));
    data.dateTime = pedido.data_pedido;

    const rodape = criar("div", "pedidoRodape");
    rodape.append(criar("strong", null, formatarMoeda(pedido.valor_total)));

    card.append(
      linha,
      data,
      criar("p", null, resumoItens(pedido.itens)),
      rodape
    );
    return card;
  }

  function mostrarMensagem(texto) {
    if (elMensagem) elMensagem.textContent = texto;
  }

  async function carregarHistorico() {
    const token = localStorage.getItem("token");
    if (!token) {
      mostrarMensagem("Faça login como loja para ver o histórico.");
      return;
    }

    try {
      const params = STATUS_HISTORICO.map((s) => `status=${encodeURIComponent(s)}`).join("&");
      const resposta = await fetch(`${API_URL}/loja/pedidos?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let dados = {};
      try { dados = await resposta.json(); } catch (_) { /* sem JSON */ }
      if (!resposta.ok) throw new Error(dados.error || dados.msg || `Erro ${resposta.status}`);

      // mais recentes primeiro
      const pedidos = dados.pedidos.sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido));

      elContador.textContent = `${pedidos.length} ${pedidos.length === 1 ? "pedido" : "pedidos"}`;
      if (elNotificacao) {
        elNotificacao.textContent = pedidos.filter((p) => p.status === "Pendente").length;
      }

      elLista.replaceChildren(
        ...(pedidos.length
          ? pedidos.map(criarCard)
          : [criar("p", "colunaVazia", "Nenhum pedido por aqui.")])
      );
    } catch (erro) {
      mostrarMensagem(`Não foi possível carregar o histórico: ${erro.message}`);
    }
  }

  carregarHistorico();
})();