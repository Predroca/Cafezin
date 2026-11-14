const API_URL = "http://localhost:5000";
const parametros = new URLSearchParams(window.location.search);
const codProduto = parametros.get("cod_produto");
let precoUnitario = 0;
let quantidade = 1;
const minimo = 1;
const maximo = 20;

function moeda(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Preço indisponível";
}

function textoSeguro(no, valor, padrao = "") {
    if (no) no.textContent = valor ?? padrao;
}

function atualizarQuantidade() {
    textoSeguro(document.getElementById("quantidade"), quantidade);
    textoSeguro(document.getElementById("totalItem"), moeda(precoUnitario * quantidade));
    const diminuir = document.getElementById("diminuirQuantidade");
    const aumentar = document.getElementById("aumentarQuantidade");
    if (diminuir) diminuir.disabled = quantidade <= minimo;
    if (aumentar) aumentar.disabled = quantidade >= maximo;
}

function desenharEstrelas(media) {
    const estrela = document.querySelector(".avaliacaoResumo .estrelas");
    if (!estrela) return;
    const nota = Number(media) || 0;
    const inteiras = Math.floor(nota);
    const meia = nota - inteiras >= 0.25 && nota - inteiras < 0.75;
    const total = Math.ceil(nota);
    estrela.innerHTML = Array.from({ length: 5 }, (_, i) => {
        const icone = i < inteiras ? "bi-star-fill" : (i === inteiras && meia ? "bi-star-half" : "bi-star");
        return `<i class="bi ${icone}"></i>`;
    }).join("");
    estrela.setAttribute("aria-label", `Nota ${nota.toLocaleString("pt-BR")} de 5`);
}

async function carregarProduto() {
    const nome = document.getElementById("produtoNome");
    if (!codProduto || !/^\d+$/.test(codProduto)) {
        textoSeguro(nome, "Produto não especificado");
        textoSeguro(document.getElementById("produtoDescricao"), "Volte à página inicial e selecione um produto.");
        return;
    }

    textoSeguro(nome, "Carregando produto...");
    try {
        const resposta = await fetch(`${API_URL}/produtos/${encodeURIComponent(codProduto)}`);
        if (!resposta.ok) throw new Error("Produto não encontrado.");
        const produto = await resposta.json();

        document.title = `Cafézin | ${produto.nome || "Produto"}`;
        textoSeguro(nome, produto.nome, "Produto");
        textoSeguro(document.getElementById("produtoDescricao"), produto.descricao, "Sem descrição disponível.");
        textoSeguro(document.getElementById("produtoPreco"), moeda(produto.preco));
        textoSeguro(document.getElementById("produtoTotalAvaliacoes"), Number(produto.total_avaliacoes) || 0);
        textoSeguro(document.querySelector(".notaGeral > strong"), produto.media_avaliacao == null ? "—" : Number(produto.media_avaliacao).toLocaleString("pt-BR"));
        textoSeguro(document.querySelector(".notaGeral small"), `${Number(produto.total_avaliacoes) || 0} avaliações`);
        textoSeguro(document.querySelector(".avaliacaoResumo > strong"), produto.media_avaliacao == null ? "—" : Number(produto.media_avaliacao).toLocaleString("pt-BR"));

        const linkLoja = document.getElementById("produtoLoja");
        textoSeguro(linkLoja?.querySelector("span"), produto.loja, "Cafeteria");
        if (linkLoja && produto.cod_loja) linkLoja.href = `perfilLoja.html?cod_loja=${encodeURIComponent(produto.cod_loja)}`;

        const selo = document.getElementById("produtoDisponibilidade");
        const disponivel = produto.disponibilidade !== false && produto.disponibilidade !== 0;
        textoSeguro(selo, disponivel ? "Disponível" : "Indisponível");
        selo?.classList.toggle("disponivel", disponivel);
        selo?.classList.toggle("indisponivel", !disponivel);

        const foto = document.getElementById("produtoFoto");
        if (foto && produto.foto_url) {
            foto.innerHTML = "";
            const imagem = document.createElement("img");
            imagem.src = produto.foto_url.startsWith("http") ? produto.foto_url : `${API_URL}/${produto.foto_url.replace(/^\//, "")}`;
            imagem.alt = produto.nome || "Foto do produto";
            foto.appendChild(imagem);
            foto.setAttribute("aria-label", produto.nome || "Foto do produto");
        }

        precoUnitario = Number(produto.preco) || 0;
        const botao = document.getElementById("botaoAdicionar");
        if (botao) {
            botao.dataset.preco = String(precoUnitario);
            botao.dataset.codProduto = String(produto.cod_produto);
            botao.disabled = !disponivel;
        }
        desenharEstrelas(produto.media_avaliacao);
        atualizarQuantidade();
    } catch (erro) {
        textoSeguro(nome, "Não foi possível carregar o produto");
        textoSeguro(document.getElementById("produtoDescricao"), erro.message || "Tente novamente mais tarde.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("diminuirQuantidade")?.addEventListener("click", () => {
        if (quantidade > minimo) quantidade--;
        atualizarQuantidade();
    });
    document.getElementById("aumentarQuantidade")?.addEventListener("click", () => {
        if (quantidade < maximo) quantidade++;
        atualizarQuantidade();
    });
    carregarProduto();
});
