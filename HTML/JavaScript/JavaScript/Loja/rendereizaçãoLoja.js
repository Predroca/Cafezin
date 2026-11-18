/*
 * Cafézin - integração do painel da loja com loja_bp.py
 *
 * Rotas utilizadas:
 * GET /loja/dashboard
 * GET /loja/produtos
 * GET /loja/perfil
 *
 * Ajuste TOKEN_STORAGE_KEY para a chave usada pelo login ao salvar o JWT.
 */

(() => {
    "use strict";

    const API_URL = "http://localhost:5000";
    const TOKEN_STORAGE_KEY = 'token'; //mudar de acordo com o token

    document.addEventListener("DOMContentLoaded", iniciarDashboardLoja);

    async function iniciarDashboardLoja() {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        console.log("Token encontrado no dashboard:", token);
        if (!token) {
            console.error(
                `JWT não encontrado. Confira a chave "${TOKEN_STORAGE_KEY}" usada pelo login.`
            );

            mostrarAviso("Faça login como loja para visualizar os dados.");
            return;
        }

        await Promise.allSettled([
            carregarDashboard(token),
            carregarProdutos(token),
            carregarPerfil(token)
        ]);
    }

    // =====================================================
    // REQUISIÇÕES À API
    // =====================================================

    async function requisicaoAPI(caminho, token) {
        const resposta = await fetch(`${API_URL}${caminho}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        const texto = await resposta.text();
        let dados = {};

        try {
            dados = texto ? JSON.parse(texto) : {};
        } catch {
            throw new Error("A API retornou uma resposta que não é JSON.");
        }

        if (!resposta.ok) {
            const mensagem =
                dados.error ||
                dados.message ||
                `Erro HTTP ${resposta.status}`;

            throw new Error(mensagem);
        }

        return dados;
    }

    // =====================================================
    // 1. INDICADORES DO DASHBOARD
    // =====================================================

    async function carregarDashboard(token) {
        try {
            const dados = await requisicaoAPI(
                "/loja/dashboard",
                token
            );

            const valores = document.querySelectorAll(
                ".dashCard .dashValor"
            );

            // Ordem dos cards no indexLoja.html:
            // 0 - Pedidos hoje
            // 1 - Produtos ativos
            // 2 - Avaliação média
            // 3 - Faturamento

            if (valores[0]) {
                valores[0].textContent = dados.pedidos_hoje ?? 0;
            }

            if (valores[1]) {
                valores[1].textContent = dados.produtos_ativos ?? 0;
            }

            if (valores[2]) {
                valores[2].textContent =
                    dados.avaliacao_media == null
                        ? "—"
                        : Number(dados.avaliacao_media).toLocaleString(
                            "pt-BR",
                            {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1
                            }
                        );
            }

            if (valores[3]) {
                valores[3].textContent = formatarMoeda(
                    dados.faturado_hoje
                );
            }

        } catch (erro) {
            console.error(
                "Erro ao carregar dashboard:",
                erro
            );

            mostrarAviso(
                `Não foi possível carregar os indicadores: ${erro.message}`
            );
        }
    }

    // =====================================================
    // 2. PRODUTOS DA LOJA
    // =====================================================

    async function carregarProdutos(token) {
        const lista = document.querySelector(
            ".listaProdutosLoja"
        );

        if (!lista) return;

        try {
            const dados = await requisicaoAPI(
                "/loja/produtos",
                token
            );

            const produtos = Array.isArray(dados.produtos)
                ? dados.produtos
                : [];

            lista.replaceChildren();

            if (produtos.length === 0) {
                lista.innerHTML = `
                    <p class="mensagemDashboard">
                        Você ainda não cadastrou produtos.
                    </p>
                `;

                return;
            }

            produtos.forEach(produto => {
                lista.appendChild(
                    criarCardProduto(produto)
                );
            });

        } catch (erro) {
            console.error(
                "Erro ao carregar produtos:",
                erro
            );

            lista.innerHTML = `
                <p class="mensagemDashboard">
                    Não foi possível carregar os produtos:
                    ${escaparHTML(erro.message)}
                </p>
            `;
        }
    }



    function criarCardProduto(produto) {
        const card = document.createElement("article");

        const disponivel = Boolean(
            produto.disponibilidade
        );

        card.className = `produto Loja${disponivel ? "" : " pausado"}`;

        card.dataset.categoria =
            produto.cod_categoria ?? "";

        card.dataset.codProduto =
            produto.cod_produto;

        card.dataset.disponibilidade =
            String(disponivel);

        // FOTO DO PRODUTO

        const foto = document.createElement("div");

        foto.className =
            "placeholderFoto fotoProdutoLoja";

        foto.setAttribute("role", "img");

        foto.setAttribute(
            "aria-label",
            produto.foto_url
                ? `Foto de ${produto.nome}`
                : `Sem foto para ${produto.nome}`
        );

        if (produto.foto_url) {
            const imagem = document.createElement("img");

            imagem.src = produto.foto_url;
            imagem.alt = produto.nome || "Foto do produto";
            imagem.loading = "lazy";

            imagem.onerror = () => imagem.remove();

            foto.appendChild(imagem);
        }

        // INFORMAÇÕES

        const informacoes = document.createElement("div");

        informacoes.className = "produtoInfoLoja";

        const linha = document.createElement("div");

        linha.className = "produtoInfoLinha";

        const titulo = document.createElement("h3");

        titulo.textContent =
            produto.nome || "Produto sem nome";

        linha.appendChild(titulo);

        const descricao = document.createElement("p");

        descricao.textContent =
            produto.descricao || "Sem descrição.";

        // RODAPÉ DO CARD

        const rodape = document.createElement("div");

        rodape.className = "produtoInfoRodape";

        const preco = document.createElement("strong");

        preco.textContent = formatarMoeda(
            produto.preco
        );

        // BOTÃO DE EDIÇÃO

        const acoes = document.createElement("div");

        acoes.className = "produtoAcoes";

        const editar = document.createElement("a");

        editar.href =
            `editarProduto.html?cod_produto=${encodeURIComponent(produto.cod_produto)}`;

        editar.setAttribute(
            "aria-label",
            `Editar ${produto.nome || "produto"}`
        );

        editar.innerHTML =
            '<i class="bi bi-pencil" aria-hidden="true"></i>';

        acoes.appendChild(editar);

        rodape.append(preco, acoes);

        informacoes.append(
            linha,
            descricao,
            rodape
        );

        card.append(
            foto,
            informacoes
        );

        return card;
    }

    // =====================================================
    // 3. PERFIL DA LOJA
    // =====================================================

    async function carregarPerfil(token) {
        try {
            const perfil = await requisicaoAPI(
                "/loja/perfil",
                token
            );

            const saudacao = document.querySelector(
                ".painelSaudacao"
            );

            if (saudacao && perfil.nome) {
                saudacao.textContent =
                    `Bem-vindo(a), ${perfil.nome}`;
            }

        } catch (erro) {
            console.error(
                "Erro ao carregar perfil da loja:",
                erro
            );
        }
    }

    // =====================================================
    // FUNÇÕES AUXILIARES
    // =====================================================

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
    }

    function escaparHTML(valor) {
        return String(valor ?? "").replace(
            /[&<>"']/g,
            caractere => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[caractere]
        );
    }

    function mostrarAviso(mensagem) {
        console.warn(mensagem);

        const painel = document.querySelector(
            ".secaoDashboard .container"
        );

        if (
            !painel ||
            document.querySelector(".avisoDashboard")
        ) {
            return;
        }

        const aviso = document.createElement("p");

        aviso.className = "avisoDashboard";
        aviso.textContent = mensagem;

        painel.prepend(aviso);
    }

})();