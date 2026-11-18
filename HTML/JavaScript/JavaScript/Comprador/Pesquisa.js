/* ==========================================================
   Pesquisa.js  (JavaScript/Comprador/Pesquisa.js)

   - Na indexComprador.html: o <form id="formBusca"> já envia
     para pesquisa.html?q=... (GET), então nada precisa rodar.
   - Na pesquisa.html: lê o ?q=, busca nas rotas do backend e
     mostra as abas "Lojas" e "Itens".

   Rotas usadas (todas já existem no catalogo_bp.py):
     GET /lojas                   -> lojas + nota média
     GET /lojas/<cod>/cardapio    -> foto, horário e se está aberta
     GET /produtos                -> produtos disponíveis
     GET /categorias              -> categorias (filtro da aba Itens)

   Como o backend não tem uma rota de busca, o filtro por texto
   é feito aqui, no navegador, sobre o que essas rotas devolvem.
   ========================================================== */

(function () {
  "use strict";

  // Ajuste aqui se a API estiver em outro endereço.
  // (Se você já tem um config.js que define window.API_URL, ele é usado.)
  const API_URL = (window.API_URL || "http://localhost:5000").replace(/\/$/, "");

  /* ---------------- categorias: nomes equivalentes ---------------- */
  // A home usa "Pão", a pesquisa "Pães"; o banco pode ter singular ou plural.
  // Tudo é reduzido a uma "chave" para comparar sem erro.
  const ALIASES = {
    cafe: "cafes", doce: "doces", bolo: "bolos", salgado: "salgados",
    bebida: "bebidas", pao: "paes", sanduiche: "sanduiches",
    sorvete: "sorvetes", chocolate: "chocolates",
  };

  function chaveCategoria(nome) {
    const n = normalizar(nome);
    return ALIASES[n] || n;
  }

  /* ---------------- indexComprador: clique na categoria ---------------- */
  // Envia para pesquisa.html?categoria=Nome (a pesquisa já abre na aba Itens
  // com a categoria marcada). Também troca o href, então "abrir em nova aba" funciona.
  function configurarCategoriasDaHome() {
    document.querySelectorAll(".listaCategorias .categoria").forEach((link) => {
      const nome = (link.querySelector("b")?.textContent || "").trim();
      if (!nome) return;
      const url = "pesquisa.html?categoria=" + encodeURIComponent(nome);
      link.setAttribute("href", url);
      // captura: garante a navegação mesmo que outro script trate o clique
      link.addEventListener("click", (evento) => {
        if (evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        window.location.href = url;
      }, true);
    });
  }

  const resultados = document.querySelector(".resultadosPesquisa");
  if (!resultados) { // não é a pesquisa.html (ex.: indexComprador)
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", configurarCategoriasDaHome);
    } else {
      configurarCategoriasDaHome();
    }
    return;
  }

  /* ---------------- estado ---------------- */
  const estado = {
    termo: "",
    aba: "Lojas",
    somenteAbertas: false,
    categoriasSelecionadas: new Set(),
    lojas: [],          // lojas que bateram com o termo
    produtos: [],       // produtos que bateram com o termo
    categorias: [],     // [{cod_categoria, nome}]
    notasPorLoja: {},   // cod_loja -> {nota_media, total_avaliacoes}
    // valores escolhidos nos menus (o 1º de cada menu no HTML é o padrão)
    filtros: {
      ordenarLojas: "relevancia",
      notaMinima: "0",
      ordenarItens: "relevancia",
      faixaPreco: "todas",
    },
  };
  const cacheCardapio = {}; // cod_loja -> Promise<cardápio | null>
  let renderAtual = 0;      // evita que uma renderização antiga sobrescreva a nova

  /* ---------------- utilidades ---------------- */
  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function preco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function urlImagem(caminho) {
    if (!caminho) return null;
    if (/^(https?:)?\/\//i.test(caminho) || caminho.startsWith("data:")) return caminho;
    return API_URL + (caminho.startsWith("/") ? "" : "/") + caminho;
  }

  function iniciais(nome) {
    return String(nome || "?")
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map((p) => p[0].toUpperCase()).join("");
  }

  async function pegarJson(rota) {
    const resposta = await fetch(API_URL + rota);
    if (!resposta.ok) throw new Error("Erro " + resposta.status + " em " + rota);
    return resposta.json();
  }

  function cardapioDaLoja(codLoja) {
    if (!cacheCardapio[codLoja]) {
      cacheCardapio[codLoja] = pegarJson("/lojas/" + codLoja + "/cardapio").catch(() => null);
    }
    return cacheCardapio[codLoja];
  }

  /* ---------------- busca ---------------- */
  async function carregarDados() {
    mostrarMensagem("Buscando...", "bi-hourglass-split");

    const [dadosLojas, dadosProdutos, dadosCategorias] = await Promise.all([
      pegarJson("/lojas"),
      pegarJson("/produtos"),
      pegarJson("/categorias").catch(() => ({ categorias: [] })),
    ]);

    const termo = normalizar(estado.termo);
    // lojas: o nome CONTÉM o termo | itens: alguma palavra do nome COMEÇA com o termo
    // (assim "bolo" acha "Fatia de bolo", mas "ol" não acha "Bolo")
    const contem = (nome) => !termo || normalizar(nome).includes(termo);
    const comeca = (nome) => {
      if (!termo) return true;
      const n = normalizar(nome);
      return n.startsWith(termo) || n.split(/[\s\-\/(),]+/).some((p) => p.startsWith(termo));
    };

    estado.categorias = dadosCategorias.categorias || [];

    const todasLojas = dadosLojas.lojas || [];
    todasLojas.forEach((l) => {
      estado.notasPorLoja[l.cod_loja] = { nota_media: l.nota_media, total_avaliacoes: l.total_avaliacoes };
    });

    estado.lojas = todasLojas.filter((l) => contem(l.nome));
    estado.produtos = (dadosProdutos.produtos || []).filter((p) => comeca(p.nome));
  }

  /* ---------------- HTML dos cards ---------------- */
  function logoLojaHtml(nome, foto) {
    const img = urlImagem(foto);
    return img
      ? '<img src="' + escapar(img) + '" alt="">'
      : escapar(iniciais(nome));
  }

  function notaHtml(codLoja) {
    const n = estado.notasPorLoja[codLoja];
    if (!n || !n.total_avaliacoes) return "<small>Sem avaliações</small>";
    return '<small><strong><i class="bi bi-star-fill"></i> ' +
      String(n.nota_media).replace(".", ",") + "</strong> · " +
      n.total_avaliacoes + (n.total_avaliacoes === 1 ? " avaliação" : " avaliações") + "</small>";
  }

  function statusHtml(cardapio) {
    if (!cardapio || cardapio.aberta === null || cardapio.aberta === undefined) return "";
    const horario = cardapio.horario_abertura && cardapio.horario_fecha
      ? " · " + cardapio.horario_abertura + " às " + cardapio.horario_fecha : "";
    return "<b>" + (cardapio.aberta ? "Aberta agora" : "Fechada") + escapar(horario) + "</b>";
  }

  function botaoFavoritarHtml(nome) {
    return '<button class="favoritar" type="button" aria-label="Favoritar ' + escapar(nome) + '" aria-pressed="false">' +
      '<i class="bi bi-heart"></i></button>';
  }

  function cardLojaParceira(loja, cardapio) {
    // a classe "lojaCard" junto com data-cod-loja é o que o favoritarLoja.js procura
    return (
      '<article class="lojaParceiraCard lojaCard" data-cod-loja="' + loja.cod_loja + '">' +
        '<div class="logoLojaParceira">' + logoLojaHtml(loja.nome, cardapio && cardapio.foto_url) + "</div>" +
        botaoFavoritarHtml(loja.nome) +
        '<div class="lojaInfo">' +
          "<h3>" + escapar(loja.nome) + "</h3>" +
          notaHtml(loja.cod_loja) +
          statusHtml(cardapio) +
        "</div>" +
      "</article>"
    );
  }

  function cardProduto(p) {
    const img = urlImagem(p.foto_url);
    const foto = img
      ? '<div class="fotoProduto"><img class="imagemProdutoMaisPedido" src="' + escapar(img) + '" alt="' + escapar(p.nome) + '"></div>'
      : '<div class="placeholderFoto fotoProduto" role="img" aria-label="Sem foto de ' + escapar(p.nome) + '">' +
          '<i class="bi bi-image"></i><span>Foto do produto</span></div>';

    // O adicionarSacola.js lê estes data-* do próprio card (.produtoCard):
    // cod-produto, cod-loja, nome, preco, nome-loja e foto (opcional).
    return (
      '<article class="produtoCard"' +
        ' data-cod-produto="' + p.cod_produto + '"' +
        ' data-cod-loja="' + p.cod_loja + '"' +
        ' data-nome="' + escapar(p.nome) + '"' +
        ' data-preco="' + Number(p.preco) + '"' +
        ' data-nome-loja="' + escapar(p.loja) + '"' +
        ' data-foto="' + escapar(img || "") + '">' +
        foto +
        '<div class="produtoInfo">' +
          '<h3 class="produtoNome">' + escapar(p.nome) + "</h3>" +
          '<strong class="preco">' + preco(p.preco) + "</strong>" +
        "</div>" +
        '<button class="adicionar" type="button" aria-label="Adicionar ' + escapar(p.nome) + '">' +
          '<i class="bi bi-plus-lg"></i></button>' +
      "</article>"
    );
  }

  function blocoLojaComProdutos(loja, produtos, cardapio) {
    return (
      '<div class="lojaBloco">' +
        '<div class="lojaTopo">' +
          '<article class="lojaCard" data-cod-loja="' + loja.cod_loja + '">' +
            '<div class="logoLoja">' + logoLojaHtml(loja.nome, cardapio && cardapio.foto_url) + "</div>" +
            botaoFavoritarHtml(loja.nome) +
            '<div class="lojaInfo">' +
              "<h3>" + escapar(loja.nome) + "</h3>" +
              notaHtml(loja.cod_loja) +
              statusHtml(cardapio) +
            "</div>" +
          "</article>" +
        "</div>" +
        '<div class="listaProdutos listaProdutosLoja">' + produtos.map(cardProduto).join("") + "</div>" +
      "</div>"
    );
  }

  /* ---------------- renderização ---------------- */
  function mostrarMensagem(texto, icone) {
    resultados.innerHTML =
      '<p class="mensagemPesquisa"><i class="bi ' + (icone || "bi-search") + '" aria-hidden="true"></i> ' +
      escapar(texto) + "</p>";
  }

  const porNome = (a, b) => String(a).localeCompare(String(b), "pt-BR");

  function filtrosLojasAtivos() {
    const f = estado.filtros;
    return estado.somenteAbertas || f.ordenarLojas !== "relevancia" || f.notaMinima !== "0";
  }

  function filtrosItensAtivos() {
    const f = estado.filtros;
    return estado.categoriasSelecionadas.size > 0 || f.ordenarItens !== "relevancia" || f.faixaPreco !== "todas";
  }

  /* ---- lojas: filtrar e ordenar ---- */
  function ordenarLojas(itens) {
    const termo = normalizar(estado.termo);
    const dados = (x) => estado.notasPorLoja[x.loja.cod_loja] || {};
    const criterios = {
      relevancia: (a, b) => {
        const pa = normalizar(a.loja.nome).startsWith(termo) ? 0 : 1;
        const pb = normalizar(b.loja.nome).startsWith(termo) ? 0 : 1;
        return pa - pb || porNome(a.loja.nome, b.loja.nome);
      },
      nota: (a, b) =>
        (Number(dados(b).nota_media) || 0) - (Number(dados(a).nota_media) || 0) ||
        (dados(b).total_avaliacoes || 0) - (dados(a).total_avaliacoes || 0),
      avaliacoes: (a, b) => (dados(b).total_avaliacoes || 0) - (dados(a).total_avaliacoes || 0),
      nome: (a, b) => porNome(a.loja.nome, b.loja.nome),
    };
    return itens.slice().sort(criterios[estado.filtros.ordenarLojas] || criterios.relevancia);
  }

  async function renderizarLojas(meu) {
    if (!estado.lojas.length) {
      mostrarMensagem("Nenhuma loja encontrada para essa pesquisa.");
      return;
    }

    const cardapios = await Promise.all(estado.lojas.map((l) => cardapioDaLoja(l.cod_loja)));
    if (meu !== renderAtual) return;
    let itens = estado.lojas.map((loja, i) => ({ loja, cardapio: cardapios[i] }));

    if (estado.somenteAbertas) {
      itens = itens.filter((x) => x.cardapio && x.cardapio.aberta === true);
    }

    const notaMinima = Number(estado.filtros.notaMinima);
    if (notaMinima > 0) {
      itens = itens.filter((x) => {
        const n = estado.notasPorLoja[x.loja.cod_loja];
        return n && n.total_avaliacoes > 0 && Number(n.nota_media) >= notaMinima;
      });
    }

    if (!itens.length) {
      mostrarMensagem(filtrosLojasAtivos()
        ? "Nenhuma loja encontrada com esses filtros."
        : "Nenhuma loja encontrada para essa pesquisa.");
      return;
    }

    itens = ordenarLojas(itens);

    resultados.innerHTML =
      '<div class="listaLojasParceiras">' +
      itens.map((x) => cardLojaParceira(x.loja, x.cardapio)).join("") +
      "</div>";
  }

  /* ---- itens: filtrar e ordenar ---- */
  function dentroDaFaixa(valor) {
    const v = Number(valor);
    switch (estado.filtros.faixaPreco) {
      case "ate10": return v <= 10;
      case "10a20": return v > 10 && v <= 20;
      case "acima20": return v > 20;
      default: return true;
    }
  }

  function ordenarProdutos(lista) {
    const criterios = {
      menor: (a, b) => a.preco - b.preco || porNome(a.nome, b.nome),
      maior: (a, b) => b.preco - a.preco || porNome(a.nome, b.nome),
      nome: (a, b) => porNome(a.nome, b.nome),
    };
    const criterio = criterios[estado.filtros.ordenarItens];
    return criterio ? lista.slice().sort(criterio) : lista;
  }

  async function renderizarItens(meu) {
    let produtos = estado.produtos;

    if (estado.categoriasSelecionadas.size) {
      const codigos = new Set(
        estado.categorias
          .filter((c) => estado.categoriasSelecionadas.has(chaveCategoria(c.nome)))
          .map((c) => c.cod_categoria)
      );
      produtos = produtos.filter((p) => codigos.has(p.cod_categoria));
    }

    produtos = produtos.filter((p) => dentroDaFaixa(p.preco));

    if (!produtos.length) {
      mostrarMensagem(filtrosItensAtivos()
        ? "Nenhum item encontrado com esses filtros."
        : "Nenhum item encontrado para essa pesquisa.");
      return;
    }

    // agrupa por loja (o /produtos já vem ordenado por loja e nome)
    const grupos = new Map();
    produtos.forEach((p) => {
      if (!grupos.has(p.cod_loja)) grupos.set(p.cod_loja, { loja: { cod_loja: p.cod_loja, nome: p.loja }, produtos: [] });
      grupos.get(p.cod_loja).produtos.push(p);
    });

    const lista = Array.from(grupos.values());
    const cardapios = await Promise.all(lista.map((g) => cardapioDaLoja(g.loja.cod_loja)));
    if (meu !== renderAtual) return;

    // a ordenação vale dentro de cada loja
    resultados.innerHTML = lista
      .map((g, i) => blocoLojaComProdutos(g.loja, ordenarProdutos(g.produtos), cardapios[i]))
      .join("");
  }

  function atualizarBotoesLimpar() {
    const lojas = document.getElementById("limparFiltrosLojas");
    const itens = document.getElementById("limparFiltrosItens");
    if (lojas) lojas.hidden = !filtrosLojasAtivos();
    if (itens) itens.hidden = !filtrosItensAtivos();
  }

  async function renderizar() {
    const meu = ++renderAtual;
    atualizarBotoesLimpar();
    try {
      if (estado.aba === "Lojas") await renderizarLojas(meu);
      else await renderizarItens(meu);
    } catch (erro) {
      if (meu !== renderAtual) return;
      console.error(erro);
      mostrarMensagem("Não foi possível carregar os resultados. Tente novamente.", "bi-exclamation-circle");
    }
  }

  /* ---------------- abas e filtros ---------------- */
  function configurarAbas() {
    const abas = document.querySelectorAll(".abaPesquisa");
    const filtrosLojas = document.getElementById("filtrosLojas");
    const filtrosItens = document.getElementById("filtrosItens");
    const painel = document.getElementById("painelPesquisa");

    function ativarAba(aba) {
      estado.aba = aba.dataset.tipo;

      abas.forEach((a) => {
        const ativa = a === aba;
        a.classList.toggle("ativa", ativa);
        a.setAttribute("aria-selected", ativa ? "true" : "false");
      });
      painel.setAttribute("aria-labelledby", aba.id);

      filtrosLojas.hidden = estado.aba !== "Lojas";
      filtrosItens.hidden = estado.aba !== "Itens";
      fecharMenus();
    }
    configurarAbas.ativar = (tipo) => {
      const aba = Array.from(abas).find((a) => a.dataset.tipo === tipo);
      if (aba) ativarAba(aba);
    };

    abas.forEach((aba) => {
      aba.addEventListener("click", () => {
        ativarAba(aba);
        renderizar();
      });
    });
  }

  /* ---- menus suspensos (Ordenar, Filtros, Preço) ---- */
  function fecharMenus() {
    document.querySelectorAll(".filtroMenu").forEach((caixa) => {
      const menu = caixa.querySelector(".menuFiltro");
      const botao = caixa.querySelector(".filtroPesquisa");
      if (menu) menu.hidden = true;
      if (botao) botao.setAttribute("aria-expanded", "false");
    });
  }

  // marca a opção escolhida e deixa o botão com aparência de "ativo"
  // quando o valor é diferente do padrão
  function atualizarMenu(caixa) {
    const botao = caixa.querySelector(".filtroPesquisa");
    const menu = caixa.querySelector(".menuFiltro");
    const rotulo = botao.querySelector(".rotuloFiltro");
    const valor = estado.filtros[menu.dataset.filtro];
    const padrao = menu.querySelector("[data-padrao]").dataset.valor;

    let textoEscolhido = "";
    menu.querySelectorAll("[data-valor]").forEach((opcao) => {
      const escolhida = opcao.dataset.valor === valor;
      opcao.setAttribute("aria-checked", String(escolhida));
      if (escolhida) textoEscolhido = opcao.textContent.trim();
    });

    const ativo = valor !== padrao;
    botao.classList.toggle("selecionado", ativo);
    rotulo.textContent = ativo ? botao.dataset.rotulo + ": " + textoEscolhido : botao.dataset.rotulo;
  }

  function atualizarMenusNaTela() {
    document.querySelectorAll(".filtroMenu").forEach(atualizarMenu);
  }

  function configurarMenus() {
    document.querySelectorAll(".filtroMenu").forEach((caixa) => {
      const botao = caixa.querySelector(".filtroPesquisa");
      const menu = caixa.querySelector(".menuFiltro");

      botao.addEventListener("click", (evento) => {
        evento.stopPropagation();
        const abrir = menu.hidden;
        fecharMenus();
        menu.hidden = !abrir;
        botao.setAttribute("aria-expanded", String(abrir));
      });

      menu.addEventListener("click", (evento) => {
        const opcao = evento.target.closest("[data-valor]");
        if (!opcao) return;
        estado.filtros[menu.dataset.filtro] = opcao.dataset.valor;
        atualizarMenu(caixa);
        fecharMenus();
        renderizar();
      });
    });

    document.addEventListener("click", fecharMenus);
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") fecharMenus();
    });
  }

  /* ---- "Limpar filtros" ---- */
  function limparFiltrosLojas() {
    estado.somenteAbertas = false;
    estado.filtros.ordenarLojas = "relevancia";
    estado.filtros.notaMinima = "0";

    const abertas = document.getElementById("filtroAbertas");
    if (abertas) {
      abertas.classList.remove("selecionado");
      abertas.setAttribute("aria-pressed", "false");
    }
    atualizarMenusNaTela();
    renderizar();
  }

  function limparFiltrosItens() {
    estado.categoriasSelecionadas.clear();
    estado.filtros.ordenarItens = "relevancia";
    estado.filtros.faixaPreco = "todas";

    document.querySelectorAll(".filtroCategoria").forEach((botao) => {
      botao.classList.remove("selecionado");
      botao.setAttribute("aria-pressed", "false");
    });
    atualizarMenusNaTela();
    atualizarUrlCategorias();
    renderizar();
  }

  /* ---- categorias (aba Itens) ---- */
  // mantém ?categoria= na barra de endereço (recarregar/compartilhar mantém o filtro)
  function atualizarUrlCategorias() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("categoria");
      document.querySelectorAll(".filtroCategoria.selecionado").forEach((b) =>
        url.searchParams.append("categoria", b.dataset.categoria));
      window.history.replaceState(null, "", url);
    } catch (e) { /* sem problema se o navegador não permitir */ }
  }

  function marcarChip(botao, marcado) {
    const chave = chaveCategoria(botao.dataset.categoria);
    if (marcado) estado.categoriasSelecionadas.add(chave);
    else estado.categoriasSelecionadas.delete(chave);
    botao.classList.toggle("selecionado", marcado);
    botao.setAttribute("aria-pressed", String(marcado));
  }

  function chipDaCategoria(nome) {
    const chave = chaveCategoria(nome);
    return Array.from(document.querySelectorAll(".filtroCategoria"))
      .find((b) => chaveCategoria(b.dataset.categoria) === chave) || null;
  }

  function ligarChip(botao) {
    botao.addEventListener("click", () => {
      marcarChip(botao, !estado.categoriasSelecionadas.has(chaveCategoria(botao.dataset.categoria)));
      atualizarUrlCategorias();
      renderizar();
    });
  }

  // cria chips para categorias do banco que não existem no HTML (ex.: Sanduíches, Sorvetes)
  function garantirChip(nome) {
    let chip = chipDaCategoria(nome);
    if (chip) return chip;
    const barra = document.getElementById("filtrosItens");
    chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filtroPesquisa filtroCategoria";
    chip.setAttribute("aria-pressed", "false");
    chip.dataset.categoria = nome;
    chip.textContent = nome;
    const primeiroMenu = barra.querySelector(".filtroMenu");
    barra.insertBefore(chip, primeiroMenu);
    ligarChip(chip);
    return chip;
  }

  // aplica ?categoria=... vindo da home; devolve true se alguma foi marcada
  function aplicarCategoriasDaUrl() {
    const params = new URLSearchParams(window.location.search);
    const nomes = params.getAll("categoria")
      .flatMap((v) => v.split(","))
      .map((v) => v.trim())
      .filter(Boolean);
    if (!nomes.length) return false;

    nomes.forEach((nome) => {
      // usa o nome oficial do banco, se existir
      const oficial = estado.categorias.find((c) => chaveCategoria(c.nome) === chaveCategoria(nome));
      marcarChip(garantirChip(oficial ? oficial.nome : nome), true);
    });
    return true;
  }

  function configurarFiltros() {
    configurarMenus();

    // Lojas: "Somente lojas abertas"
    const abertas = document.getElementById("filtroAbertas");
    if (abertas) {
      abertas.addEventListener("click", () => {
        estado.somenteAbertas = !estado.somenteAbertas;
        abertas.classList.toggle("selecionado", estado.somenteAbertas);
        abertas.setAttribute("aria-pressed", String(estado.somenteAbertas));
        renderizar();
      });
    }

    // Itens: categorias (várias podem ficar marcadas)
    document.querySelectorAll(".filtroCategoria").forEach(ligarChip);

    document.getElementById("limparFiltrosLojas")?.addEventListener("click", limparFiltrosLojas);
    document.getElementById("limparFiltrosItens")?.addEventListener("click", limparFiltrosItens);
  }

  /* ---------------- início ---------------- */
  async function iniciar() {
    const parametros = new URLSearchParams(window.location.search);
    estado.termo = (parametros.get("q") || "").trim();

    const spanTermo = document.getElementById("termoPesquisa");
    if (spanTermo) spanTermo.textContent = estado.termo ? "“" + estado.termo + "”" : "tudo";

    const campoBusca = document.getElementById("busca");
    if (campoBusca) campoBusca.value = estado.termo;

    configurarAbas();
    configurarFiltros();

    try {
      await carregarDados();
    } catch (erro) {
      console.error(erro);
      mostrarMensagem("Não foi possível conectar ao servidor.", "bi-exclamation-circle");
      return;
    }

    // categorias do banco que faltam no HTML viram chips também
    estado.categorias.forEach((c) => garantirChip(c.nome));

    // veio da home com ?categoria=...: abre direto na aba Itens com o filtro marcado
    if (aplicarCategoriasDaUrl()) configurarAbas.ativar("Itens");

    renderizar();
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();