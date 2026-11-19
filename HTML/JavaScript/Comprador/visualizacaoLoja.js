/* ==========================================================
   visualizacaoLoja.js  (JavaScript/Comprador/visualizacaoLoja.js)

   Preenche visualizacaoLoja.html com dados do backend.
   Lê o código da loja da URL:  visualizacaoLoja.html?cod=3

   Rotas usadas:
     GET /lojas/<cod>/cardapio    -> nome, foto, horário, se está aberta,
                                     nota média, total de avaliações e produtos
     GET /lojas/<cod>/avaliacoes  -> lista de avaliações da loja (OPCIONAL:
                                     essa rota ainda não existe no backend;
                                     sem ela a página mostra só o resumo)

   Formato aceito para /lojas/<cod>/avaliacoes:
     { "avaliacoes": [ { "nota": 5, "descricao": "...", "data": "2026-09-12",
                         "nome_comprador": "Maria" } ] }
   (também aceita uma lista direta, e "comprador"/"nome" no lugar de
   "nome_comprador", e "data_avaliacao" no lugar de "data")

   Produtos: se o backend mandar "disponibilidade": false, o card fica
   acinzentado e sem clique. Se o campo não vier, o produto conta como
   disponível.

   A sacola usa o adicionarSacola.js (precisa ser carregado antes).
   ========================================================== */
