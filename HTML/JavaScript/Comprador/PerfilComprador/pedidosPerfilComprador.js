/*
Histórico de pedidos do comprador.
*/

import { PEDIDOS, ROTULO_STATUS, PAGINA_INICIAL_COMPRADOR } from "./config.js";
import { $, el, estadoVazio } from "./utilitarios.js";

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

        item.append(info, lado);
        lista.appendChild(item);
    });
}
