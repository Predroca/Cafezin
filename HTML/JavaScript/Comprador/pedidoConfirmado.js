// ==========================================
// pedidoConfirmado.js  (indexComprador.html)
// Depois de finalizar um pedido, o pagamentoItens.js guarda
// sessionStorage["cafezinPedidoConfirmado"] e volta para o início.
// Aqui a mensagem de confirmação é mostrada uma única vez.
// ==========================================

const CHAVE_PEDIDO_CONFIRMADO = "cafezinPedidoConfirmado";

document.addEventListener("DOMContentLoaded", () => {
    let pedido = null;

    try {
        const bruto = sessionStorage.getItem(CHAVE_PEDIDO_CONFIRMADO);
        if (!bruto) return;

        pedido = JSON.parse(bruto);
        sessionStorage.removeItem(CHAVE_PEDIDO_CONFIRMADO); // só aparece uma vez
    } catch (erro) {
        console.error("Erro ao ler a confirmação do pedido:", erro);
        return;
    }

    if (!pedido) return;

    const numero = pedido.cod_pedido != null ? ` #${pedido.cod_pedido}` : "";
    const total = Number(pedido.valor_total);
    const valor = Number.isFinite(total)
        ? ` Total: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`
        : "";

    mostrarConfirmacaoPedido(`Pedido${numero} realizado com sucesso!${valor}`);
});

function mostrarConfirmacaoPedido(mensagem) {
    const aviso = document.createElement("div");
    aviso.setAttribute("role", "status");
    aviso.style.cssText = [
        "position:fixed", "left:50%", "top:24px",
        "transform:translateX(-50%)", "max-width:90%",
        "padding:14px 22px", "border-radius:10px",
        "background:#2e6b3a", "color:#fff", "font-size:15px",
        "box-shadow:0 4px 14px rgba(0,0,0,.25)", "z-index:9999",
        "text-align:center", "cursor:pointer",
    ].join(";");
    aviso.textContent = mensagem;

    const fechar = () => aviso.remove();
    aviso.addEventListener("click", fechar);
    setTimeout(fechar, 7000);

    document.body.appendChild(aviso);
}