from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

"""
Rotas:
  GET  /                         -> catálogo de produtos (grid, com filtro por categoria)
  GET  /produto/<cod_produto>    -> página estilizada do produto (nome, preço, loja, botão de compra)
  GET  /comprar/<cod_produto>    -> página de checkout (escolher comprador/endereço/pagamento/qtd)
  POST /comprar/<cod_produto>    -> registra o pedido no banco (Pagamento + Pedido + ItemPedido)
  GET  /pedido/<cod_pedido>      -> página de confirmação com os dados do pedido registrado

Configuração da conexão em config.py (via variáveis de ambiente).
"""

from datetime import datetime

from flask import Flask, render_template, redirect, url_for, flash, request , Blueprint
from sqlalchemy.exc import SQLAlchemyError

from config import Config
from models import (
    Produto,
    Categoria,
    Loja,
    Usuario,
    Comprador,
    Comprador_Endereco,
    Pagamento,
    Pedido,
    ItemPedido,
)


def create_catalogo_bp():
    flask_catalogo_bp = Flask(__name__)
    flask_catalogo_bp.config.from_object(Config)
    db.init_catalogo_bp(flask_catalogo_bp)
    return flask_catalogo_bp


catalogo_bp = create_catalogo_bp()

VALOR_FRETE_PADRAO = 5.00
FORMAS_PAGAMENTO = ["PIX", "Boleto", "Cartão", "Dinheiro", "Transferência"]

catalogo_bp = Blueprint("catalogo", __name__)

@catalogo_bp.errorhandler(SQLAlchemyError)
def erro_banco(erro):
    """Qualquer erro do SQLAlchemy (conexão, query, etc.) cai aqui."""
    db.session.rollback()
    return render_template("erro.html", mensagem=f"Erro ao acessar o banco de dados: {erro}"), 500



@catalogo_bp.route("/")
@catalogo_bp.route("/categoria/<int:cod_categoria>")
def catalogo(cod_categoria=None):

    query = (
        Produto.query.join(Produto.loja)
        .join(Loja.usuario)
        .filter(Produto.disponibilidade.is_(True))
    )

    if cod_categoria:
        query = query.filter(Produto.cod_categoria == cod_categoria)

    produtos = query.order_by(Usuario.nome, Produto.nome).all()
    categorias = Categoria.query.order_by(Categoria.nome_categoria).all()

    return render_template(
        "catalogo.html",
        produtos=produtos,
        categorias=categorias,
        categoria_ativa=cod_categoria,
    )


@catalogo_bp.route("/produto/<int:cod_produto>")
def produto_detalhe(cod_produto):
    """Página estilizada de um produto específico."""

    produto = Produto.query.get_or_404(cod_produto)

    notas = [a.nota for a in produto.avaliacoes if a.nota is not None]
    media_avaliacao = round(sum(notas) / len(notas), 1) if notas else None

    return render_template(
        "produto.html",
        produto=produto,
        media_avaliacao=media_avaliacao,
        total_avaliacoes=len(notas),
    )


@catalogo_bp.route("/comprar/<int:cod_produto>", methods=["GET", "POST"])
def comprar(cod_produto):
    
    produto = Produto.query.get_or_404(cod_produto)

    if not produto.disponibilidade:
        flash("Este produto está indisponível no momento.")
        return redirect(url_for("produto_detalhe", cod_produto=cod_produto))

    if request.method == "POST":
        comprador_endereco = request.form.get("comprador_endereco", "")
        forma_pagamento = request.form.get("forma_pagamento", "")
        try:
            quantidade = max(1, int(request.form.get("quantidade", 1)))
        except ValueError:
            quantidade = 1

        if ":" not in comprador_endereco or forma_pagamento not in FORMAS_PAGAMENTO:
            flash("Preencha o comprador/endereço e a forma de pagamento corretamente.")
            return redirect(url_for("comprar", cod_produto=cod_produto))

        cod_comprador_str, cod_endereco_str = comprador_endereco.split(":")
        try:
            cod_comprador = int(cod_comprador_str)
            cod_endereco = int(cod_endereco_str)
        except ValueError:
            flash("Comprador/endereço inválido.")
            return redirect(url_for("comprar", cod_produto=cod_produto))

        valor_total = round(float(produto.preco) * quantidade + VALOR_FRETE_PADRAO, 2)
        agora = datetime.now()

        # cria o Pagamento e usa flush() para já ter o cod_pagamento gerado,
        # sem precisar de um commit isolado por tabela
        pagamento = Pagamento(tipo=forma_pagamento, data=agora)
        db.session.add(pagamento)
        db.session.flush()

        pedido = Pedido(
            data_pedido=agora,
            valor_frete=VALOR_FRETE_PADRAO,
            valor_total=valor_total,
            status="Confirmado",
            cod_comprador=cod_comprador,
            cod_loja=produto.cod_loja,
            cod_end_entrega=cod_endereco,
            cod_pagamento=pagamento.cod_pagamento,
        )
        db.session.add(pedido)
        db.session.flush()

        item = ItemPedido(
            quantidade=quantidade,
            preco_unitario=produto.preco,
            cod_pedido=pedido.cod_pedido,
            cod_produto=cod_produto,
        )
        db.session.add(item)

        db.session.commit()

        return redirect(url_for("pedido_confirmacao", cod_pedido=pedido.cod_pedido))

    # GET: monta a lista de comprador + endereço para o formulário de checkout
    opcoes_entrega = (
        Comprador_Endereco.query.join(Comprador_Endereco.comprador)
        .join(Comprador.usuario)
        .order_by(Usuario.nome)
        .all()
    )

    return render_template(
        "checkout.html",
        produto=produto,
        opcoes_entrega=opcoes_entrega,
        formas_pagamento=FORMAS_PAGAMENTO,
        valor_frete=VALOR_FRETE_PADRAO,
    )


@catalogo_bp.route("/pedido/<int:cod_pedido>")
def pedido_confirmacao(cod_pedido):
    """Página de confirmação com os dados do pedido já registrado no banco."""

    pedido = Pedido.query.get_or_404(cod_pedido)
    return render_template("pedido_confirmacao.html", pedido=pedido, itens=pedido.itens)


@catalogo_bp.errorhandler(404)
def nao_encontrado(e):
    return render_template("erro.html", mensagem="Produto ou pedido não encontrado."), 404


if __name__ == "__main__":
    catalogo_bp.run(debug=True, port=5000)
