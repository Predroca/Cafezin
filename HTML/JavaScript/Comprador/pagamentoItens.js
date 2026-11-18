// ==========================================
// pagamentoItens.js
// Mostra em pagamento.html os produtos MARCADOS na sacola
// (localStorage["cafezinSacola"], campo "selecionado") e os valores.
// "Finalizar pedido" envia o pedido para o backend (POST /pedidos) e, se der
// certo, tira os itens comprados da sacola e volta para o indexComprador.html.
// ==========================================

const CHAVE_SACOLA = "cafezinSacola";
const VALOR_FRETE_PADRAO = 5.0;          // mesma regra do backend
const FRETE_GRATIS_A_PARTIR_DE = 25.0;   // mesma regra do backend

document.addEventListener("DOMContentLoaded", renderizarPagamento);

// volta pelo botão "voltar" do navegador (página vinda do cache)
window.addEventListener("pageshow", evento => {
    if (evento.persisted) renderizarPagamento();
});

// ------------------------------------------
// 1. localStorage
// ------------------------------------------

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

    return { cod_loja: null, nome_loja: "", itens: [] };
}

function itemSelecionado(item) {
    return item.selecionado !== false;
}

// mesmo cálculo da sacola.js (em centavos)
function calcularTotais(selecionados) {
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
        unidades,
        subtotal,
        frete,
        freteGratis: selecionados.length > 0 && frete === 0,
        total: (subtotalCentavos + Math.round(frete * 100)) / 100,
    };
}

// ------------------------------------------
// 2. Render
// ------------------------------------------

function renderizarPagamento() {
    const sacola = lerSacola();
    const selecionados = sacola.itens.filter(itemSelecionado);

    // o número do cabeçalho é o da sacola inteira
    definirTexto(
        "contadorSacola",
        sacola.itens.reduce((soma, i) => soma + Number(i.quantidade), 0)
    );

    const vazio = selecionados.length === 0;

    document.getElementById("conteudoPagamento")?.classList.toggle("semProdutos", vazio);
    document.getElementById("estadoVazio")?.classList.toggle("escondido", !vazio);
    document.getElementById("secaoProdutos")?.classList.toggle("escondido", vazio);
    document.getElementById("painelFormaPagamento")?.classList.toggle("escondido", vazio);
    document.getElementById("resumoPedido")?.classList.toggle("escondido", vazio);

    if (vazio) return;

    document.querySelectorAll('[id="nomeLoja"]').forEach(el => {
        el.textContent = sacola.nome_loja || "Cafeteria";
    });

    const lista = document.getElementById("listaItens");
    if (lista) lista.innerHTML = selecionados.map(criarItemPagamento).join("");

    const listaResumo = document.getElementById("listaItensPedido");
    if (listaResumo) listaResumo.innerHTML = selecionados.map(criarItemResumo).join("");

    renderizarResumo(calcularTotais(selecionados));
}

// mesma linha da sacola, só leitura (sem checkbox, remover ou +/−)
function criarItemPagamento(item) {
    const quantidade = Number(item.quantidade);
    const preco = Number(item.preco);
    const nome = item.nome || "Produto";

    const imagem = item.foto_url
        ? `<img class="imagemItemSacola" src="${escaparHTML(item.foto_url)}" alt="${escaparHTML(nome)}">`
        : `<div class="imagemItemSacola semImagem" aria-hidden="true"><i class="bi bi-image"></i></div>`;

    // sem checkbox, a grade tem 3 colunas em vez de 4
    return `
        <article class="itemSacola" data-produto-id="${escaparHTML(item.cod_produto)}"
            style="grid-template-columns: 100px 1fr auto;">
            ${imagem}

            <div class="infoItemSacola">
                <h3 class="nomeItemSacola">${escaparHTML(nome)}</h3>
                <span class="detalheItemSacola">
                    ${quantidade} × ${formatarPreco(preco)}
                </span>
            </div>

            <div class="precoItemSacola">
                <strong class="precoTotalItem">${formatarPreco(preco * quantidade)}</strong>
            </div>
        </article>
    `;
}

