async function carregarCardapio() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "loginLoja.html";
        return;
    }

    try {
        const resposta = await fetch(`${API_BASE}/lojas/cardapio`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (resposta.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "loginLoja.html";
            return;
        }

        if (resposta.status === 403) {
            alert("Você não possui autorização para acessar este painel.");
            return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao carregar o cardápio.");
        }

        console.log("Cardápio recebido:", dados);

        // Aqui você utiliza os dados para montar os cards
        renderizarProdutos(dados.produtos);

        // Atualiza o nome da loja
        document.getElementById("nomeLoja").textContent = dados.nome;

        // Atualiza a quantidade de produtos
        document.getElementById("totalProdutosAtivos").textContent =
            dados.produtos.length;

    } catch (erro) {
        console.error("Erro:", erro);
    }
}