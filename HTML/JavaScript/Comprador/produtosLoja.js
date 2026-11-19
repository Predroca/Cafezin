/*
Página "Ver mais": todos os produtos da loja + tira de resumo da sacola embaixo.
Adicionar um produto aqui grava na mesma sacola (sacolaDados.js) e atualiza a tira.
NÃO há fetch aqui. Back: a loja vem pelo parâmetro ?loja=ID da URL e os produtos
da grade (.gradeProdutosLoja) devem vir da rota de produtos dessa loja.
*/

const estado = SacolaDados.ler();

function atualizarTira() {
    const t = SacolaDados.totais(estado);
    const vazia = estado.itens.length === 0;

    SacolaDados.atualizarContador(estado);

    if (vazia) {
        $('#tiraTitulo').text('Sua sacola está vazia');
        $('#tiraDetalhe').text('Adicione produtos para continuar.');
    } else {
        const rotuloItens = t.quantidadeTotal === 1 ? '1 item' : t.quantidadeTotal + ' itens';
        $('#tiraTitulo').text(rotuloItens + ' na sacola · ' + SacolaDados.formatarPreco(t.total));

        if (t.quantidadeSelecionada === 0) {
            $('#tiraDetalhe').text('Selecione produtos na sacola para continuar.');
        } else if (t.freteGratis) {
            $('#tiraDetalhe').text('Você ganhou frete grátis!');
        } else {
            $('#tiraDetalhe').text('Faltam ' + SacolaDados.formatarPreco(SacolaDados.FRETE_GRATIS_A_PARTIR_DE - t.subtotal) + ' para o frete grátis.');
        }
    }

    $('#botaoQuantidadeProdutos').text(t.quantidadeSelecionada);
    $('#botaoContinuar, #etapaPagamento').toggleClass('desativado', t.quantidadeSelecionada === 0);
}

$('.gradeProdutosLoja').on('click', '.botaoAdicionarSugerido', function () {
    // back: aqui entra a rota que adiciona o produto na sacola
    const $botao = $(this);
    const $card = $botao.closest('.cartaoProdutoSugerido');

    SacolaDados.adicionarProduto(estado, {
        id: $card.data('produto-id'),
        nome: $card.find('.produtoNome').text(),
        preco: $card.data('preco'),
        imagem: $card.find('img').attr('src') || ''
    });
    SacolaDados.salvar(estado);
    atualizarTira();

    // confirmação rápida no próprio botão
    $botao.addClass('adicionado').find('i').attr('class', 'bi bi-check-lg');
    clearTimeout($botao.data('temporizador'));
    $botao.data('temporizador', setTimeout(function () {
        $botao.removeClass('adicionado').find('i').attr('class', 'bi bi-plus-lg');
    }, 900));
});

$('#nomeLoja').text(estado.loja.nome);
atualizarTira();
