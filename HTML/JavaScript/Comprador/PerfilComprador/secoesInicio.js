
const API_URL = "http://localhost:5000";
const LIMITE_LOJAS = 20;

document.addEventListener("DOMContentLoaded", () => {
    carregarLojasParceiras();
    carregarMaisPedidos();
});


// ==========================================
// 1. CAFETERIAS PARCEIRAS
// ==========================================

async function carregarLojasParceiras() {
    const lista = document.querySelector(
        "#produtos .listaLojasParceiras"
    );

    if (!lista) return;

    try {
        lista.innerHTML = "<p>Carregando cafeterias...</p>";

        let offset = 0;
        let todasLojas = [];
        let continuar = true;

        // Busca todas as páginas de cafeterias.
        while (continuar) {
            const parametros = new URLSearchParams({
                limite: LIMITE_LOJAS,
                offset: offset,
                incluir_produtos: "false"
            });

            const resposta = await fetch(
                `${API_URL}/lojas/populares?${parametros}`
            );

            if (!resposta.ok) {
                throw new Error("Erro ao buscar cafeterias");
            }

            const dados = await resposta.json();
            const lojas = dados.lojas || [];

            todasLojas.push(...lojas);

            offset += lojas.length;

            if (lojas.length < LIMITE_LOJAS) {
                continuar = false;
            }
        }

        lista.innerHTML = "";

        if (todasLojas.length === 0) {
            lista.innerHTML =
                "<p>Nenhuma cafeteria encontrada.</p>";
            return;
        }

        todasLojas.forEach(loja => {
            lista.appendChild(criarCardLojaParceira(loja));
        });

    } catch (erro) {
        console.error("Erro ao carregar cafeterias:", erro);

        lista.innerHTML =
            "<p>Não foi possível carregar as cafeterias.</p>";
    }
}


function criarCardLojaParceira(loja) {
    const card = document.createElement("article");

    card.className = "lojaParceiraCard";

    const iniciais = loja.nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(palavra => palavra[0])
        .join("")
        .toUpperCase();

    const logo = loja.foto_url
        ? `<img src="${escaparHTML(loja.foto_url)}"
                alt="Logo de ${escaparHTML(loja.nome)}">`
        : escaparHTML(iniciais);

    card.innerHTML = `
        <div class="logoLojaParceira">
            ${logo}
        </div>

        <button class="favoritar"
                aria-label="Favoritar ${escaparHTML(loja.nome)}">
            <i class="bi bi-heart"></i>
        </button>

        <div class="lojaInfo">
            <h3>${escaparHTML(loja.nome)}</h3>

            <p>Cafeteria parceira</p>

            <small>
                <strong>
                    <i class="bi bi-star-fill"></i>
                    ${Number(loja.nota_media).toFixed(1)}
                </strong>
                · ${loja.total_avaliacoes} avaliações
            </small>
        </div>
    `;

    return card;
}


// ==========================================
// 2. MAIS PEDIDOS
// ==========================================

async function carregarMaisPedidos() {
    const lista = document.querySelector(
        "#OutrasLojas .listaLojasOut"
    );

    if (!lista) return;

    try {
        lista.innerHTML = "<p>Carregando produtos...</p>";

        const resposta = await fetch(
            `${API_URL}/produtos/populares?limite=10`
        );

        if (!resposta.ok) {
            throw new Error("Erro ao buscar produtos populares");
        }

        const dados = await resposta.json();

        lista.innerHTML = "";

        const produtos = dados.produtos || [];

        if (produtos.length === 0) {
            lista.innerHTML =
                "<p>Nenhum produto encontrado.</p>";
            return;
        }

        produtos.forEach(produto => {
            lista.appendChild(criarCardMaisPedido(produto));
        });

    } catch (erro) {
        console.error("Erro ao carregar mais pedidos:", erro);

        lista.innerHTML =
            "<p>Não foi possível carregar os produtos.</p>";
    }
}


function criarCardMaisPedido(produto) {
    const card = document.createElement("article");
    card.className = "OutrasLojasCard";

    const nome = produto.nome || "Produto";

    const foto = produto.foto_url
        ? `
            <img
                src="${escaparHTML(produto.foto_url)}"
                alt="${escaparHTML(nome)}"
                class="imagemProdutoMaisPedido"
            >
        `
        : `
            <i class="bi bi-image"></i>
            <span>Foto do produto</span>
        `;

    card.innerHTML = `
        <div class="placeholderFoto fotoProduto">
            ${foto}
        </div>

        <div class="produtoInfo">
            <p class="lojaNome">
                ${escaparHTML(produto.nome_loja)}
            </p>

            <h3 class="produtoNome">
                ${escaparHTML(nome)}
            </h3>

            <strong class="preco">
                ${formatarPreco(produto.preco)}
            </strong>
        </div>

        <button
            class="adicionar"
            type="button"
            aria-label="Adicionar ${escaparHTML(nome)}"
            data-cod-produto="${escaparHTML(produto.cod_produto)}"
        >
            <i class="bi bi-plus-lg"></i>
        </button>
    `;

    return card;
}


// ==========================================
// 3. FUNÇÕES AUXILIARES
// ==========================================

function formatarPreco(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "Preço indisponível";
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}
