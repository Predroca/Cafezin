/*
 * Cafézin - telas criarProduto.html e editarProduto.html
 *
 * Um único script para as duas telas (o modo é detectado pelo nome da página).
 *
 * Rotas utilizadas:
 *   GET   /loja/perfil                            (cod_loja - só na criação)
 *   GET   /categorias                             (opções do select)
 *   POST  /registrar_produto/<cod_loja>/<nome>    (criar)
 *   GET   /loja/produtos                          (carregar o produto na edição)
 *   PATCH /loja/produtos/<cod_produto>            (salvar a edição)
 */

(() => {
    "use strict";

    const API_URL = "http://localhost:5000";
    const TOKEN_STORAGE_KEY = "token";

    // A API só tem o campo foto_url (texto). A imagem escolhida é reduzida e
    // enviada como data URL; a coluna foto_url precisa ser TEXT/LONGTEXT.
    // Coloque false para não enviar fotos.
    const ENVIAR_FOTO = true;
    const FOTO_MAX_LADO = 700; // px

    const PAGINA_CARDAPIO = "indexLoja.html#produtos";

    const modoEdicao = /editarProduto/i.test(window.location.pathname);
    const codProduto = new URLSearchParams(window.location.search).get("cod_produto");

    let token = null;
    let codLoja = null;
    let fotoNova = null;      // data URL da foto escolhida (se houver)
    let elementos = {};

    document.addEventListener("DOMContentLoaded", iniciar);

    async function iniciar() {
        // este script só faz sentido nas telas de criar/editar produto
        if (!document.getElementById("produtoNomeCriacao")) return;

        token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        if (modoEdicao && !codProduto) {
            window.location.href = PAGINA_CARDAPIO;
            return;
        }

        elementos = {
            nome: document.getElementById("produtoNomeCriacao"),
            categoria: document.getElementById("produtoCategoriaCriacao"),
            descricao: document.getElementById("produtoDescricaoCriacao"),
            preco: document.getElementById("produtoPrecoCriacao"),
            disponibilidade: document.querySelector('input[name="disponibilidade"]'),
            foto: document.getElementById("produtoFotoCriacao"),
            areaFoto: document.querySelector(".areaFoto"),
            botao: document.querySelector(".cartaoAcoes .botaoPrimario")
        };

        prepararMensagem();
        elementos.foto.addEventListener("change", aoEscolherFoto);
        elementos.botao.addEventListener("click", salvar);

        travar(true);

        try {
            await carregarCategorias();

            if (modoEdicao) {
                await carregarProduto();
            } else {
                elementos.disponibilidade.checked = true; // produto novo começa à venda
                const perfil = await requisicaoAPI("/loja/perfil");
                if (perfil.cod_loja == null) {
                    throw new Error("O /loja/perfil precisa devolver cod_loja.");
                }
                codLoja = perfil.cod_loja;
            }

            travar(false);
        } catch (erro) {
            console.error("Erro ao preparar a tela:", erro);
            mostrarMensagem(erro.message, "erro");
        }
    }

    // =====================================================
    // API
    // =====================================================

    async function requisicaoAPI(caminho, { method = "GET", corpo } = {}) {
        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        };
        if (corpo !== undefined) headers["Content-Type"] = "application/json";

        const resposta = await fetch(`${API_URL}${caminho}`, {
            method,
            headers,
            body: corpo !== undefined ? JSON.stringify(corpo) : undefined
        });

        const texto = await resposta.text();
        let dados = {};
        try {
            dados = texto ? JSON.parse(texto) : {};
        } catch {
            throw new Error("A API retornou uma resposta que não é JSON.");
        }

        if (resposta.status === 401 || resposta.status === 422) {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            window.location.href = "login.html";
            throw new Error("Sessão expirada. Faça login novamente.");
        }

        if (!resposta.ok) {
            throw new Error(dados.error || dados.message || `Erro HTTP ${resposta.status}`);
        }

        // /registrar_produto devolve {"error": ...} com status 200 (nome repetido)
        if (dados && dados.error) {
            throw new Error(dados.error);
        }

        return dados;
    }

    async function carregarCategorias() {
        const select = elementos.categoria;

        try {
            const resposta = await fetch(`${API_URL}/categorias`, {
                headers: { "Accept": "application/json" }
            });
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

            const dados = await resposta.json();
            const categorias = Array.isArray(dados.categorias) ? dados.categorias : [];
            if (categorias.length === 0) throw new Error("lista vazia");

            // mantém só o placeholder e recria as opções com o código como value
            select.querySelectorAll("option:not([disabled])").forEach(o => o.remove());
            categorias.forEach(c => {
                select.add(new Option(c.nome_categoria, c.cod_categoria));
            });
        } catch (erro) {
            console.warn("Não foi possível carregar /categorias:", erro);
            select.disabled = true;
            mostrarMensagem(
                "Não foi possível carregar as categorias. O produto será salvo sem categoria.",
                "erro"
            );
        }
    }

    async function carregarProduto() {
        const dados = await requisicaoAPI("/loja/produtos");
        const produto = (dados.produtos || []).find(
            p => String(p.cod_produto) === String(codProduto)
        );

        if (!produto) {
            throw new Error("Produto não encontrado na sua loja.");
        }

        elementos.nome.value = produto.nome ?? "";
        elementos.descricao.value = produto.descricao ?? "";
        elementos.preco.value = Number(produto.preco).toFixed(2).replace(".", ",");
        elementos.disponibilidade.checked = Boolean(produto.disponibilidade);

        if (produto.cod_categoria != null && !elementos.categoria.disabled) {
            elementos.categoria.value = String(produto.cod_categoria);
        }

        if (produto.foto_url) mostrarPrevia(produto.foto_url);
    }

    // =====================================================
    // SALVAR
    // =====================================================

    async function salvar() {
        const nome = elementos.nome.value.trim();
        const descricao = elementos.descricao.value.trim();
        const preco = lerPreco(elementos.preco.value);
        const codCategoria = elementos.categoria.value;
        const disponibilidade = elementos.disponibilidade.checked;

        if (nome.length < 2) return mostrarMensagem("Informe o nome do produto.", "erro");
        if (!modoEdicao && /[\/\\]/.test(nome)) {
            return mostrarMensagem("O nome não pode ter barras (/ ou \\).", "erro");
        }
        if (preco === null) return mostrarMensagem("Informe um preço válido.", "erro");

        const corpo = {
            nome,
            descricao: descricao || null,
            preco,
            disponibilidade,
            cod_categoria: codCategoria ? Number(codCategoria) : null
        };

        if (ENVIAR_FOTO && fotoNova) corpo.foto_url = fotoNova;

        mostrarMensagem("", "ok");
        travar(true, modoEdicao ? "Salvando..." : "Cadastrando...");

        try {
            if (modoEdicao) {
                await requisicaoAPI(
                    `/loja/produtos/${encodeURIComponent(codProduto)}`,
                    { method: "PATCH", corpo }
                );
            } else {
                corpo.cod_loja = codLoja;
                if (!("foto_url" in corpo)) corpo.foto_url = null;

                await requisicaoAPI(
                    `/registrar_produto/${encodeURIComponent(codLoja)}/${encodeURIComponent(nome)}`,
                    { method: "POST", corpo }
                );
            }

            mostrarMensagem(
                modoEdicao ? "Alterações salvas!" : "Produto cadastrado!",
                "ok"
            );
            setTimeout(() => { window.location.href = PAGINA_CARDAPIO; }, 800);
        } catch (erro) {
            console.error("Erro ao salvar produto:", erro);
            mostrarMensagem(erro.message, "erro");
            travar(false);
        }
    }

    // "12,50" | "1.234,56" | "12.5" -> 12.5 ; inválido -> null
    function lerPreco(texto) {
        let valor = String(texto).trim().replace(/\s/g, "");
        if (valor.includes(",")) valor = valor.replace(/\./g, "").replace(",", ".");

        const numero = Number(valor);
        if (!Number.isFinite(numero) || numero <= 0 || numero > 99999999.99) return null;

        return Math.round(numero * 100) / 100;
    }

    // =====================================================
    // FOTO
    // =====================================================

    async function aoEscolherFoto() {
        const arquivo = elementos.foto.files[0];
        if (!arquivo) return;

        try {
            fotoNova = await reduzirImagem(arquivo);
            mostrarPrevia(fotoNova);
        } catch (erro) {
            fotoNova = null;
            elementos.foto.value = "";
            mostrarMensagem(erro.message, "erro");
        }
    }

    function reduzirImagem(arquivo) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(arquivo);
            const imagem = new Image();

            imagem.onload = () => {
                const escala = Math.min(1, FOTO_MAX_LADO / Math.max(imagem.width, imagem.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(imagem.width * escala);
                canvas.height = Math.round(imagem.height * escala);

                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#fff"; // PNG transparente não vira preto no JPEG
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);

                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };

            imagem.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Não foi possível ler essa imagem."));
            };

            imagem.src = url;
        });
    }

    function mostrarPrevia(src) {
        if (!elementos.areaFoto) return;

        let previa = elementos.areaFoto.querySelector(".previaFotoProduto");
        if (!previa) {
            previa = document.createElement("img");
            previa.className = "previaFotoProduto";
            previa.alt = "Prévia da foto do produto";
            previa.style.cssText =
                "display:block;width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-top:10px;";
            elementos.areaFoto.appendChild(previa);
        }
        previa.src = src;
    }

    // =====================================================
    // INTERFACE
    // =====================================================

    function prepararMensagem() {
        const cartao = elementos.botao.closest(".cartaoAcoes");

        // o texto "só será efetivado quando integrado" não vale mais
        cartao.querySelector("p")?.remove();

        const mensagem = document.createElement("p");
        mensagem.id = "mensagemProduto";
        mensagem.setAttribute("role", "status");
        mensagem.style.cssText = "margin:0 0 8px;font-size:.9rem;";
        mensagem.hidden = true;
        cartao.prepend(mensagem);
    }

    function mostrarMensagem(texto, tipo) {
        const mensagem = document.getElementById("mensagemProduto");
        mensagem.textContent = texto;
        mensagem.style.color = tipo === "erro" ? "#b3261e" : "#2e7d32";
        mensagem.hidden = !texto;
    }

    function travar(travado, rotulo) {
        const botao = elementos.botao;

        if (!botao.dataset.original) botao.dataset.original = botao.innerHTML;

        botao.disabled = travado;
        botao.innerHTML = travado && rotulo ? rotulo : botao.dataset.original;
    }

})();