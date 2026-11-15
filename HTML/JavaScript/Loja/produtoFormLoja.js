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
        if (foto?.parentElement && dados.foto_url) {
            const img = document.createElement("img"); img.src = dados.foto_url; img.alt = "Foto atual do produto"; img.className = "previaFotoProduto";
            foto.parentElement.append(img);
        }
    }
    async function enviarFoto(codigo) {
        if (!foto.files?.[0]) return;
        const form = new FormData(); form.append("foto", foto.files[0]);
        await requisicao(`/loja/produtos/${codigo}/foto`, { method: "POST", headers: {}, body: form });
    }
    async function salvar(evento) {
        evento?.preventDefault();
        try {
            botao.disabled = true; exibir(edicao ? "Salvando alterações..." : "Cadastrando produto...");
            const dados = {
                nome: nome.value.trim(), descricao: descricao.value.trim(), preco: numeroPreco(preco.value),
                disponibilidade: disponibilidade.checked,
                cod_categoria: categoria.value ? Number(categoria.value) : null
            };
            const resultado = edicao
                ? await requisicao(`/loja/produtos/${encodeURIComponent(cod)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) })
                : await requisicao("/loja/produto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
            const codigo = edicao ? cod : resultado.cod_produto;
            await enviarFoto(codigo);
            exibir("Produto salvo com sucesso.");
            setTimeout(() => location.href = "indexLoja.html#produtos", 700);
        } catch (erro) {
            exibir(erro.message || "Não foi possível salvar o produto.", true);
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

