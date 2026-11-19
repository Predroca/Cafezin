(() => {
  "use strict";

  /* ================= Configuração ================= */

  // Endereço do backend Flask. Ajuste se o seu for diferente.
  const API_URL = "http://127.0.0.1:5000";

  // Quantos pedidos aparecem em cada coluna. Acima disso, o 4º aparece
  // esmaecido e uma seta leva ao histórico com todos os pedidos.
  const LIMITE_POR_COLUNA = 3;

  // Página com todos os pedidos (pendentes, em preparo, prontos...).
  const PAGINA_HISTORICO = "historicoPedidos.html";

  // De quanto em quanto tempo a lista é recarregada do backend (ms).
  const INTERVALO_ATUALIZACAO = 30000;

  // Status do backend -> coluna da tela.
  // No backend, "pronto" leva o pedido para "Em andamento".
  const COLUNA_POR_STATUS = {
    "Pendente": "Pendente",
    "Em preparo": "Em preparo",
    "Em andamento": "Pronto",
  };

  // Como cada coluna desenha seus cards e qual ação do backend o botão dispara.
  const CONFIG_COLUNAS = {
    "Pendente": { classe: "novo", botao: "iniciar-preparo", texto: "Iniciar preparo", botaoCancelar: true },
    "Em preparo": { classe: "preparo", botao: "marcar-pronto", texto: "Marcar como pronto" },
    "Pronto": { classe: "pronto", botao: "finalizar", texto: "Finalizar pedido" },
  };

  // data-acao do botão -> "acao" esperada por PATCH /loja/pedidos/<id>/status
  const ACAO_BACKEND = {
    "iniciar-preparo": "aceitar",
    "marcar-pronto": "pronto",
    "finalizar": "entregue",
    "cancelar": "recusar",
  };

  /* ================= Estado ================= */

  const estado = {
    pedidos: [],            // pedidos vindos do backend
    prontoEm: new Map(),    // cod_pedido -> momento em que foi marcado como pronto aqui
    ocupados: new Set(),    // pedidos com requisição em andamento
  };

  const elMensagem = document.getElementById("mensagemSalvamentoPedidos");
  const elNotificacao = document.getElementById("contadorNotificacao");
  const elColunas = document.querySelector(".colunasPedidos");
  let timerMensagem = null;

  /* ================= API ================= */

  async function requisicao(caminho, opcoes = {}) {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    if (opcoes.body) headers["Content-Type"] = "application/json";

    const resposta = await fetch(API_URL + caminho, { ...opcoes, headers });

    let dados = {};
    try {
      dados = await resposta.json();
    } catch (_) { /* resposta sem corpo JSON */ }

    if (!resposta.ok) {
      throw new Error(dados.error || dados.msg || `Erro ${resposta.status}`);
    }
    return dados;
  }

  /* ================= Utilidades ================= */

  function mostrarMensagem(texto, sucesso = false) {
    if (!elMensagem) return;
    clearTimeout(timerMensagem);
    elMensagem.textContent = texto;
    elMensagem.classList.toggle("salvamentoSucesso", sucesso);
    if (texto) {
      timerMensagem = setTimeout(() => { elMensagem.textContent = ""; }, 4000);
    }
  }

  function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function textoTempo(dataIso) {
    const minutos = Math.max(0, Math.floor((Date.now() - new Date(dataIso).getTime()) / 60000));
    if (minutos < 1) return "Agora mesmo";
    if (minutos < 60) return `Há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Há ${horas} h`;
    return `Há ${Math.floor(horas / 24)} d`;
  }

  function resumoItens(itens) {
    return itens.map((i) => `${i.quantidade}x ${i.produto}`).join(", ");
  }

  function textoEndereco(e) {
    if (!e) return "";
    return [e.nome_logradouro, e.numero].filter(Boolean).join(", ");
  }

  function colunaDoPedido(pedido) {
    return COLUNA_POR_STATUS[pedido.status];
  }

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  /* ================= Renderização ================= */

  function criarCard(pedido, coluna) {
    const cfg = CONFIG_COLUNAS[coluna];

    const card = criar("article", `pedido ${cfg.classe}`);
    card.dataset.pedidoId = pedido.cod_pedido;
    card.dataset.status = coluna;
    card.dataset.endereco = textoEndereco(pedido.endereco_entrega);

    const cabecalho = criar("div", "pedidoCabecalho");
    cabecalho.append(criar("span", "statusBadge aguardando", coluna));
    const tempo = criar("time", null, textoTempo(pedido.data_pedido));
    tempo.dateTime = pedido.data_pedido;
    cabecalho.append(tempo);

    const rodape = criar("div", "pedidoRodape");
    rodape.append(criar("strong", null, formatarMoeda(pedido.valor_total)));

    const acoes = criar("div", "pedidoAcoes");
    const botao = criar("button", "botaoPrimario", cfg.texto);
    botao.type = "button";
    botao.dataset.acao = cfg.botao;
    botao.disabled = estado.ocupados.has(pedido.cod_pedido);
    acoes.append(botao);

    if (cfg.botaoCancelar) {
      const cancelar = criar("button", "botaoSecundario", "Cancelar");
      cancelar.type = "button";
      cancelar.dataset.acao = "cancelar";
      cancelar.disabled = estado.ocupados.has(pedido.cod_pedido);
      acoes.append(cancelar);
    }
    rodape.append(acoes);

    card.append(
      cabecalho,
      criar("h3", null, `Pedido de ${pedido.comprador}`),
      criar("span", "dadoTitulo", "Produtos:"),
      criar("p", null, resumoItens(pedido.itens)),
      rodape
    );
    return card;
  }

  function criarSetaHistorico() {
    const seta = criar("a", "setaHistorico");
    seta.href = PAGINA_HISTORICO;
    seta.setAttribute("aria-label", "Ver todos os pedidos no histórico");
    seta.append(criar("i", "bi bi-arrow-down"));
    return seta;
  }

  // 4º pedido da coluna: só uma "espiada" esmaecida (fade), sem interação.
  function criarPreviaHistorico(pedido, coluna) {
    const previa = criar("div", "previaMais");
    previa.setAttribute("aria-hidden", "true");
    previa.inert = true;
    previa.append(criarCard(pedido, coluna));
    return previa;
  }

  function renderizar() {
    for (const coluna of Object.keys(CONFIG_COLUNAS)) {
      const lista = document.querySelector(`[data-lista-status="${coluna}"]`);
      const contador = lista.closest(".colunaPedidos").querySelector(".contadorColunaPedidos");

      let pedidos = estado.pedidos.filter((p) => colunaDoPedido(p) === coluna);
      contador.textContent = pedidos.length;

      if (coluna === "Pronto") {
        // Mais recentes primeiro; o que acabou de ser marcado pronto vai ao topo.
        const momento = (p) => estado.prontoEm.get(p.cod_pedido) ?? new Date(p.data_pedido).getTime();
        pedidos = pedidos.sort((a, b) => momento(b) - momento(a));
      } else {
        pedidos = pedidos.sort((a, b) => new Date(a.data_pedido) - new Date(b.data_pedido));
      }

      const visiveis = pedidos.slice(0, LIMITE_POR_COLUNA);
      const excedentes = pedidos.slice(LIMITE_POR_COLUNA);

      const elementos = visiveis.map((p) => criarCard(p, coluna));

      if (excedentes.length) {
        elementos.push(criarPreviaHistorico(excedentes[0], coluna), criarSetaHistorico());
      }
      if (!elementos.length) {
        elementos.push(criar("p", "colunaVazia", "Nenhum pedido por aqui."));
      }
      lista.replaceChildren(...elementos);
    }

    if (elNotificacao) {
      elNotificacao.textContent = estado.pedidos.filter((p) => p.status === "Pendente").length;
    }
  }

  /* ================= Backend ================= */

  async function carregarPedidos() {
    try {
      const dados = await requisicao("/loja/pedidos");
      estado.pedidos = dados.pedidos;
      renderizar();
    } catch (erro) {
      mostrarMensagem(`Não foi possível carregar os pedidos: ${erro.message}`);
    }
  }

  async function avancarPedido(codPedido, acaoBotao) {
    estado.ocupados.add(codPedido);
    renderizar();

    try {
      const resp = await requisicao(`/loja/pedidos/${codPedido}/status`, {
        method: "PATCH",
        body: JSON.stringify({ acao: ACAO_BACKEND[acaoBotao] }),
      });

      const pedido = estado.pedidos.find((p) => p.cod_pedido === codPedido);
      if (pedido) pedido.status = resp.status;
      if (COLUNA_POR_STATUS[resp.status] === "Pronto") {
        estado.prontoEm.set(codPedido, Date.now());
      }
      if (resp.status === "Entregue" || resp.status === "Cancelado") {
        // finalizado ou cancelado: sai das colunas (continua no histórico)
        estado.pedidos = estado.pedidos.filter((p) => p.cod_pedido !== codPedido);
        estado.prontoEm.delete(codPedido);
        mostrarMensagem(
          `Pedido #${codPedido} ${resp.status === "Entregue" ? "finalizado" : "cancelado"}.`,
          true
        );
      } else {
        mostrarMensagem(`Pedido #${codPedido} atualizado.`, true);
      }
    } catch (erro) {
      mostrarMensagem(`Não foi possível atualizar o pedido #${codPedido}: ${erro.message}`);
    } finally {
      estado.ocupados.delete(codPedido);
      renderizar();
    }
  }

  /* ================= Eventos ================= */

  elColunas.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao || botao.disabled) return;

    const card = botao.closest(".pedido");
    if (botao.dataset.acao === "cancelar" &&
        !confirm(`Cancelar o pedido #${card.dataset.pedidoId}? Essa ação não pode ser desfeita.`)) {
      return;
    }
    avancarPedido(Number(card.dataset.pedidoId), botao.dataset.acao);
  });

  /* ================= Início ================= */

  carregarPedidos();

  setInterval(() => {
    if (estado.ocupados.size === 0) carregarPedidos();
  }, INTERVALO_ATUALIZACAO);
})();