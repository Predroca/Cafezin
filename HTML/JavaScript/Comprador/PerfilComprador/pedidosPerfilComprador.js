/*
Histórico de pedidos do comprador.
*/

import { PEDIDOS, ROTULO_STATUS, PAGINA_INICIAL_COMPRADOR } from "./config.js";
import { $, el, estadoVazio } from "./utilitarios.js";

const CHAVE_AVALIACOES = "cafezinAvaliacoesComprador";

function lerAvaliacoes() {
    try { return JSON.parse(localStorage.getItem(CHAVE_AVALIACOES)) || {}; }
    catch (e) { return {}; }
}

function abrirAvaliacao(pedido) {
    const modal = document.getElementById("modal-avaliar");
    const form = document.getElementById("formAvaliar");

    document.getElementById("avaliarLoja").textContent = pedido.loja;
    document.getElementById("avaliarItens").textContent = pedido.itens;
    document.getElementById("avaliarMeta").textContent = pedido.codigo + " · " + pedido.data;
    document.getElementById("avaliarTotal").textContent = pedido.total;
    document.getElementById("erroAvaliar").textContent = "";

    form.reset();
    const anterior = lerAvaliacoes()[pedido.codigo];
    if (anterior) {
        const radio = form.querySelector('input[name="nota"][value="' + anterior.nota + '"]');
        if (radio) radio.checked = true;
        document.getElementById("avaliarComentario").value = anterior.comentario || "";
    }

    modal.dataset.pedidoId = pedido.codigo;
    modal.showModal();
}

export function iniciarAvaliacao() {
    const modal = document.getElementById("modal-avaliar");
    const form = document.getElementById("formAvaliar");

    modal.querySelectorAll("[data-fechar-modal]").forEach(function (botao) {
        botao.addEventListener("click", function () { modal.close(); });
    });
    modal.addEventListener("click", function (evento) {
        if (evento.target === modal) modal.close();
    });

    form.addEventListener("submit", function (evento) {
        evento.preventDefault();
        const nota = form.querySelector('input[name="nota"]:checked');
        const erro = document.getElementById("erroAvaliar");
        if (!nota) { erro.textContent = "Escolha uma nota de 1 a 5 estrelas."; return; }

        const avaliacoes = lerAvaliacoes();
        avaliacoes[modal.dataset.pedidoId] = {
            nota: Number(nota.value),
            comentario: document.getElementById("avaliarComentario").value.trim(),
            data: new Date().toISOString()
        };
        try {
            localStorage.setItem(CHAVE_AVALIACOES, JSON.stringify(avaliacoes));
        } catch (e) {
            erro.textContent = "Não foi possível salvar a avaliação neste navegador.";
            return;
        }
        modal.close();
        renderPedidos();
    });
}

export function renderPedidos() {
    const lista = $("listaPedidos");
    lista.textContent = "";

    if (!PEDIDOS.length) {
        lista.appendChild(estadoVazio("receipt", "Você ainda não fez pedidos", "Seu primeiro Cafézin está a um clique.", "Ver cafeterias", PAGINA_INICIAL_COMPRADOR + "#cafeterias"));
        return;
    }

    PEDIDOS.forEach(function (pedido) {
        const item = el("li", "itemPedido");

        const info = el("div");
        const topo = el("div", "itemPedidoTopo");
        topo.appendChild(el("h3", "", pedido.loja));
        topo.appendChild(el("span", "status " + pedido.status, ROTULO_STATUS[pedido.status]));
        info.appendChild(topo);
        info.appendChild(el("p", "", pedido.itens));
        info.appendChild(el("p", "", pedido.codigo + " · " + pedido.data));

        const lado = el("div", "itemPedidoLado");
        lado.appendChild(el("strong", "", pedido.total));
        const pedirDeNovo = el("a", "linkPedir", pedido.status === "caminho" ? "Acompanhar" : "Pedir de novo");
        pedirDeNovo.href = PAGINA_INICIAL_COMPRADOR + "#produtos";
        lado.appendChild(pedirDeNovo);

        item.appendChild(info);

        if (pedido.status === "entregue") {
            const jaAvaliou = !!lerAvaliacoes()[pedido.codigo];
            const avaliar = el("button", "botaoSecundario pequeno botaoAvaliar", jaAvaliou ? "Editar avaliação" : "Avaliar");
            avaliar.type = "button";
            avaliar.addEventListener("click", function () { abrirAvaliacao(pedido); });
            item.appendChild(avaliar);
        }

        item.appendChild(lado);
        lista.appendChild(item);
    });
}
