/*
Dados da sacola (compartilhados entre sacola.html, pagamento.html e produtosLoja.html)
Os dados ficam no localStorage enquanto não há back-end (mesmo padrão do perfilComprador.js).
Quando a API existir, troque ler() e salvar() por chamadas fetch.

Formato:
{ loja: { id, nome }, itens: [ { id, nome, preco (unitário), imagem, quantidade, estoque, marcado } ] }
*/

const SacolaDados = (function () {
    const CHAVE = 'cafezinSacola';

    const QUANTIDADE_MINIMA = 1;
    const ESTOQUE_PADRAO = 10;
    const VALOR_FRETE = 3.99;
    const FRETE_GRATIS_A_PARTIR_DE = 25;

    // Exemplo (troque pelos dados do back-end). Usado só enquanto a sacola nunca foi salva.
    function criarPadrao() {
        return {
            loja: { id: 1, nome: 'Empório do Café' },
            itens: [
                { id: 1, nome: 'Chocolate quente cremoso', preco: 15, imagem: 'img/indexComprador/ProdutoExemplar1.jpg', quantidade: 1, estoque: 10, marcado: true },
                { id: 4, nome: 'Bolo de cenoura caseiro', preco: 25, imagem: 'img/indexComprador/ProdutoExemplar4.jpg', quantidade: 1, estoque: 10, marcado: true }
            ]
        };
    }

    // Para testes: abrir qualquer tela com ?resetarSacola na URL volta aos produtos de exemplo
    // (ex.: sacola.html?resetarSacola). Remova quando houver back-end.
    if (/[?&]resetarSacola\b/.test(location.search)) {
        try { localStorage.removeItem(CHAVE); } catch (e) { /* sem storage */ }
    }

    function ler() {
        try {
            const bruto = localStorage.getItem(CHAVE);
            if (bruto) {
                const dados = JSON.parse(bruto);
                if (dados && Array.isArray(dados.itens)) {
                    return dados;
                }
            }
        } catch (e) { /* sem storage: usa o exemplo */ }
        return criarPadrao();
    }

    function salvar(estado) {
        try {
            localStorage.setItem(CHAVE, JSON.stringify(estado));
        } catch (e) { /* navegador sem storage: a sacola vale só nesta página */ }
    }

    function formatarPreco(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Só entram no resumo os produtos marcados
    function totais(estado) {
        let quantidadeTotal = 0;
        let quantidadeSelecionada = 0;
        let subtotal = 0;

        estado.itens.forEach(function (item) {
            quantidadeTotal += item.quantidade;
            if (item.marcado) {
                quantidadeSelecionada += item.quantidade;
                subtotal += item.preco * item.quantidade;
            }
        });

        const freteGratis = quantidadeSelecionada > 0 && subtotal >= FRETE_GRATIS_A_PARTIR_DE;
        const frete = (quantidadeSelecionada === 0 || freteGratis) ? 0 : VALOR_FRETE;

        return {
            quantidadeTotal: quantidadeTotal,
            quantidadeSelecionada: quantidadeSelecionada,
            subtotal: subtotal,
            frete: frete,
            freteGratis: freteGratis,
            total: subtotal + frete
        };
    }

    function buscarItem(estado, id) {
        return estado.itens.find(function (item) { return String(item.id) === String(id); });
    }

    // Se o produto já está na sacola, só aumenta a quantidade
    function adicionarProduto(estado, produto) {
        const existente = buscarItem(estado, produto.id);
        if (existente) {
            existente.quantidade = Math.min(existente.quantidade + 1, existente.estoque);
            return;
        }
        estado.itens.push({
            id: produto.id,
            nome: produto.nome,
            preco: Number(produto.preco) || 0,
            imagem: produto.imagem || '',
            quantidade: 1,
            estoque: ESTOQUE_PADRAO,
            marcado: true
        });
    }

    // Número do ícone da sacola no header (todos os itens, marcados ou não)
    function atualizarContador(estado) {
        $('#contadorSacola').text(totais(estado).quantidadeTotal);
    }

    // Foto do produto; sem foto (cards modelo) aparece um ícone no lugar
    function criarImagem(item) {
        if (item.imagem) {
            return $('<img class="imagemItemSacola">').attr({ src: item.imagem, alt: item.nome });
        }
        return $('<div class="imagemItemSacola semImagem" role="img"><i class="bi bi-image" aria-hidden="true"></i></div>')
            .attr('aria-label', item.nome);
    }

    return {
        QUANTIDADE_MINIMA: QUANTIDADE_MINIMA,
        FRETE_GRATIS_A_PARTIR_DE: FRETE_GRATIS_A_PARTIR_DE,
        ler: ler,
        salvar: salvar,
        formatarPreco: formatarPreco,
        totais: totais,
        buscarItem: buscarItem,
        adicionarProduto: adicionarProduto,
        atualizarContador: atualizarContador,
        criarImagem: criarImagem
    };
})();
