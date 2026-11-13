
document.addEventListener("DOMContentLoaded", () => {
    carregarLojasPopulares();
});

const API_URL = "http://localhost:5000";

// Busca as lojas populares na API
async function carregarLojasPopulares() {
    const container = document.querySelector(
        "#cafeterias .container"
    );

    if (!container) return;

    try {
        const resposta = await fetch(
            `${API_URL}/lojas/populares?limite=3&incluir_produtos=true`
        );

        if (!resposta.ok) {
            throw new Error("Erro ao buscar lojas populares.");
        }

        const dados = await resposta.json();

        if (!dados.lojas || dados.lojas.length === 0) {
            container.innerHTML = `
                <p>Nenhuma cafeteria em destaque no momento.</p>
            `;
            return;
        }

        // Mantém o cabeçalho e remove os cards estáticos
        const cabecalho = container.querySelector(".cabecalhoSecao");

        container.innerHTML = "";

        if (cabecalho) {
            container.appendChild(cabecalho);
        }

        // Cria um bloco para cada loja
        dados.lojas.forEach(loja => {
            container.appendChild(criarCardLoja(loja));
        });

    } catch (erro) {
        console.error("Erro ao carregar cafeterias:", erro);
        container.innerHTML += `
            <p>Não foi possível carregar as cafeterias.</p>
        `;
    }
}

// Cria o card da loja e sua lista de produtos
function criarCardLoja(loja) {

    const bloco = document.createElement("div");
    bloco.className = "lojaBloco";

    const iniciais = loja.nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(palavra => palavra[0])
        .join("")
        .toUpperCase();

    // Seleciona os cinco produtos mais vendidos
    const produtos = (loja.produtos || [])
        .slice(0, 5);

    bloco.innerHTML = `
        <div class="lojaTopo">

            <article class="lojaCard">

                <div class="logoLoja">
                    ${escaparHTML(iniciais)}
                </div>

                <button class="favoritar"
                    aria-label="Favoritar ${escaparHTML(loja.nome)}">
                    <i class="bi bi-heart"></i>
                </button>

                <div class="lojaInfo">

                    <h3>
                        ${escaparHTML(loja.nome)}
                    </h3>

                    <p>Cafeteria parceira</p>

                    <small>
                        <strong>
                            <i class="bi bi-star-fill"></i>
                            ${loja.nota_media ?? "Sem avaliações"}
                        </strong>
                        · ${loja.total_avaliacoes} avaliações
                    </small>

                    <b>
                        ${loja.total_vendido} produtos vendidos
                    </b>

                </div>

            </article>

            <a class="linkSecao" href="#">
                Ver tudo
                <i class="bi bi-chevron-right"></i>
            </a>

        </div>

        <div class="listaProdutos listaProdutosLoja">

            ${produtos.map(produto => criarCardProduto(produto)).join("")}

        </div>
    `;

    return bloco;
}

// Cria cada card de produto
function criarCardProduto(produto) {

    const imagem = produto.foto_url
        ? `
            <img
                src="${escaparHTML(produto.foto_url)}"
                alt="${escaparHTML(produto.nome)}"
                class="imagemProduto"
            >
        `
        : `
            <div class="placeholderFoto fotoProduto">
                <i class="bi bi-image"></i>
                <span>Foto do produto</span>
            </div>
        `;

    return `
        <article class="produtoCard">

            ${imagem}

            <div class="produtoInfo">

                <h3 class="produtoNome">
                    ${escaparHTML(produto.nome)}
                </h3>

                <strong class="preco">
                    ${Number(produto.preco).toLocaleString(
                        "pt-BR",
                        {
                            style: "currency",
                            currency: "BRL"
                        }
                    )}
                </strong>

            </div>

            <button
                class="adicionar"
                data-produto="${produto.cod_produto}"
                aria-label="Adicionar ${escaparHTML(produto.nome)}"
            >
                <i class="bi bi-plus-lg"></i>
            </button>

        </article>
    `;
}

// Evita inserir conteúdo textual da API diretamente como HTML
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}
