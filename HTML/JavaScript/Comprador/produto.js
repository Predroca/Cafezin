/* ==========================================================
   produto.js  (JavaScript/Comprador/produto.js)

   Preenche produto.html com os dados do backend.
   Lê o código do produto da URL:  produto.html?cod=12

   Rotas usadas:
     GET /produtos/<cod>              -> detalhes do produto (tentada primeiro)
     GET /produtos                    -> lista; serve de plano B para achar o
                                         produto e alimenta "Mais da loja"
     GET /produtos/<cod>/avaliacoes   -> avaliações do produto (opcional)

   A sacola usa o adicionarSacola.js (precisa ser carregado antes).
   ========================================================== */
(function () {
  "use strict";

  const API_URL = (window.API_URL || "http://localhost:5000").replace(/\/$/, "");
  const MAX_MAIS_DA_LOJA = 4;

  const $ = (id) => document.getElementById(id);

  let produto = null;
  let quantidade = 1;

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

  async function pegarJson(rota) {
    const resposta = await fetch(API_URL + rota);
    if (!resposta.ok) throw new Error("Erro " + resposta.status + " em " + rota);
    return resposta.json();
  }

  function limiteQuantidade() {
    return typeof LIMITE_QUANTIDADE_ITEM === "number" ? LIMITE_QUANTIDADE_ITEM : 20;
  }

  // Padroniza o produto, venha ele de /produtos/<cod> ou de /produtos
  function normalizarProduto(p) {
    return {
      cod_produto: Number(p.cod_produto),
      cod_loja: Number(p.cod_loja),
      nome: p.nome || "Produto",
      preco: Number(p.preco),
      descricao: p.descricao || "",
      foto_url: p.foto_url || null,
      nome_loja: p.nome_loja || p.loja || "Cafeteria",
      disponibilidade: !(p.disponibilidade === false || p.disponibilidade === 0),
      nota_media: p.nota_media ?? null,
      total_avaliacoes: p.total_avaliacoes ?? null,
    };
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

  function formatarData(valor) {
    if (!valor) return "";
    const iso = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[3] + "/" + iso[2] + "/" + iso[1]; // evita erro de fuso horário
    const data = new Date(valor);
    return isNaN(data) ? String(valor) : data.toLocaleDateString("pt-BR");
  }

  /* ---------------- carregamento ---------------- */
  async function buscarProduto(cod, listaPromise) {
    try {
      const dados = await pegarJson("/produtos/" + cod);
      const p = dados.produto || dados;
      if (p && p.cod_produto != null) return normalizarProduto(p);
    } catch (erro) {
      // a rota individual pode não existir: segue para o plano B
    }

    const lista = await listaPromise;
    const achado = lista.find((p) => Number(p.cod_produto) === cod);
    return achado ? normalizarProduto(achado) : null;
  }

  async function buscarAvaliacoes(cod) {
    try {
      const dados = await pegarJson("/produtos/" + cod + "/avaliacoes");
      return Array.isArray(dados) ? { avaliacoes: dados } : dados;
    } catch (erro) {
      return null; // rota ainda não existe ou falhou
    }
  }

  /* ---------------- preenchimento da tela ---------------- */
  function mostrarErro(mensagem) {
    document.querySelector(".produtoDetalhe").innerHTML =
      '<div style="grid-column:1/-1;padding:48px 0;text-align:center">' +
      '<p style="margin-bottom:16px">' + escapar(mensagem) + "</p>" +
      '<a class="produtoLoja" href="indexComprador.html">Voltar ao início</a></div>';
    document.querySelector(".secaoAvaliacoes").hidden = true;
    document.querySelector(".secaoMaisDaLoja").hidden = true;
  }

  function preencherProduto(p) {
    document.title = "Cafézin | " + p.nome;
    $("migalhaProduto").textContent = p.nome;
    $("produtoNome").textContent = p.nome;
    $("produtoPreco").textContent = moeda(p.preco);
    $("produtoDescricao").textContent = p.descricao || "Este produto ainda não tem descrição.";

    // loja: leva para a pesquisa filtrada pelo nome da cafeteria
    const linkLoja = $("produtoLoja");
    linkLoja.href = "pesquisa.html?q=" + encodeURIComponent(p.nome_loja);
    linkLoja.querySelector("span").textContent = p.nome_loja;

    // foto
    const img = urlImagem(p.foto_url);
    const foto = $("produtoFoto");
    if (img) {
      foto.classList.remove("placeholderFoto");
      foto.removeAttribute("role");
      foto.removeAttribute("aria-label");
      foto.innerHTML = '<img src="' + escapar(img) + '" alt="' + escapar(p.nome) + '">';
    }

    // disponibilidade
    const selo = $("produtoDisponibilidade");
    if (p.disponibilidade) {
      selo.className = "selo disponivel";
      selo.innerHTML = '<i class="bi bi-check-circle-fill" aria-hidden="true"></i> Disponível';
    } else {
      selo.className = "selo indisponivel";
      selo.innerHTML = '<i class="bi bi-x-circle-fill" aria-hidden="true"></i> Indisponível';
      $("botaoAdicionar").disabled = true;
      $("botaoAdicionar").style.opacity = ".55";
      $("botaoAdicionar").style.cursor = "not-allowed";
      $("diminuirQuantidade").disabled = true;
      $("aumentarQuantidade").disabled = true;
    }

    $("botaoAdicionar").dataset.preco = p.preco;
    atualizarQuantidade();
  }

  function preencherAvaliacoes(dados, p) {
    const lista = (dados && dados.avaliacoes) || [];
    const total = Number(dados?.total_avaliacoes ?? p.total_avaliacoes ?? lista.length) || 0;

    let nota = dados?.nota_media ?? p.nota_media;
    if ((nota == null) && lista.length) {
      nota = lista.reduce((s, a) => s + Number(a.nota || 0), 0) / lista.length;
    }
    nota = Number(nota) || 0;

    const temNota = total > 0 && nota > 0;
    const textoTotal = total + (total === 1 ? " avaliação" : " avaliações");

    // resumo no topo
    $("produtoNota").textContent = temNota ? formatarNota(nota) : "–";
    $("produtoTotalAvaliacoes").parentElement.textContent = temNota ? "(" + textoTotal + ")" : "(sem avaliações)";
    document.querySelector(".avaliacaoResumo .estrelas").innerHTML = estrelasHtml(temNota ? nota : 0);

    // bloco da nota geral
    const geral = document.querySelector(".notaGeral");
    geral.querySelector("strong").textContent = temNota ? formatarNota(nota) : "–";
    geral.querySelector(".estrelas").innerHTML = estrelasHtml(temNota ? nota : 0);
    geral.querySelector("small").textContent = temNota ? textoTotal : "Sem avaliações";

    // lista (remove os itens de exemplo do HTML)
    const container = document.querySelector(".listaAvaliacoes");
    if (!lista.length) {
      container.innerHTML = '<p>Este produto ainda não recebeu avaliações.</p>';
      return;
    }

    container.innerHTML = lista.map((a) => {
      const n = Number(a.nota) || 0;
      const nome = a.nome_comprador || a.comprador || a.nome || "Comprador";
      return (
        '<article class="avaliacaoItem">' +
          '<div class="avaliacaoTopo">' +
            '<i class="bi bi-person-circle" aria-hidden="true"></i>' +
            "<div><h3>" + escapar(nome) + "</h3><small>" + escapar(formatarData(a.data || a.data_avaliacao)) + "</small></div>" +
            '<span class="estrelas" aria-label="Nota ' + n + ' de 5">' + estrelasHtml(n) + "</span>" +
          "</div>" +
          (a.descricao ? "<p>" + escapar(a.descricao) + "</p>" : "") +
        "</article>"
      );
    }).join("");
  }

  // Cards no mesmo formato dos outros (o adicionarSacola.js e o abrirProduto.js lêem os data-*)
  function cardMaisDaLoja(p, indice) {
    const cores = ["", "dourada", "rosa", "azul"];
    const img = urlImagem(p.foto_url);
    const foto = img
      ? '<div class="fotoProduto"><img class="imagemProdutoMaisPedido" src="' + escapar(img) + '" alt="' + escapar(p.nome) + '"></div>'
      : '<div class="placeholderFoto fotoProduto ' + cores[indice % cores.length] + '" role="img" aria-label="Sem foto de ' + escapar(p.nome) + '">' +
          '<i class="bi bi-image"></i><span>Foto do produto</span></div>';

    return (
      '<article class="produtoCard"' +
        ' data-cod-produto="' + p.cod_produto + '"' +
        ' data-cod-loja="' + p.cod_loja + '"' +
        ' data-nome="' + escapar(p.nome) + '"' +
        ' data-preco="' + Number(p.preco) + '"' +
        ' data-nome-loja="' + escapar(p.nome_loja) + '"' +
        ' data-foto="' + escapar(img || "") + '">' +
        foto +
        '<div class="produtoInfo">' +
          '<p class="lojaNome">' + escapar(p.nome_loja) + "</p>" +
          '<h3 class="produtoNome">' + escapar(p.nome) + "</h3>" +
          '<strong class="preco">' + moeda(p.preco) + "</strong>" +
        "</div>" +
        '<button class="adicionar" type="button" aria-label="Adicionar ' + escapar(p.nome) + '">' +
          '<i class="bi bi-plus-lg"></i></button>' +
      "</article>"
    );
  }

  function preencherMaisDaLoja(lista, p) {
    const secao = document.querySelector(".secaoMaisDaLoja");
    const outros = lista
      .map(normalizarProduto)
      .filter((x) => x.cod_loja === p.cod_loja && x.cod_produto !== p.cod_produto)
      .slice(0, MAX_MAIS_DA_LOJA);

    if (!outros.length) {
      secao.hidden = true;
      return;
    }

    $("titulo-mais-loja").textContent = "Mais de " + p.nome_loja;
    secao.querySelector(".listaProdutos").innerHTML = outros.map(cardMaisDaLoja).join("");
  }

  /* ---------------- quantidade e sacola ---------------- */
  function atualizarQuantidade() {
    $("quantidade").textContent = quantidade;
    $("diminuirQuantidade").disabled = quantidade <= 1;
    $("aumentarQuantidade").disabled = quantidade >= limiteQuantidade() || (produto && !produto.disponibilidade);

    const preco = produto ? produto.preco : Number($("botaoAdicionar").dataset.preco);
    $("totalItem").textContent = moeda(preco * quantidade);
  }

  function configurarCompra() {
    $("diminuirQuantidade").addEventListener("click", () => {
      if (quantidade > 1) { quantidade--; atualizarQuantidade(); }
    });

    $("aumentarQuantidade").addEventListener("click", () => {
      if (quantidade < limiteQuantidade()) { quantidade++; atualizarQuantidade(); }
    });

    $("botaoAdicionar").addEventListener("click", () => {
      if (!produto || !produto.disponibilidade) return;

      if (typeof adicionarNaSacola !== "function") {
        console.error("adicionarSacola.js precisa ser carregado antes do produto.js.");
        return;
      }

      const adicionado = adicionarNaSacola({
        cod_produto: produto.cod_produto,
        nome: produto.nome,
        preco: produto.preco,
        foto_url: urlImagem(produto.foto_url),
        cod_loja: produto.cod_loja,
        nome_loja: produto.nome_loja,
      }, quantidade);

      if (adicionado) {
        quantidade = 1;
        atualizarQuantidade();
      }
    });
  }

  /* ---------------- início ---------------- */
  async function iniciar() {
    configurarCompra();

    const cod = Number(new URLSearchParams(window.location.search).get("cod"));
    if (!Number.isInteger(cod) || cod <= 0) {
      mostrarErro("Produto não encontrado.");
      return;
    }

    // /produtos é buscado em paralelo: serve de plano B e alimenta "Mais da loja"
    const listaPromise = pegarJson("/produtos").then((d) => d.produtos || []).catch(() => []);

    try {
      produto = await buscarProduto(cod, listaPromise);
    } catch (erro) {
      console.error(erro);
      mostrarErro("Não foi possível conectar ao servidor.");
      return;
    }

    if (!produto) {
      mostrarErro("Produto não encontrado ou indisponível.");
      return;
    }

    preencherProduto(produto);

    const [avaliacoes, lista] = await Promise.all([buscarAvaliacoes(cod), listaPromise]);
    preencherAvaliacoes(avaliacoes, produto);
    preencherMaisDaLoja(lista, produto);
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();