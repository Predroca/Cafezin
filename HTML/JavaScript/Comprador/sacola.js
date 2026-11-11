/*
Tela da sacola
Controla: checklist (todos / cafeteria / produto), botões de + e - da quantidade,
remover produto, limpar sacola, adicionar produto sugerido, resumo da compra e
o estado de sacola vazia.
Os produtos vêm de sacolaDados.js (localStorage). NÃO há fetch aqui.
Para o back: cada .itemSacola tem data-produto-id; o resumo é escrito nos ids
resumoQuantidadeProdutos, resumoSubtotal, resumoFrete e resumoTotal.
*/

let estado = SacolaDados.ler();

function persistir() {
    SacolaDados.salvar(estado);
}

/* ===== Um produto (.itemSacola) ===== */

function atualizarLinha($linha, item) {
    $linha.find('.quantidadeValor').text(item.quantidade);
    $linha.find('.precoTotalItem').text(SacolaDados.formatarPreco(item.preco * item.quantidade));
    $linha.find('.botaoDiminuir').prop('disabled', item.quantidade <= SacolaDados.QUANTIDADE_MINIMA);
    $linha.find('.botaoAumentar').prop('disabled', item.quantidade >= item.estoque);
}

function criarLinhaItem(item) {
    const $linha = $(`
        <article class="itemSacola">
            <input type="checkbox" class="checkItem">
            <div class="espacoImagem"></div>
            <div class="infoItemSacola">
                <div class="linhaNomeItem">
                    <span class="nomeItemSacola"></span>
                    <button type="button" class="botaoRemoverItem" aria-label="Remover produto"><i class="bi bi-trash" aria-hidden="true"></i></button>
                </div>
                <span class="disponibilidadeItem"></span>
            </div>
            <div class="precoItemSacola">
                <span class="precoTotalItem"></span>
                <div class="quantidadeItem">
                    <button type="button" class="botaoDiminuir" aria-label="Diminuir quantidade"><i class="bi bi-dash" aria-hidden="true"></i></button>
                    <span class="quantidadeValor">1</span>
                    <button type="button" class="botaoAumentar" aria-label="Aumentar quantidade"><i class="bi bi-plus" aria-hidden="true"></i></button>
                </div>
            </div>
        </article>
    `);

    $linha.attr('data-produto-id', item.id);
    $linha.find('.espacoImagem').replaceWith(SacolaDados.criarImagem(item));
    $linha.find('.nomeItemSacola').text(item.nome);
    $linha.find('.disponibilidadeItem').text('+' + item.estoque + ' disponíveis');
    $linha.find('.checkItem')
        .prop('checked', item.marcado)
        .attr('aria-label', 'Selecionar ' + item.nome);

    atualizarLinha($linha, item);
    return $linha;
}

function renderItens() {
    const $lista = $('#listaItens').empty();
    estado.itens.forEach(function (item) {
        $lista.append(criarLinhaItem(item));
    });
}

function itemDaLinha(elemento) {
    return SacolaDados.buscarItem(estado, $(elemento).closest('.itemSacola').data('produto-id'));
}

function mudarQuantidade($linha, item, variacao) {
    item.quantidade = Math.min(Math.max(item.quantidade + variacao, SacolaDados.QUANTIDADE_MINIMA), item.estoque);
    atualizarLinha($linha, item);
    persistir();
    atualizarResumo();
}

/* ===== Resumo da compra, checklist, cabeçalho e sacola vazia ===== */

