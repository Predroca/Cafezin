/*
Tela de pagamento
Mostra os produtos MARCADOS na sacola (somente leitura) e o resumo do pedido.
Os produtos vêm de sacolaDados.js (localStorage). NÃO há fetch aqui.
Se não houver produto marcado, aparece o mesmo estado vazio da sacola.
Para o back: o envio do formulário (#formularioPagamento) ainda não faz nada.
*/

const estado = SacolaDados.ler();
const selecionados = estado.itens.filter(function (item) { return item.marcado; });
const t = SacolaDados.totais(estado);

function criarLinhaItem(item) {
    const $linha = $(`
        <article class="itemSacola itemSomenteLeitura">
            <div class="espacoImagem"></div>
            <div class="infoItemSacola">
                <span class="nomeItemSacola"></span>
                <span class="detalheItemSacola">Quantidade: <span class="quantidadeItemPedido"></span></span>
            </div>
            <div class="precoItemSacola">
                <span class="precoTotalItem"></span>
            </div>
        </article>
    `);

    $linha.attr('data-produto-id', item.id);
    $linha.find('.espacoImagem').replaceWith(SacolaDados.criarImagem(item));
    $linha.find('.nomeItemSacola').text(item.nome);
    $linha.find('.quantidadeItemPedido').text(item.quantidade);
    $linha.find('.precoTotalItem').text(SacolaDados.formatarPreco(item.preco * item.quantidade));
    return $linha;
}

function criarLinhaResumo(item) {
    const $linha = $('<li class="itemPedido"><span class="itemPedidoNome"></span><span class="itemPedidoPreco"></span></li>');
    $linha.find('.itemPedidoNome').text(item.quantidade + 'x ' + item.nome);
    $linha.find('.itemPedidoPreco').text(SacolaDados.formatarPreco(item.preco * item.quantidade));
    return $linha;
}

SacolaDados.atualizarContador(estado);

const vazio = selecionados.length === 0;
$('#conteudoPagamento').toggleClass('semProdutos', vazio);
$('#estadoVazio').toggleClass('escondido', !vazio);
$('#secaoProdutos, #painelFormaPagamento, #resumoPedido').toggleClass('escondido', vazio);

if (!vazio) {
    $('#nomeLoja').text(estado.loja.nome);

    selecionados.forEach(function (item) {
        $('#listaItens').append(criarLinhaItem(item));
        $('#listaItensPedido').append(criarLinhaResumo(item));
    });

    $('#resumoQuantidadeProdutos').text(t.quantidadeSelecionada);
    $('#resumoSubtotal').text(SacolaDados.formatarPreco(t.subtotal));
    $('#resumoTotal').text(SacolaDados.formatarPreco(t.total));
    $('.valorFrete')
        .text(t.freteGratis ? 'Grátis' : SacolaDados.formatarPreco(t.frete))
        .toggleClass('valorGratis', t.freteGratis);
}
