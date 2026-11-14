
document.addEventListener("DOMContentLoaded", () => {
    const botoes = document.querySelectorAll(".filtrosProdutos button");

    const categoriasSelecionadas = new Set();
    let mostrarIndisponiveis = false;

    function atualizarProdutos() {
        // Busca os cards novamente, incluindo os criados dinamicamente
        const produtos = document.querySelectorAll(
            ".listaProdutosLoja .produto"
        );

        const todosAtivo =
            categoriasSelecionadas.size === 0 && !mostrarIndisponiveis;

        botoes.forEach((botao) => {
            const filtro = botao.dataset.filtro;

            const ativo = filtro === "todos"
                ? todosAtivo
                : filtro === "indisponiveis"
                    ? mostrarIndisponiveis
                    : categoriasSelecionadas.has(filtro);

            botao.classList.toggle("ativo", ativo);
            botao.setAttribute("aria-pressed", String(ativo));
        });

        produtos.forEach((produto) => {
            const categoria = produto.dataset.categoria;
            const indisponivel = produto.classList.contains("pausado");

            const correspondeCategoria =
                categoriasSelecionadas.size === 0 ||
                categoriasSelecionadas.has(categoria);

            const correspondeDisponibilidade =
                !mostrarIndisponiveis || indisponivel;

            produto.hidden = !(
                correspondeCategoria && correspondeDisponibilidade
            );
        });
    }

    botoes.forEach((botao) => {
        botao.addEventListener("click", () => {
            const filtro = botao.dataset.filtro;

            if (filtro === "todos") {
                categoriasSelecionadas.clear();
                mostrarIndisponiveis = false;

            } else if (filtro === "indisponiveis") {
                mostrarIndisponiveis = !mostrarIndisponiveis;

            } else if (categoriasSelecionadas.has(filtro)) {
                categoriasSelecionadas.delete(filtro);

            } else {
                categoriasSelecionadas.add(filtro);
            }

            atualizarProdutos();
        });
    });

    // Permite atualizar os filtros depois que os cards forem criados
    window.atualizarFiltrosProdutos = atualizarProdutos;

    atualizarProdutos();
});