(function () {
  "use strict";

  const API_URL = (window.API_URL || "http://localhost:5000").replace(/\/$/, "");
  const AVALIACOES_VISIVEIS = 5;   // quantas aparecem antes de expandir
  const ALTURA_FADE = 70;          // px do 6º item que aparecem sob o fade

  const $ = (id) => document.getElementById(id);

  /* ---------------- utilidades ---------------- */
  function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function moeda(valor) {
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
    if (!resposta.ok) {
      const erro = new Error("Erro " + resposta.status + " em " + rota);
      erro.status = resposta.status;
      throw erro;
    }
    return resposta.json();
  }

  function estrelasHtml(nota) {
    const n = Number(nota) || 0;
    let html = "";
    for (let i = 1; i <= 5; i++) {
      const icone = n >= i ? "bi-star-fill" : n >= i - 0.5 ? "bi-star-half" : "bi-star";
      html += '<i class="bi ' + icone + '"></i>';
    }
    return html;
  }

  function formatarNota(nota) {
    return Number(nota).toFixed(1).replace(".", ",");
  }

  function textoTotal(total) {
    return total + (total === 1 ? " avaliação" : " avaliações");
  }

  function formatarData(valor) {
    if (!valor) return "";
    const iso = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[3] + "/" + iso[2] + "/" + iso[1]; // evita erro de fuso horário
    const data = new Date(valor);
    return isNaN(data) ? String(valor) : data.toLocaleDateString("pt-BR");
  }

  /* ---------------- carregamento ---------------- */
  async function buscarAvaliacoes(cod) {
    try {
      const dados = await pegarJson("/lojas/" + cod + "/avaliacoes");
      const lista = Array.isArray(dados) ? dados : (dados.avaliacoes || []);
      return lista;
    } catch (erro) {
      return null; // rota ainda não existe ou falhou
    }
  }

  /* ---------------- cabeçalho da loja ---------------- */
  function mostrarErro(mensagem) {
    document.querySelector(".paginaLoja .container").innerHTML =
      '<div class="erroLoja"><p>' + escapar(mensagem) + "</p>" +
      '<a class="voltarCardapio" href="indexComprador.html"><i class="bi bi-arrow-left" aria-hidden="true"></i> Voltar ao início</a></div>';
    $("cardapioLoja").hidden = true;
    $("avaliacoes").hidden = true;
  }

  function preencherLoja(loja) {
    document.title = "Cafézin | " + loja.nome;
    $("migalhaLoja").textContent = loja.nome;
    $("lojaNome").textContent = loja.nome;

    // logo: foto da loja ou iniciais
    const img = urlImagem(loja.foto_url);
    const marca = $("lojaMarca");
    marca.innerHTML = img
      ? '<img src="' + escapar(img) + '" alt="" class="lojaMarcaImg">'
      : escapar(iniciais(loja.nome));

    // selo aberta / fechada
    const selo = $("seloLoja");
    if (loja.aberta === true) {
      selo.className = "seloLoja";
      selo.innerHTML = '<i class="bi bi-shop" aria-hidden="true"></i>Aberta';
    } else if (loja.aberta === false) {
      selo.className = "seloLoja fechada";
      selo.innerHTML = '<i class="bi bi-shop" aria-hidden="true"></i>Fechada';
    } else {
      selo.hidden = true;
    }

    // nota
    const total = Number(loja.total_avaliacoes) || 0;
    const temNota = total > 0 && loja.nota_media != null;
    const resumo = $("avaliacaoResumoLoja");
    resumo.innerHTML = temNota
      ? '<span class="estrelasLoja" aria-label="' + formatarNota(loja.nota_media) + ' de 5 estrelas">' + estrelasHtml(loja.nota_media) + "</span>" +
        "<strong>" + formatarNota(loja.nota_media) + "</strong>" +
        '<a href="#avaliacoes">(' + textoTotal(total) + ")</a>"
      : "<span>Sem avaliações</span>";

    // indicadores (só o que o backend realmente informa)
    const itens = [];
    if (loja.horario_abertura && loja.horario_fecha) {
      itens.push('<span><i class="bi bi-calendar-week" aria-hidden="true"></i> Funcionamento: ' +
        escapar(loja.horario_abertura) + " às " + escapar(loja.horario_fecha) + "</span>");
    }
    if (loja.aberta === true) {
      itens.push('<span><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Recebendo pedidos</span>');
    } else if (loja.aberta === false) {
      itens.push('<span><i class="bi bi-x-circle-fill" aria-hidden="true"></i> Fora do horário de atendimento</span>');
    }
    itens.push('<span><i class="bi bi-bicycle" aria-hidden="true"></i> Frete R$ 5,00 · grátis a partir de R$ 25,00</span>');
    $("lojaIndicadores").innerHTML = itens.join("");
  }

  /* ---------------- cardápio ---------------- */
  function produtoDisponivel(p) {
    return !(p.disponibilidade === false || p.disponibilidade === 0);
  }

  function cardProduto(p, loja, indice) {
    const disponivel = produtoDisponivel(p);
    const cores = ["", "dourada", "rosa", "azul"];
    const img = urlImagem(p.foto_url);
    const foto = img
      ? '<div class="fotoProduto"><img class="imagemProdutoMaisPedido" src="' + escapar(img) + '" alt="' + escapar(p.nome) + '"></div>'
      : '<div class="placeholderFoto fotoProduto ' + cores[indice % cores.length] + '" role="img" aria-label="Sem foto de ' + escapar(p.nome) + '">' +
          '<i class="bi bi-image"></i><span>Foto do produto</span></div>';

    const nome = disponivel
      ? '<a class="linkProduto" href="produto.html?cod=' + p.cod_produto + '">' + escapar(p.nome) + "</a>"
      : escapar(p.nome);

    // o adicionarSacola.js lê estes data-* do próprio card
    return (
      '<article class="produtoCard' + (disponivel ? "" : " indisponivel") + '"' +
        (disponivel ? "" : ' aria-disabled="true"') +
        ' data-cod-produto="' + p.cod_produto + '"' +
        ' data-cod-loja="' + loja.cod_loja + '"' +
        ' data-nome="' + escapar(p.nome) + '"' +
        ' data-preco="' + Number(p.preco) + '"' +
        ' data-nome-loja="' + escapar(loja.nome) + '"' +
        ' data-foto="' + escapar(img || "") + '">' +
        foto +
        '<div class="produtoInfo">' +
          '<p class="lojaNome">' + escapar(loja.nome) + "</p>" +
          '<h3 class="produtoNome">' + nome + "</h3>" +
          '<strong class="preco">' + moeda(p.preco) + "</strong>" +
          (disponivel ? "" : '<span class="seloIndisponivel">Indisponível</span>') +
        "</div>" +
        '<button class="adicionar" type="button"' + (disponivel ? "" : " disabled") +
          ' aria-label="' + (disponivel ? "Adicionar " : "Indisponível: ") + escapar(p.nome) + '">' +
          '<i class="bi bi-plus-lg"></i></button>' +
      "</article>"
    );
  }

  function secaoCategoria(titulo, cardsHtml, primeira, indice) {
    return (
      '<section class="secaoPadrao ' + (primeira ? "secaoMaisDaLoja" : "secaoMaisMaisDaLoja") + '" aria-labelledby="categoria-' + indice + '">' +
        '<div class="container">' +
          (primeira
            ? '<div class="cabecalhoSecao tituloparacats"><h2>Produtos da cafeteria</h2><p>Itens para adicionar ao seu pedido</p></div>'
            : "") +
          '<div class="cabecalhoSecao categorias"><h2 id="categoria-' + indice + '">' + escapar(titulo) + "</h2></div>" +
          '<div class="listaProdutos">' + cardsHtml + "</div>" +
        "</div>" +
      "</section>"
    );
  }

  function renderizarCardapio(loja) {
    const alvo = $("cardapioLoja");
    const produtos = loja.produtos || [];

    if (!produtos.length) {
      alvo.innerHTML =
        '<section class="secaoPadrao secaoMaisDaLoja"><div class="container">' +
        '<div class="cabecalhoSecao tituloparacats"><h2>Produtos da cafeteria</h2></div>' +
        '<p class="mensagemLoja">Esta cafeteria ainda não tem produtos no cardápio.</p></div></section>';
      return;
    }

    // agrupa por categoria, mantendo a ordem do backend ("Outros" fica por último)
    const grupos = new Map();
    produtos.forEach((p) => {
      const nome = p.categoria || "Outros";
      if (!grupos.has(nome)) grupos.set(nome, []);
      grupos.get(nome).push(p);
    });
    const lista = Array.from(grupos.entries()).sort((a, b) => (a[0] === "Outros") - (b[0] === "Outros"));

    alvo.innerHTML = lista.map(([nome, itens], i) =>
      secaoCategoria(nome, itens.map((p, j) => cardProduto(p, loja, j)).join(""), i === 0, i)
    ).join("");
  }

  // clicar no card (fora do botão "+") abre a tela do produto; indisponíveis não abrem
  function configurarCliqueNosProdutos() {
    $("cardapioLoja").addEventListener("click", (evento) => {
      if (evento.target.closest("button, a")) return; // "+" e o link do nome se resolvem sozinhos
      const card = evento.target.closest(".produtoCard");
      if (!card || card.classList.contains("indisponivel")) return;
      window.location.href = "produto.html?cod=" + card.dataset.codProduto;
    });
  }

  /* ---------------- avaliações ---------------- */
  function preencherNotaGeral(loja, lista) {
    const total = Number(loja.total_avaliacoes) || 0;
    const temNota = total > 0 && loja.nota_media != null;
    const aside = $("notaGeralLoja");

    let distribuicao = "";
    if (temNota && lista && lista.length) {
      const contagem = [0, 0, 0, 0, 0, 0];
      lista.forEach((a) => {
        const n = Math.round(Number(a.nota));
        if (n >= 1 && n <= 5) contagem[n]++;
      });
      const base = contagem.reduce((s, c) => s + c, 0) || 1;
      let linhas = "";
      for (let n = 5; n >= 1; n--) {
        linhas +=
          "<div><span>" + n + '</span><i class="bi bi-star-fill" aria-hidden="true"></i>' +
          '<div class="barraNota"><span style="width:' + Math.round((contagem[n] / base) * 100) + '%"></span></div>' +
          "<small>" + contagem[n] + "</small></div>";
      }
      distribuicao = '<div class="distribuicaoNotas" aria-label="Distribuição das notas">' + linhas + "</div>";
    }

    aside.innerHTML =
      "<strong>" + (temNota ? formatarNota(loja.nota_media) : "–") + "</strong>" +
      '<span class="estrelasLoja" aria-hidden="true">' + estrelasHtml(temNota ? loja.nota_media : 0) + "</span>" +
      "<small>" + (temNota ? textoTotal(total) : "Sem avaliações") + "</small>" +
      distribuicao;
  }

  function itemAvaliacao(a) {
    const n = Number(a.nota) || 0;
    const nome = a.nome_comprador || a.comprador || a.nome || "Comprador";
    return (
      '<article class="avaliacaoItemLoja">' +
        '<div class="avaliacaoTopoLoja">' +
          '<i class="bi bi-person-circle" aria-hidden="true"></i>' +
          "<div><h3>" + escapar(nome) + "</h3><small>" + escapar(formatarData(a.data || a.data_avaliacao)) + "</small></div>" +
          '<span class="estrelasLoja" aria-label="' + n + ' de 5 estrelas">' + estrelasHtml(n) + "</span>" +
        "</div>" +
        (a.descricao ? "<p>" + escapar(a.descricao) + "</p>" : "") +
      "</article>"
    );
  }

  function renderizarAvaliacoes(loja, lista) {
    preencherNotaGeral(loja, lista);

    const coluna = $("colunaAvaliacoes");
    const total = Number(loja.total_avaliacoes) || 0;

    if (lista === null) {
      coluna.innerHTML = total > 0
        ? '<p class="mensagemLoja">Os comentários dos clientes não puderam ser carregados agora.</p>'
        : '<p class="mensagemLoja">Esta loja ainda não recebeu avaliações.</p>';
      return;
    }
    if (!lista.length) {
      coluna.innerHTML = '<p class="mensagemLoja">Esta loja ainda não recebeu avaliações.</p>';
      return;
    }

    coluna.innerHTML =
      '<div class="listaAvaliacoesLoja" id="listaAvaliacoes">' + lista.map(itemAvaliacao).join("") + "</div>";

    if (lista.length > AVALIACOES_VISIVEIS) configurarExpansao(coluna, $("listaAvaliacoes"), lista.length);
  }

  // Mostra só as 5 primeiras (com um pedaço da 6ª sob um fade) e uma seta para expandir
  function configurarExpansao(coluna, lista, quantidade) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "expandirAvaliacoes";
    botao.setAttribute("aria-expanded", "false");
    botao.setAttribute("aria-controls", "listaAvaliacoes");
    botao.innerHTML =
      '<span class="textoExpandir">Ver todas as ' + quantidade + ' avaliações</span>' +
      '<i class="bi bi-chevron-down" aria-hidden="true"></i>';
    coluna.appendChild(botao);

    let expandida = false;

    function alturaRecolhida() {
      const sexta = lista.children[AVALIACOES_VISIVEIS];
      const topo = sexta.getBoundingClientRect().top - lista.getBoundingClientRect().top;
      return Math.min(lista.scrollHeight, Math.round(topo + ALTURA_FADE));
    }

    function recolher(animar) {
      if (animar) {
        lista.style.maxHeight = lista.scrollHeight + "px";
        void lista.offsetHeight; // força o navegador a registrar a altura inicial
      }
      lista.classList.add("recolhida");
      lista.style.maxHeight = alturaRecolhida() + "px";
    }

    function expandir() {
      lista.classList.remove("recolhida");
      lista.style.maxHeight = lista.scrollHeight + "px";
      const liberar = () => { if (expandida) lista.style.maxHeight = "none"; };
      lista.addEventListener("transitionend", liberar, { once: true });
      setTimeout(liberar, 600); // segurança caso a transição não dispare
    }

    function alternar() {
      expandida = !expandida;
      botao.setAttribute("aria-expanded", String(expandida));
      botao.classList.toggle("aberta", expandida);
      botao.querySelector(".textoExpandir").textContent =
        expandida ? "Mostrar menos" : "Ver todas as " + quantidade + " avaliações";

      if (expandida) {
        expandir();
      } else {
        recolher(true);
        $("avaliacoes").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    botao.addEventListener("click", alternar);
    window.addEventListener("resize", () => { if (!expandida) recolher(false); });

    recolher(false);
  }

  /* ---------------- início ---------------- */
  async function iniciar() {
    configurarCliqueNosProdutos();

    const cod = Number(new URLSearchParams(window.location.search).get("cod"));
    if (!Number.isInteger(cod) || cod <= 0) {
      mostrarErro("Loja não encontrada.");
      return;
    }

    let loja;
    try {
      loja = await pegarJson("/lojas/" + cod + "/cardapio");
    } catch (erro) {
      console.error(erro);
      mostrarErro(erro.status === 404 ? "Loja não encontrada." : "Não foi possível conectar ao servidor.");
      return;
    }

    preencherLoja(loja);
    renderizarCardapio(loja);

    const avaliacoes = await buscarAvaliacoes(cod);
    renderizarAvaliacoes(loja, avaliacoes);
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();