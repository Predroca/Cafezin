// ==========================================
// sacola.js
// Renderiza a sacola (sacola.html) a partir do localStorage e deixa
// a seleção de produtos funcional: marcar/desmarcar recalcula o resumo.
//
// Formato em localStorage["cafezinSacola"] (gravado pelo adicionarSacola.js):
// {
//   cod_loja, nome_loja,
//   itens: [{ cod_produto, nome, preco, foto_url, quantidade, selecionado }]
// }
// "selecionado" é gravado aqui; item sem esse campo conta como marcado.
// A pagina pagamento.html lê esse mesmo campo, então o botão "Continuar"
// e a aba "Pagamento" só precisam navegar.
//
// Ainda sem lógica: quantidade (− / +), remover item e "Limpar sacola".
// ==========================================

const CHAVE_SACOLA = "cafezinSacola";
const VALOR_FRETE_PADRAO = 5.0;          // mesma regra do backend
const FRETE_GRATIS_A_PARTIR_DE = 25.0;   // mesma regra do backend

document.addEventListener("DOMContentLoaded", () => {
    ligarEventos();
    renderizarSacola();
});

// volta pelo botão "voltar" do navegador (página vinda do cache)
window.addEventListener("pageshow", evento => {
    if (evento.persisted) renderizarSacola();
});

// sacola alterada em outra aba
window.addEventListener("storage", evento => {
    if (evento.key === CHAVE_SACOLA) renderizarSacola();
});

// ------------------------------------------
// 1. localStorage
// ------------------------------------------

function lerSacola() {
    try {
        const bruto = localStorage.getItem(CHAVE_SACOLA);
        const sacola = bruto ? JSON.parse(bruto) : null;

        if (sacola && Array.isArray(sacola.itens)) {
            // descarta itens corrompidos
            sacola.itens = sacola.itens.filter(item =>
                Number.isFinite(Number(item.cod_produto)) &&
                Number.isFinite(Number(item.preco)) &&
                Number(item.quantidade) >= 1
            );
            return sacola;
        }
    } catch (erro) {
        console.error("Erro ao ler a sacola:", erro);
    }

    return { cod_loja: null, nome_loja: "", itens: [] };
}

function salvarSacola(sacola) {
    try {
        localStorage.setItem(CHAVE_SACOLA, JSON.stringify(sacola));
        return true;
    } catch (erro) {
        console.error("Erro ao salvar a sacola:", erro);
        return false;
    }
}

function itemSelecionado(item) {
    return item.selecionado !== false;
}

// ------------------------------------------
// 2. Cálculo (em centavos, para não ter erro de ponto flutuante)
// ------------------------------------------

function calcularTotais(itens) {
    const selecionados = itens.filter(itemSelecionado);

    const unidades = selecionados.reduce((soma, i) => soma + Number(i.quantidade), 0);
    const subtotalCentavos = selecionados.reduce(
        (soma, i) => soma + Math.round(Number(i.preco) * 100) * Number(i.quantidade), 0
    );

    const subtotal = subtotalCentavos / 100;

    let frete = 0;
    if (selecionados.length > 0 && subtotal < FRETE_GRATIS_A_PARTIR_DE) {
        frete = VALOR_FRETE_PADRAO;
    }

    return {
        quantidadeSelecionados: selecionados.length,
        unidades,
        subtotal,
        frete,
        freteGratis: selecionados.length > 0 && frete === 0,
        total: (subtotalCentavos + Math.round(frete * 100)) / 100,
    };
}

// ------------------------------------------
// 3. Render principal
// ------------------------------------------

function renderizarSacola() {
    const sacola = lerSacola();
    const itens = sacola.itens;

    const totalUnidadesSacola = itens.reduce((soma, i) => soma + Number(i.quantidade), 0);
    definirTexto("contadorSacola", totalUnidadesSacola);

    const vazia = itens.length === 0;

    // sacola vazia: só o estado vazio, no mesmo layout do perfil
    document.getElementById("conteudoSacola")?.classList.toggle("semProdutos", vazia);
    document.getElementById("estadoVazio")?.classList.toggle("escondido", !vazia);
    document.getElementById("secaoProdutos")?.classList.toggle("escondido", vazia);
    document.getElementById("maisProdutos")?.classList.toggle("escondido", vazia);
    document.getElementById("resumoCompra")?.classList.toggle("escondido", vazia);

    if (vazia) return;

    renderizarLoja(sacola);
    renderizarItens(itens);
    atualizarSelecaoEResumo(itens);
}

function renderizarLoja(sacola) {
    const nome = sacola.nome_loja || "Cafeteria";

    // o HTML tem dois elementos com id="nomeLoja"; atualiza os dois
    document.querySelectorAll('[id="nomeLoja"]').forEach(el => {
        el.textContent = nome;
    });

    const linkVerMais = document.querySelector("#maisProdutos .linkSecao");
    if (linkVerMais && sacola.cod_loja != null) {
        linkVerMais.href = `produtosLoja.html?loja=${encodeURIComponent(sacola.cod_loja)}`;
    }
}

function renderizarItens(itens) {
    const lista = document.getElementById("listaItens");
    if (!lista) return;

    lista.innerHTML = itens.map(criarItemSacola).join("");
}