// linha compacta da lista do resumo (aside)
function criarItemResumo(item) {
    const quantidade = Number(item.quantidade);
    const preco = Number(item.preco);

    return `
        <li class="itemPedido" data-produto-id="${escaparHTML(item.cod_produto)}">
            <span>${quantidade} × ${escaparHTML(item.nome || "Produto")}</span>
            <span>${formatarPreco(preco * quantidade)}</span>
        </li>
    `;
}

function renderizarResumo(totais) {
    const textoFrete = totais.freteGratis ? "Grátis" : formatarPreco(totais.frete);

    definirTexto("freteCafeteria", textoFrete);
    definirTexto("resumoQuantidadeProdutos", totais.unidades);
    definirTexto("resumoSubtotal", formatarPreco(totais.subtotal));
    definirTexto("resumoFrete", textoFrete);
    definirTexto("resumoTotal", formatarPreco(totais.total));

    ["freteCafeteria", "resumoFrete"].forEach(id => {
        document.getElementById(id)?.classList.toggle("valorGratis", totais.freteGratis);
    });
}

// ------------------------------------------
// 3. Auxiliares
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


// ------------------------------------------
// 4. Finalizar pedido (POST /pedidos)
// ------------------------------------------
// O backend cria o pedido a partir de:
//   { itens: [{cod_produto, quantidade}], cod_endereco, forma_pagamento }
// e exige o token JWT de um Comprador. Preços e frete são recalculados lá.
// Dados de cartão/troco NÃO são enviados: o backend só guarda a forma de pagamento.

const API_URL = "http://localhost:5000";
const ROTA_PEDIDOS = "/pedidos";

const ROTA_ENDERECOS = "/enderecos";   // GET -> {"enderecos": [{cod_endereco, ...}]} (endereco.py)

// >>> CONFIRMAR: onde o login guardou o JWT (não vi esse arquivo) <<<
const CHAVES_TOKEN = ["token", "access_token", "accessToken", "jwt"];

const CHAVE_PEDIDO_CONFIRMADO = "cafezinPedidoConfirmado"; // lida pelo pedidoConfirmado.js
const PAGINA_INICIO = "indexComprador.html";

let enviandoPedido = false;

class ErroPedido extends Error {}

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("formularioPagamento")
        ?.addEventListener("submit", finalizarPedido);
});

