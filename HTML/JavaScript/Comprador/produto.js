/*
Tela de produto (esqueleto)
Por enquanto só controla o seletor de quantidade e o total do botão.
NÃO há fetch aqui: os dados da página ainda são o texto fixo do HTML.
*/

const QUANTIDADE_MINIMA = 1;
const QUANTIDADE_MAXIMA = 20;

let quantidade = QUANTIDADE_MINIMA;

function formatarPreco(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarQuantidade() {
    const precoUnitario = parseFloat($('#botaoAdicionar').data('preco'));

    $('#quantidade').text(quantidade);
    $('#totalItem').text(formatarPreco(precoUnitario * quantidade));

    $('#diminuirQuantidade').prop('disabled', quantidade <= QUANTIDADE_MINIMA);
    $('#aumentarQuantidade').prop('disabled', quantidade >= QUANTIDADE_MAXIMA);
}

$('#diminuirQuantidade').on('click', () => {
    if (quantidade > QUANTIDADE_MINIMA) {
        quantidade--;
        atualizarQuantidade();
    }
});

$('#aumentarQuantidade').on('click', () => {
    if (quantidade < QUANTIDADE_MAXIMA) {
        quantidade++;
        atualizarQuantidade();
    }
});

atualizarQuantidade();