function criarItemSacola(item) {
    const quantidade = Number(item.quantidade);
    const preco = Number(item.preco);
    const nome = item.nome || "Produto";
    const marcado = itemSelecionado(item) ? "checked" : "";

    const imagem = item.foto_url
        ? `<img class="imagemItemSacola" src="${escaparHTML(item.foto_url)}" alt="${escaparHTML(nome)}">`
        : `<div class="imagemItemSacola semImagem" aria-hidden="true"><i class="bi bi-image"></i></div>`;

    return `
        <article class="itemSacola" data-produto-id="${escaparHTML(item.cod_produto)}">
            <input type="checkbox" ${marcado} aria-label="Selecionar ${escaparHTML(nome)}">

            ${imagem}

            <div class="infoItemSacola">
                <div class="linhaNomeItem">
                    <h3 class="nomeItemSacola">${escaparHTML(nome)}</h3>
                    <button type="button" class="botaoRemoverItem"
                        data-acao="remover"
                        aria-label="Remover ${escaparHTML(nome)}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <span class="detalheItemSacola">${formatarPreco(preco)} cada</span>
            </div>

            <div class="precoItemSacola">
                <strong class="precoTotalItem">${formatarPreco(preco * quantidade)}</strong>
                <div class="quantidadeItem">
                    <button type="button" data-acao="diminuir"
                        aria-label="Diminuir quantidade de ${escaparHTML(nome)}">−</button>
                    <span class="quantidadeValor">${quantidade}</span>
                    <button type="button" data-acao="aumentar"
                        aria-label="Aumentar quantidade de ${escaparHTML(nome)}">+</button>
                </div>
            </div>
        </article>
    `;
}

// ------------------------------------------
// 4. Seleção: checkboxes, resumo e botão "Continuar"
// ------------------------------------------

function ligarEventos() {
    // checkbox de cada produto
    document.getElementById("listaItens")?.addEventListener("change", evento => {
        const check = evento.target;
        if (!check.matches('.itemSacola input[type="checkbox"]')) return;

        const codProduto = Number(check.closest(".itemSacola").dataset.produtoId);
        const sacola = lerSacola();

        const item = sacola.itens.find(i => Number(i.cod_produto) === codProduto);
        if (!item) return;

        item.selecionado = check.checked;
        salvarSacola(sacola);
        atualizarSelecaoEResumo(sacola.itens);
    });

    // "Todos os produtos" e checkbox da loja (a sacola tem uma loja só,
    // então os dois marcam/desmarcam tudo)
    document.getElementById("selecionarTodos")?.addEventListener("change", evento => {
        marcarTodos(evento.target.checked);
    });
    document.querySelector(".checkLoja")?.addEventListener("change", evento => {
        marcarTodos(evento.target.checked);
    });

    // sem produto marcado, "Continuar" não avança
    document.getElementById("botaoContinuar")?.addEventListener("click", evento => {
        if (calcularTotais(lerSacola().itens).quantidadeSelecionados === 0) {
            evento.preventDefault();
        }
    });
}

function marcarTodos(marcado) {
    const sacola = lerSacola();
    sacola.itens.forEach(item => {
        item.selecionado = marcado;
    });
    salvarSacola(sacola);

    document.querySelectorAll('#listaItens .itemSacola input[type="checkbox"]').forEach(check => {
        check.checked = marcado;
    });

    atualizarSelecaoEResumo(sacola.itens);
}

function atualizarSelecaoEResumo(itens) {
    const totais = calcularTotais(itens);

    // "Todos" e "loja": marcados se todos estão marcados, indeterminado se só alguns
    const todos = totais.quantidadeSelecionados === itens.length;
    const algum = totais.quantidadeSelecionados > 0;

    [document.getElementById("selecionarTodos"), document.querySelector(".checkLoja")]
        .forEach(check => {
            if (!check) return;
            check.checked = todos;
            check.indeterminate = algum && !todos;
        });

    // frete dentro da seção de produtos
    definirTexto("freteCafeteria", textoFrete(totais));
    document.getElementById("freteCafeteria")?.classList.toggle("valorGratis", totais.freteGratis);

    // resumo da compra
    definirTexto("resumoQuantidadeProdutos", totais.unidades);
    definirTexto("resumoSubtotal", formatarPreco(totais.subtotal));
    definirTexto("resumoFrete", textoFrete(totais));
    definirTexto("resumoTotal", formatarPreco(totais.total));
    definirTexto("botaoQuantidadeProdutos", totais.unidades);
    document.getElementById("resumoFrete")?.classList.toggle("valorGratis", totais.freteGratis);

    // botão "Continuar" desativado sem produto marcado
    const botao = document.getElementById("botaoContinuar");
    if (botao) {
        botao.classList.toggle("desativado", !algum);
        botao.setAttribute("aria-disabled", String(!algum));
    }
}

function textoFrete(totais) {
    return totais.freteGratis ? "Grátis" : formatarPreco(totais.frete);
}

// ------------------------------------------
// 5. Auxiliares
// ------------------------------------------

function definirTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

function formatarPreco(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) return "Preço indisponível";

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    })[caractere]);
}
