(() => {
    const API = "http://localhost:5000";
    const token = () => localStorage.getItem("token");
    const $ = (id) => document.getElementById(id);
    const query = new URLSearchParams(location.search);
    const cod = query.get("cod_produto");
    const edicao = location.pathname.toLowerCase().endsWith("editarproduto.html");
    const nome = $("produtoNomeCriacao"), descricao = $("produtoDescricaoCriacao");
    const preco = $("produtoPrecoCriacao"), categoria = $("produtoCategoriaCriacao");
    const disponibilidade = document.querySelector('[name="disponibilidade"]');
    const foto = $("produtoFotoCriacao");
    const botao = document.querySelector(".cartaoAcoes .botaoPrimario");
    const aviso = document.createElement("p");
    aviso.className = "mensagemDashboard";
    aviso.setAttribute("role", "status");
    document.querySelector(".cartaoAcoes")?.prepend(aviso);

    function cabecalho() {
        const jwt = token();
        if (!jwt) throw new Error("Entre na conta da loja para continuar.");
        return { Authorization: `Bearer ${jwt}`, Accept: "application/json" };
    }
    async function requisicao(url, opcoes = {}) {
        const resposta = await fetch(API + url, { ...opcoes, headers: { ...cabecalho(), ...opcoes.headers } });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) throw new Error(dados.error || dados.message || `Falha (${resposta.status})`);
        return dados;
    }
    function exibir(texto, erro = false) {
        aviso.textContent = texto;
        aviso.classList.toggle("erroCampo", erro);
    }
    function numeroPreco(valor) {
        const normalizado = String(valor).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:,|$))/g, "").replace(",", ".");
        const n = Number(normalizado);
        if (!Number.isFinite(n) || n <= 0) throw new Error("Informe um preço válido maior que zero.");
        return n;
    }
    async function carregarCategorias(selecionada) {
        const dados = await requisicao("/categorias");
        categoria.replaceChildren(new Option("Sem categoria", ""));
        (dados.categorias || []).forEach(c => categoria.add(new Option(c.nome, String(c.cod_categoria))));
        if (selecionada != null) categoria.value = String(selecionada);
    }
    async function carregarProduto() {
        const dados = await requisicao(`/loja/produtos/${encodeURIComponent(cod)}`);
        nome.value = dados.nome || "";
        descricao.value = dados.descricao || "";
        preco.value = Number(dados.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        disponibilidade.checked = Boolean(dados.disponibilidade);
        await carregarCategorias(dados.cod_categoria);
        document.querySelector("h1")?.replaceChildren("Editar ", Object.assign(document.createElement("span"), { textContent: "produto" }));
        if (dados.foto_url) definirPrevia(urlFoto(dados.foto_url), "Foto atual do produto");
    }
    // =====================================================
    // FOTO: enviada ao backend em POST /loja/produtos/<cod>/foto
    // (campo "foto" do multipart). O backend guarda o arquivo e grava
    // o caminho em produto.foto_url (ex.: /uploads/produtos/<id>.jpg).
    // =====================================================
    const EXTENSOES_FOTO = ["png", "jpg", "jpeg", "webp"];
    const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB (limite do backend)

    // foto_url vem como "/uploads/produtos/x.jpg", servido pela API (outra origem que a página)
    function urlFoto(caminho) {
        if (!caminho) return "";
        if (/^(https?:|data:|blob:)/i.test(caminho)) return caminho;
        return caminho.startsWith("/") ? API + caminho : caminho;
    }
    function validarFoto(arquivo) {
        const ext = arquivo.name.includes(".") ? arquivo.name.split(".").pop().toLowerCase() : "";
        if (!EXTENSOES_FOTO.includes(ext)) throw new Error("Formato inválido. Use png, jpg, jpeg ou webp.");
        if (arquivo.size > TAMANHO_MAXIMO) throw new Error("Arquivo muito grande (máximo 5 MB).");
    }
    async function enviarFoto(codProduto) {
        const arquivo = foto?.files?.[0];
        if (!arquivo) return null;
        const form = new FormData();
        form.append("foto", arquivo);
        // sem Content-Type: o navegador define o boundary do multipart
        const dados = await requisicao(`/loja/produtos/${encodeURIComponent(codProduto)}/foto`, { method: "POST", body: form });
        return dados.foto_url;
    }
    function definirPrevia(src, alt) {
        if (!foto?.parentElement) return;
        let img = foto.parentElement.querySelector(".previaFotoProduto");
        if (!img) {
            img = document.createElement("img");
            img.className = "previaFotoProduto";
            foto.parentElement.append(img);
        }
        // preenche toda a moldura .areaFoto (320x320), recortando sem distorcer
        Object.assign(img.style, {
            position: "absolute", inset: "0", width: "100%", height: "100%",
            objectFit: "cover", borderRadius: "3px", display: "block", margin: "0"
        });
        img.alt = alt;
        img.src = src;
    }
    function mostrarPrevia() {
        const arquivo = foto?.files?.[0];
        if (!arquivo) return;
        try {
            validarFoto(arquivo);
            exibir("");
            definirPrevia(URL.createObjectURL(arquivo), "Prévia da foto");
        } catch (erro) {
            foto.value = "";
            exibir(erro.message, true);
        }
    }
    foto?.addEventListener("change", mostrarPrevia);

    async function salvar(evento) {
        evento?.preventDefault();
        let codProduto = cod;
        try {
            botao.disabled = true; exibir(edicao ? "Salvando alterações..." : "Cadastrando produto...");
            const arquivo = foto?.files?.[0];
            if (arquivo) validarFoto(arquivo); // valida antes de salvar qualquer coisa
            const dados = {
                nome: nome.value.trim(), descricao: descricao.value.trim(), preco: numeroPreco(preco.value),
                disponibilidade: disponibilidade.checked,
                cod_categoria: categoria.value ? Number(categoria.value) : null
            };
            if (edicao) {
                await requisicao(`/loja/produtos/${encodeURIComponent(cod)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
            } else {
                const criado = await requisicao("/loja/produtos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
                codProduto = criado.cod_produto;
            }
            // com o produto salvo, envia a foto (se houver) para gravar foto_url
            if (arquivo) {
                exibir("Enviando foto...");
                try {
                    const caminho = await enviarFoto(codProduto);
                    console.log("foto_url salvo no banco:", caminho);
                } catch (erroFoto) {
                    const msg = `Produto salvo, mas a foto não foi enviada: ${erroFoto.message}`;
                    exibir(msg, true);
                    alert(msg);
                    // no cadastro, leva para a edição para tentar a foto de novo (evita duplicar o produto)
                    if (!edicao) setTimeout(() => location.href = `editarProduto.html?cod_produto=${encodeURIComponent(codProduto)}`, 1200);
                    return;
                }
            }
            exibir("Produto salvo com sucesso.");
            setTimeout(() => location.href = "indexLoja.html#produtos", 700);
        } catch (erro) {
            console.error("Erro ao salvar produto:", erro);
            const msg = erro.message || "Não foi possível salvar o produto.";
            exibir(msg, true);
            alert(msg);
        } finally { botao.disabled = false; }
    }
    document.addEventListener("DOMContentLoaded", async () => {
        try {
            if (!edicao) { disponibilidade.checked = true; await carregarCategorias(); }
            else if (!cod || !/^\d+$/.test(cod)) throw new Error("Código do produto ausente na URL.");
            else await carregarProduto();
        } catch (erro) { exibir(erro.message, true); }
        botao?.addEventListener("click", salvar);
    });
})();