async function finalizarPedido(evento) {
    evento.preventDefault();
    if (enviandoPedido) return;

    const selecionados = lerSacola().itens.filter(itemSelecionado);
    if (selecionados.length === 0) {
        mostrarAviso("Marque ao menos um produto na sacola.", "erro");
        return;
    }

    const formaPagamento = document.querySelector('input[name="formaPagamento"]:checked')?.value;
    if (!formaPagamento) {
        mostrarAviso("Escolha uma forma de pagamento.", "erro");
        return;
    }

    definirEnviando(true);

    try {
        const token = obterToken();
        if (!token) {
            throw new ErroPedido("Entre na sua conta para finalizar o pedido.");
        }

        const codEndereco = await obterEnderecoEntrega(token);

        const resposta = await fetch(`${API_URL}${ROTA_PEDIDOS}`, {
            method: "POST",
            headers: cabecalhosAutenticados(token),
            body: JSON.stringify({
                itens: selecionados.map(item => ({
                    cod_produto: Number(item.cod_produto),
                    quantidade: Number(item.quantidade),
                })),
                cod_endereco: codEndereco,
                forma_pagamento: formaPagamento,
            }),
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new ErroPedido(mensagemDeErro(resposta.status, dados));
        }

        concluirPedido(selecionados, dados);   // redireciona; não volta o botão
    } catch (erro) {
        if (erro instanceof ErroPedido) {
            mostrarAviso(erro.message, "erro");
        } else {
            console.error("Erro ao finalizar o pedido:", erro);
            mostrarAviso("Não foi possível conectar ao servidor. Tente novamente.", "erro");
        }
        definirEnviando(false);
    }
}

// ---- token e endereço ----

function obterToken() {
    for (const armazenamento of [localStorage, sessionStorage]) {
        for (const chave of CHAVES_TOKEN) {
            try {
                const valor = armazenamento.getItem(chave);
                if (valor) return valor.replace(/^"|"$/g, "");
            } catch (erro) {
                // armazenamento bloqueado: tenta o próximo
            }
        }
    }
    return null;
}

function cabecalhosAutenticados(token) {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}

// O pedido precisa de um cod_endereco que seja do próprio comprador.
// A rota não marca endereço principal, então usa o primeiro da lista.
async function obterEnderecoEntrega(token) {
    const resposta = await fetch(`${API_URL}${ROTA_ENDERECOS}`, {
        headers: cabecalhosAutenticados(token),
    });

    if (resposta.status === 401 || resposta.status === 422) {
        throw new ErroPedido("Sua sessão expirou. Entre novamente para finalizar o pedido.");
    }
    if (!resposta.ok) {
        throw new ErroPedido("Não foi possível buscar seu endereço de entrega.");
    }

    const dados = await resposta.json().catch(() => ({}));
    const lista = dados.enderecos || [];

    if (lista.length === 0) {
        throw new ErroPedido("Cadastre um endereço de entrega no seu perfil antes de finalizar o pedido.");
    }

    return lista[0].cod_endereco;
}

function mensagemDeErro(status, dados) {
    if (status === 401 || status === 422) {
        return "Sua sessão expirou. Entre novamente para finalizar o pedido.";
    }
    if (status === 403) {
        return "Só contas de comprador podem fazer pedidos.";
    }
    return dados.error || dados.msg || "Não foi possível finalizar o pedido.";
}

// ---- sucesso ----

function concluirPedido(itensPedido, resposta) {
    // tira da sacola só o que foi comprado; o que ficou desmarcado continua lá
    const comprados = new Set(itensPedido.map(i => Number(i.cod_produto)));
    const sacola = lerSacola();
    sacola.itens = sacola.itens.filter(i => !comprados.has(Number(i.cod_produto)));

    try {
        if (sacola.itens.length === 0) {
            localStorage.removeItem(CHAVE_SACOLA);
        } else {
            localStorage.setItem(CHAVE_SACOLA, JSON.stringify(sacola));
        }

        // o indexComprador.html mostra a confirmação a partir disto
        sessionStorage.setItem(CHAVE_PEDIDO_CONFIRMADO, JSON.stringify({
            cod_pedido: resposta.cod_pedido,
            valor_total: resposta.valor_total,
        }));
    } catch (erro) {
        console.error("Erro ao atualizar o armazenamento:", erro);
    }

    window.location.href = PAGINA_INICIO;
}

// ---- interface ----

function definirEnviando(enviando) {
    enviandoPedido = enviando;

    const botao = document.querySelector('button[form="formularioPagamento"]');
    if (!botao) return;

    if (botao.dataset.textoOriginal === undefined) {
        botao.dataset.textoOriginal = botao.textContent;
    }
    botao.disabled = enviando;
    botao.textContent = enviando ? "Enviando pedido..." : botao.dataset.textoOriginal;
}

let temporizadorAviso = null;

function mostrarAviso(mensagem, tipo) {
    let aviso = document.getElementById("avisoPagamento");

    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "avisoPagamento";
        aviso.setAttribute("role", "alert");
        aviso.style.cssText = [
            "position:fixed", "left:50%", "bottom:24px",
            "transform:translateX(-50%)", "max-width:90%",
            "padding:12px 20px", "border-radius:10px", "color:#fff",
            "font-size:15px", "box-shadow:0 4px 14px rgba(0,0,0,.25)",
            "z-index:9999", "text-align:center",
        ].join(";");
        document.body.appendChild(aviso);
    }

    aviso.textContent = mensagem;
    aviso.style.background = tipo === "erro" ? "#b3261e" : "#4e342e";
    aviso.style.display = "block";

    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => {
        aviso.style.display = "none";
    }, 5000);
}