function atualizarResumo() {
    const t = SacolaDados.totais(estado);

    $('#resumoQuantidadeProdutos').text(t.quantidadeSelecionada);
    $('#botaoQuantidadeProdutos').text(t.quantidadeSelecionada);
    $('#resumoSubtotal').text(SacolaDados.formatarPreco(t.subtotal));
    $('#resumoTotal').text(SacolaDados.formatarPreco(t.total));

    // .valorFrete aparece no resumo e na área do frete da cafeteria
    $('.valorFrete')
        .text(t.freteGratis ? 'Grátis' : SacolaDados.formatarPreco(t.frete))
        .toggleClass('valorGratis', t.freteGratis);

    if (t.quantidadeSelecionada === 0) {
        $('#avisoFrete').text('Selecione produtos para calcular o frete.');
    } else if (t.freteGratis) {
        $('#avisoFrete').text('Você ganhou frete grátis!');
    } else {
        $('#avisoFrete').text('Faltam ' + SacolaDados.formatarPreco(SacolaDados.FRETE_GRATIS_A_PARTIR_DE - t.subtotal) + ' para o frete grátis.');
    }

    SacolaDados.atualizarContador(estado);

    // sem produto marcado não dá para continuar (botão e etapa "Pagamento" do header)
    $('#botaoContinuar, #etapaPagamento').toggleClass('desativado', t.quantidadeSelecionada === 0);

    // checklist: "todos" e "loja" acompanham os produtos
    const todosMarcados = estado.itens.length > 0 && estado.itens.every(function (i) { return i.marcado; });
    $('#selecionarTodos, .checkLoja').prop('checked', todosMarcados);

    // sacola sem nenhum produto: mostra o estado vazio e esconde o resto
    const vazia = estado.itens.length === 0;
    $('#conteudoSacola').toggleClass('semProdutos', vazia);
    $('#estadoVazio').toggleClass('escondido', !vazia);
    $('#secaoProdutos, #maisProdutos, #resumoCompra').toggleClass('escondido', vazia);
}

/* ===== Eventos =====
Como produtos podem ser criados e removidos, os eventos ficam na seção inteira. */

$('#selecionarTodos, .checkLoja').on('change', function () {
    const marcar = this.checked;
    estado.itens.forEach(function (item) { item.marcado = marcar; });
    $('.checkItem').prop('checked', marcar);
    persistir();
    atualizarResumo();
});

$('#secaoProdutos').on('change', '.checkItem', function () {
    itemDaLinha(this).marcado = this.checked;
    persistir();
    atualizarResumo();
});

$('#secaoProdutos').on('click', '.botaoDiminuir', function () {
    mudarQuantidade($(this).closest('.itemSacola'), itemDaLinha(this), -1);
});

$('#secaoProdutos').on('click', '.botaoAumentar', function () {
    mudarQuantidade($(this).closest('.itemSacola'), itemDaLinha(this), 1);
});

$('#secaoProdutos').on('click', '.botaoRemoverItem', function () {
    // back: aqui entra a rota que remove o produto da sacola
    const id = $(this).closest('.itemSacola').data('produto-id');
    estado.itens = estado.itens.filter(function (item) { return String(item.id) !== String(id); });
    persistir();
    renderItens();
    atualizarResumo();
});

$('#botaoLimparSacola').on('click', function () {
    if (confirm('Remover todos os produtos da sacola?')) {
        // back: aqui entra a rota que limpa a sacola
        estado.itens = [];
        persistir();
        renderItens();
        atualizarResumo();
    }
});

$('.painelMaisProdutos').on('click', '.botaoAdicionarSugerido', function () {
    // back: aqui entra a rota que adiciona o produto na sacola
    const $card = $(this).closest('.cartaoProdutoSugerido');
    SacolaDados.adicionarProduto(estado, {
        id: $card.data('produto-id'),
        nome: $card.find('.produtoNome').text(),
        preco: $card.data('preco'),
        // os cards modelo não têm imagem, então fica vazio
        imagem: $card.find('img').attr('src') || ''
    });
    persistir();
    renderItens();
    atualizarResumo();
});

// "Ver produtos": rola só a área da sacola até "Adicione mais produtos" (não a página toda)
$('.linkVerProdutos').on('click', function (e) {
    e.preventDefault();
    const area = document.getElementById('areaRolagem');
    const painel = document.getElementById('maisProdutos');
    area.scrollTo({ top: painel.offsetTop, behavior: 'smooth' });
});

/* ===== Início ===== */

$('#nomeLoja').text(estado.loja.nome);
renderItens();
atualizarResumo();
