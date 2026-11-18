// ==========================================
// adicionarSacola.js
// Botão "+" dos cards de produto -> salva na sacola (localStorage).
// A sacola só aceita produtos de UMA loja por vez.
//
// Formato salvo em localStorage["cafezinSacola"]:
// {
//   cod_loja: 3,
//   nome_loja: "Empório do Café",
//   itens: [
//     { cod_produto: 1, nome: "...", preco: 15, foto_url: "...", quantidade: 2 }
//   ]
// }
// ==========================================
 
const CHAVE_SACOLA = "cafezinSacola";
const LIMITE_QUANTIDADE_ITEM = 20; // mesmo limite do backend (criar_pedido)
 
// ------------------------------------------
// 1. Leitura / escrita no localStorage
// ------------------------------------------
 
function obterSacola() {
    try {
        const bruto = localStorage.getItem(CHAVE_SACOLA);
        const sacola = bruto ? JSON.parse(bruto) : null;
 
        if (sacola && Array.isArray(sacola.itens)) {
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
 
function limparSacola() {
    try {
        localStorage.removeItem(CHAVE_SACOLA);
    } catch (erro) {
        console.error("Erro ao limpar a sacola:", erro);
    }
    atualizarContadorSacola();
}
 
function totalItensSacola() {
    return obterSacola().itens.reduce((soma, item) => soma + item.quantidade, 0);
}
 
// ------------------------------------------
// 2. Lê os dados do produto a partir do card clicado
// ------------------------------------------
// Os cards precisam ter data-cod-produto, data-nome, data-preco,
// data-cod-loja e data-nome-loja (data-foto é opcional).
 
function lerProdutoDoCard(botao) {
    const card = botao.closest(".OutrasLojasCard, .produtoCard");
    if (!card) return null;
 
    const dados = card.dataset;
 
    const codProduto = Number(dados.codProduto || botao.dataset.codProduto || botao.dataset.produto);
    const codLoja = Number(dados.codLoja);
    const preco = Number(dados.preco);
 
    if (!Number.isFinite(codProduto) || !Number.isFinite(codLoja) || !Number.isFinite(preco)) {
        return null;
    }
 
    return {
        cod_produto: codProduto,
        nome: dados.nome || "Produto",
        preco: preco,
        foto_url: dados.foto || null,
        cod_loja: codLoja,
        nome_loja: dados.nomeLoja || "esta loja",
    };
}
 
// ------------------------------------------
// 3. Adicionar à sacola
// ------------------------------------------
 
function adicionarNaSacola(produto, quantidade = 1) {
    quantidade = Math.max(1, Math.floor(Number(quantidade)) || 1);

    if (quantidade > LIMITE_QUANTIDADE_ITEM) {
        mostrarAviso(
            `O limite é de ${LIMITE_QUANTIDADE_ITEM} unidades por produto.`,
            "erro"
        );
        return false;
    }

    const sacola = obterSacola();
 
    // sacola com itens de outra loja -> bloqueia
    if (sacola.itens.length > 0 && Number(sacola.cod_loja) !== produto.cod_loja) {
        mostrarAviso(
            `Você só pode adicionar produtos de uma loja por vez. ` +
            `Sua sacola já tem itens de ${sacola.nome_loja || "outra loja"}.`,
            "erro"
        );
        return false;
    }
 
    const existente = sacola.itens.find(i => i.cod_produto === produto.cod_produto);
 
    if (existente) {
        if (existente.quantidade + quantidade > LIMITE_QUANTIDADE_ITEM) {
            mostrarAviso(
                `O limite é de ${LIMITE_QUANTIDADE_ITEM} unidades por produto.`,
                "erro"
            );
            return false;
        }
        existente.quantidade += quantidade;
    } else {
        sacola.itens.push({
            cod_produto: produto.cod_produto,
            nome: produto.nome,
            preco: produto.preco,
            foto_url: produto.foto_url,
            quantidade: quantidade,
        });
    }
 
    sacola.cod_loja = produto.cod_loja;
    sacola.nome_loja = produto.nome_loja;
 
    if (!salvarSacola(sacola)) {
        mostrarAviso("Não foi possível salvar a sacola neste navegador.", "erro");
        return false;
    }
 
    atualizarContadorSacola();
    mostrarAviso(
        quantidade > 1
            ? `${quantidade}x ${produto.nome} adicionados à sacola.`
            : `${produto.nome} adicionado à sacola.`,
        "sucesso"
    );
    return true;
}
 
// Um único listener para TODOS os botões "+", inclusive os criados
// depois pelo secoesInicio.js e pelo lojasPopulares.js.
document.addEventListener("click", evento => {
    const botao = evento.target.closest("button.adicionar");
    if (!botao) return;
 
    const produto = lerProdutoDoCard(botao);
 
    if (!produto) {
        console.warn("Card sem dados completos do produto; nada foi adicionado.", botao);
        return;
    }
 
    adicionarNaSacola(produto);
});
 
// ------------------------------------------
// 4. Contador da sacola no cabeçalho
// ------------------------------------------
 
function atualizarContadorSacola() {
    const link = document.querySelector(".navAcoes .sacola");
    if (!link) return;
 
    const total = totalItensSacola();
    const contador = link.querySelector("span");
 
    if (contador) {
        contador.textContent = total;
        contador.hidden = total === 0;
    }
 
    link.setAttribute(
        "aria-label",
        `Sacola com ${total} ${total === 1 ? "item" : "itens"}`
    );
}
 
document.addEventListener("DOMContentLoaded", atualizarContadorSacola);
 
// ------------------------------------------
// 5. Aviso (toast) - não depende de CSS externo
// ------------------------------------------
 
let temporizadorAviso = null;
 
function mostrarAviso(mensagem, tipo) {
    let aviso = document.getElementById("avisoSacola");
 
    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "avisoSacola";
        aviso.setAttribute("role", "alert");
        aviso.style.cssText = [
            "position:fixed",
            "left:50%",
            "bottom:24px",
            "transform:translateX(-50%)",
            "max-width:90%",
            "padding:12px 20px",
            "border-radius:10px",
            "color:#fff",
            "font-size:15px",
            "box-shadow:0 4px 14px rgba(0,0,0,.25)",
            "z-index:9999",
            "text-align:center",
        ].join(";");
        document.body.appendChild(aviso);
    }
 
    aviso.textContent = mensagem;
    aviso.style.background = tipo === "erro" ? "#b3261e" : "#4e342e";
    aviso.style.display = "block";
 
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => {
        aviso.style.display = "none";
    }, 3500);
}
 
// Para a tela de sacola usar depois:
// window.Sacola.obter(), window.Sacola.limpar(), window.Sacola.total()
window.Sacola = {
    obter: obterSacola,
    salvar: salvarSacola,
    limpar: limparSacola,
    total: totalItensSacola,
    adicionar: adicionarNaSacola,
};