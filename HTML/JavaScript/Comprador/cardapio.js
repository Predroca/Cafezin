async function pegaCardapioUser() {
    try{

        const resposta = await fetch('http://localhost:5000/produtos');

        if(!resposta.ok){
            throw new Error(`Erro na rede: ${resposta.status}`)
        }
            const cardapio = await resposta.json();
    
            cardapio.produtos.forEach((produto, index)=>{
                $('.produtoNome').eq(index).text(produto.nome);
                $('.lojaNome').eq(index).text(produto.loja);
                $('.preco').eq(index).text(`R$ ${produto.preco.toFixed(2)}`)
            })



    }catch(erro){
        console.error('não foi possivel buscar os dados: ', erro);
    }


}
pegaCardapioUser()
    