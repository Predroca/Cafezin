(() => {
    document.addEventListener("click", (evento) => {
        if (evento.target.closest(".adicionar")) return;
        const card = evento.target.closest("[data-cod-produto]");
        if (card?.dataset.codProduto) {
            window.location.href = `produto.html?cod_produto=${encodeURIComponent(card.dataset.codProduto)}`;
        }
    });
    document.addEventListener("keydown", (evento) => {
        if (evento.key !== "Enter" && evento.key !== " ") return;
        const card = evento.target.closest?.("[data-cod-produto][role='link']");
        if (!card) return;
        evento.preventDefault();
        window.location.href = `produto.html?cod_produto=${encodeURIComponent(card.dataset.codProduto)}`;
    });
})();
