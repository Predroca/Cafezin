
// ==========================================
// pagamentoItens.js
// Mostra em pagamento.html os produtos MARCADOS na sacola
// e seus respectivos valores.
// O endereço escolhido é recuperado do localStorage.
// A finalização envia o pedido para o backend (POST /pedidos).
// ==========================================

const CHAVE_SACOLA = "cafezinSacola";
const CHAVE_ENDERECO_ENTREGA = "cafezinEnderecoEntrega";

const VALOR_FRETE_PADRAO = 5.0;
const FRETE_GRATIS_A_PARTIR_DE = 25.0;

const API_URL = "http://localhost:5000";
const ROTA_PEDIDOS = "/pedidos";

const CHAVES_TOKEN = ["token", "access_token", "accessToken", "jwt"];

const CHAVE_PEDIDO_CONFIRMADO = "cafezinPedidoConfirmado";
const PAGINA_INICIO = "indexComprador.html";

let enviandoPedido = false;
let temporizadorAviso = null;

class ErroPedido extends Error {}

// ==========================================
// 1. INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    renderizarPagamento();

    document
        .getElementById("formularioPagamento")
        ?.addEventListener("submit", finalizarPedido);
});

// Atualiza a página quando ela retorna pelo cache do navegador.
window.addEventListener("pageshow", evento => {
    if (evento.persisted) {
        renderizarPagamento();
    }
});

// ==========================================
// 2. LEITURA DA SACOLA
// ==========================================

function lerSacola() {
    try {
        const bruto = localStorage.getItem(CHAVE_SACOLA);
        const sacola = bruto ? JSON.parse(bruto) : null;

        if (sacola && Array.isArray(sacola.itens)) {
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

    return {
        cod_loja: null,
        nome_loja: "",
        itens: []
    };
}

function itemSelecionado(item) {
    return item.selecionado !== false;
}

// ==========================================
// 3. CÁLCULO DOS TOTAIS
// ==========================================

function calcularTotais(selecionados) {

    const unidades = selecionados.reduce(
        (soma, item) => soma + Number(item.quantidade),
        0
    );

    const subtotalCentavos = selecionados.reduce(
        (soma, item) =>
            soma +
            Math.round(Number(item.preco) * 100) *
            Number(item.quantidade),
        0
    );

    const subtotal = subtotalCentavos / 100;

    let frete = 0;

    if (
        selecionados.length > 0 &&
        subtotal < FRETE_GRATIS_A_PARTIR_DE
    ) {
        frete = VALOR_FRETE_PADRAO;
    }

    return {
        unidades,
        subtotal,
        frete,
        freteGratis: selecionados.length > 0 && frete === 0,
        total: (subtotalCentavos + Math.round(frete * 100)) / 100
    };
}

// ==========================================
// 4. RENDERIZAÇÃO DO PAGAMENTO
// ==========================================

function renderizarPagamento() {

    const sacola = lerSacola();

    const selecionados = sacola.itens.filter(itemSelecionado);

    // Contador da sacola inteira.
    definirTexto(
        "contadorSacola",
        sacola.itens.reduce(
            (soma, item) => soma + Number(item.quantidade),
            0
        )
    );

    const vazio = selecionados.length === 0;

    document
        .getElementById("conteudoPagamento")
        ?.classList.toggle("semProdutos", vazio);

    document
        .getElementById("estadoVazio")
        ?.classList.toggle("escondido", !vazio);

    document
        .getElementById("secaoProdutos")
        ?.classList.toggle("escondido", vazio);

    document
        .getElementById("painelFormaPagamento")
        ?.classList.toggle("escondido", vazio);

    document
        .getElementById("resumoPedido")
        ?.classList.toggle("escondido", vazio);

    if (vazio) return;

    document.querySelectorAll('[id="nomeLoja"]').forEach(el => {
        el.textContent = sacola.nome_loja || "Cafeteria";
    });

    const lista = document.getElementById("listaItens");

    if (lista) {
        lista.innerHTML = selecionados
            .map(criarItemPagamento)
            .join("");
    }

    const listaResumo = document.getElementById("listaItensPedido");

    if (listaResumo) {
        listaResumo.innerHTML = selecionados
            .map(criarItemResumo)
            .join("");
    }

    renderizarResumo(calcularTotais(selecionados));
}

// ==========================================
// 5. CRIAÇÃO DOS ITENS
// ==========================================

function criarItemPagamento(item) {

    const quantidade = Number(item.quantidade);
    const preco = Number(item.preco);
    const nome = item.nome || "Produto";

    const imagem = item.foto_url
        ? `<img class="imagemItemSacola"
                src="${escaparHTML(item.foto_url)}"
                alt="${escaparHTML(nome)}">`
        : `<div class="imagemItemSacola semImagem" aria-hidden="true">
                <i class="bi bi-image"></i>
           </div>`;

    return `
        <article class="itemSacola"
            data-produto-id="${escaparHTML(item.cod_produto)}"
            style="grid-template-columns: 100px 1fr auto;">

            ${imagem}

            <div class="infoItemSacola">
                <h3 class="nomeItemSacola">
                    ${escaparHTML(nome)}
                </h3>

                <span class="detalheItemSacola">
                    ${quantidade} × ${formatarPreco(preco)}
                </span>
            </div>

            <div class="precoItemSacola">
                <strong class="precoTotalItem">
                    ${formatarPreco(preco * quantidade)}
                </strong>
            </div>

        </article>
    `;
}

function criarItemResumo(item) {

    const quantidade = Number(item.quantidade);
    const preco = Number(item.preco);

    return `
        <li class="itemPedido"
            data-produto-id="${escaparHTML(item.cod_produto)}">

            <span>
                ${quantidade} × ${escaparHTML(item.nome || "Produto")}
            </span>

            <span>
                ${formatarPreco(preco * quantidade)}
            </span>

        </li>
    `;
}

// ==========================================
// 6. RESUMO DO PEDIDO
// ==========================================

function renderizarResumo(totais) {

    const textoFrete = totais.freteGratis
        ? "Grátis"
        : formatarPreco(totais.frete);

    definirTexto("freteCafeteria", textoFrete);
    definirTexto("resumoQuantidadeProdutos", totais.unidades);
    definirTexto("resumoSubtotal", formatarPreco(totais.subtotal));
    definirTexto("resumoFrete", textoFrete);
    definirTexto("resumoTotal", formatarPreco(totais.total));

    ["freteCafeteria", "resumoFrete"].forEach(id => {
        document
            .getElementById(id)
            ?.classList.toggle("valorGratis", totais.freteGratis);
    });
}

// ==========================================
// 7. FUNÇÕES AUXILIARES
// ==========================================

function definirTexto(id, valor) {

    const el = document.getElementById(id);

    if (el) {
        el.textContent = valor;
    }
}

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

// ==========================================
// 8. TOKEN DE AUTENTICAÇÃO
// ==========================================

function obterToken() {

    for (const armazenamento of [localStorage, sessionStorage]) {

        for (const chave of CHAVES_TOKEN) {

            try {

                const valor = armazenamento.getItem(chave);

                if (valor) {
                    return valor.replace(/^"|"$/g, "");
                }

            } catch (erro) {
                // Tenta o próximo armazenamento.
            }
        }
    }

    return null;
}

function cabecalhosAutenticados(token) {

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// ==========================================
// 9. RECUPERAR ENDEREÇO SELECIONADO
// ==========================================

function obterEnderecoEntrega() {

    let enderecoSalvo;

    try {

        enderecoSalvo = localStorage.getItem(
            CHAVE_ENDERECO_ENTREGA
        );

    } catch (erro) {

        throw new ErroPedido(
            "Não foi possível acessar o endereço de entrega."
        );
    }

    if (!enderecoSalvo) {

        throw new ErroPedido(
            "Selecione um endereço de entrega antes de finalizar o pedido."
        );
    }

    let endereco;

    try {

        endereco = JSON.parse(enderecoSalvo);

    } catch {

        // Caso o código tenha sido salvo como texto simples.
        endereco = enderecoSalvo;
    }

    const codEndereco =
        typeof endereco === "object" && endereco !== null
            ? endereco.cod_endereco
            : endereco;

    const codigo = Number(codEndereco);

    if (!Number.isInteger(codigo) || codigo <= 0) {

        throw new ErroPedido(
            "O endereço selecionado é inválido. Selecione novamente."
        );
    }

    return codigo;
}

// ==========================================
// 10. FINALIZAR PEDIDO
// ==========================================

async function finalizarPedido(evento) {

    evento.preventDefault();

    if (enviandoPedido) return;

    const selecionados = lerSacola()
        .itens
        .filter(itemSelecionado);

    if (selecionados.length === 0) {

        mostrarAviso(
            "Marque ao menos um produto na sacola.",
            "erro"
        );

        return;
    }

    const formaPagamento = document
        .querySelector('input[name="formaPagamento"]:checked')
        ?.value;

    if (!formaPagamento) {

        mostrarAviso(
            "Escolha uma forma de pagamento.",
            "erro"
        );

        return;
    }

    definirEnviando(true);

    try {

        // Recupera o token.
        const token = obterToken();

        if (!token) {

            throw new ErroPedido(
                "Entre na sua conta para finalizar o pedido."
            );
        }

        // Recupera o endereço escolhido pelo comprador.
        const codEndereco = obterEnderecoEntrega();

        // Envia o pedido para o backend.
        const resposta = await fetch(
            `${API_URL}${ROTA_PEDIDOS}`,
            {
                method: "POST",

                headers: cabecalhosAutenticados(token),

                body: JSON.stringify({

                    itens: selecionados.map(item => ({
                        cod_produto: Number(item.cod_produto),
                        quantidade: Number(item.quantidade)
                    })),

                    cod_endereco: codEndereco,

                    forma_pagamento: formaPagamento

                })
            }
        );

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {

            throw new ErroPedido(
                mensagemDeErro(resposta.status, dados)
            );
        }

        // Pedido realizado com sucesso.
        concluirPedido(selecionados, dados);

    } catch (erro) {

        if (erro instanceof ErroPedido) {

            mostrarAviso(erro.message, "erro");

        } else {

            console.error(
                "Erro ao finalizar o pedido:",
                erro
            );

            mostrarAviso(
                "Não foi possível conectar ao servidor. Tente novamente.",
                "erro"
            );
        }

        definirEnviando(false);
    }
}

// ==========================================
// 11. TRATAMENTO DE ERROS DO BACKEND
// ==========================================

function mensagemDeErro(status, dados) {

    if (status === 401 || status === 422) {

        return "Sua sessão expirou. Entre novamente para finalizar o pedido.";
    }

    if (status === 403) {

        return "Só contas de comprador podem fazer pedidos.";
    }

    return dados.error ||
        dados.msg ||
        "Não foi possível finalizar o pedido.";
}

// ==========================================
// 12. CONCLUIR PEDIDO
// ==========================================

function concluirPedido(itensPedido, resposta) {

    // Identifica os produtos comprados.
    const comprados = new Set(
        itensPedido.map(item => Number(item.cod_produto))
    );

    const sacola = lerSacola();

    // Mantém os produtos que não foram comprados.
    sacola.itens = sacola.itens.filter(
        item => !comprados.has(Number(item.cod_produto))
    );

    try {

        // Atualiza a sacola.
        if (sacola.itens.length === 0) {

            localStorage.removeItem(CHAVE_SACOLA);

        } else {

            localStorage.setItem(
                CHAVE_SACOLA,
                JSON.stringify(sacola)
            );
        }

        // Salva os dados da confirmação.
        sessionStorage.setItem(
            CHAVE_PEDIDO_CONFIRMADO,
            JSON.stringify({
                cod_pedido: resposta.cod_pedido,
                valor_total: resposta.valor_total
            })
        );

    } catch (erro) {

        console.error(
            "Erro ao atualizar o armazenamento:",
            erro
        );
    }

    // Redireciona para a página inicial.
    window.location.href = PAGINA_INICIO;
}

// ==========================================
// 13. CONTROLE DO BOTÃO
// ==========================================

function definirEnviando(enviando) {

    enviandoPedido = enviando;

    const botao = document.querySelector(
        'button[form="formularioPagamento"]'
    );

    if (!botao) return;

    if (botao.dataset.textoOriginal === undefined) {

        botao.dataset.textoOriginal = botao.textContent;
    }

    botao.disabled = enviando;

    botao.textContent = enviando
        ? "Enviando pedido..."
        : botao.dataset.textoOriginal;
}

// ==========================================
// 14. AVISOS
// ==========================================

function mostrarAviso(mensagem, tipo) {

    let aviso = document.getElementById("avisoPagamento");

    if (!aviso) {

        aviso = document.createElement("div");

        aviso.id = "avisoPagamento";

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
            "text-align:center"
        ].join(";");

        document.body.appendChild(aviso);
    }

    aviso.textContent = mensagem;

    aviso.style.background = tipo === "erro"
        ? "#b3261e"
        : "#4e342e";

    aviso.style.display = "block";

    clearTimeout(temporizadorAviso);

    temporizadorAviso = setTimeout(() => {

        aviso.style.display = "none";

    }, 5000);
}
