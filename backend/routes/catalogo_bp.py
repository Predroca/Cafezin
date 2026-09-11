"""
Rotas (agora em JSON, sem templates):
  GET  /produtos                       -> catálogo de produtos (filtro opcional ?categoria=)
  GET  /produtos/<cod_produto>         -> detalhe de um produto (com média de avaliação)
  POST /pedidos                        -> registra o pedido no banco (Pagamento + Pedido + ItemPedido)
  GET  /pedidos/<cod_pedido>           -> confirmação com os dados do pedido registrado
"""

from datetime import datetime

from flask import Blueprint, request
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from models.produto import Produto
from models.categoria import Categoria
from models.loja import Loja
from models.usuario import Usuario
from models.comprador_endereco import Comprador_Endereco
from models.comprador import Comprador
from models.pagamento import Pagamento
from models.pedido import Pedido
from models.item_pedido import ItemPedido

catalogo_bp = Blueprint("catalogo", __name__)

VALOR_FRETE_PADRAO = 5.00
FORMAS_PAGAMENTO = ["PIX", "Boleto", "Cartão", "Dinheiro", "Transferência"]


@catalogo_bp.errorhandler(SQLAlchemyError)
def erro_banco(erro):
    """Qualquer erro do SQLAlchemy (conexão, query, etc.) cai aqui."""
    db.session.rollback()
    return {"error": f"erro ao acessar o banco de dados: {erro}"}, 500


@catalogo_bp.route("/produtos", methods=["GET"])
def catalogo():
    cod_categoria = request.args.get("categoria", type=int)

    query = (
        Produto.query.join(Produto.loja)
        .join(Loja.usuario)
        .filter(Produto.disponibilidade.is_(True))
    )

    if cod_categoria:
        query = query.filter(Produto.cod_categoria == cod_categoria)

    produtos = query.order_by(Usuario.nome, Produto.nome).all()

    return {
        "produtos": [
            {
                "cod_produto": p.cod_produto,
                "nome": p.nome,
                "preco": float(p.preco),
                "loja": p.loja.usuario.nome,
                "cod_categoria": p.cod_categoria,
            }
            for p in produtos
        ]
    }


@catalogo_bp.route("/produtos/<int:cod_produto>", methods=["GET"])
def produto_detalhe(cod_produto):
    produto = Produto.query.get_or_404(cod_produto)

    notas = [a.nota for a in produto.avaliacoes if a.nota is not None]
    media_avaliacao = round(sum(notas) / len(notas), 1) if notas else None

    return {
        "cod_produto": produto.cod_produto,
        "nome": produto.nome,
        "descricao": produto.descricao,
        "preco": float(produto.preco),
        "loja": produto.loja.usuario.nome,
        "media_avaliacao": media_avaliacao,
        "total_avaliacoes": len(notas),
    }


@catalogo_bp.route("/pedidos", methods=["POST"])
def criar_pedido():
    dados = request.get_json()

    cod_produto = dados.get("cod_produto")
    cod_comprador = dados.get("cod_comprador")
    cod_endereco = dados.get("cod_endereco")
    forma_pagamento = dados.get("forma_pagamento")
    quantidade = max(1, int(dados.get("quantidade", 1)))

    if forma_pagamento not in FORMAS_PAGAMENTO:
        return {"error": "forma de pagamento inválida"}, 400

    produto = Produto.query.get_or_404(cod_produto)

    if not produto.disponibilidade:
        return {"error": "produto indisponível no momento"}, 409

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

    return {"message": "pedido criado", "cod_pedido": pedido.cod_pedido}, 201


@catalogo_bp.route("/pedidos/<int:cod_pedido>", methods=["GET"])
def pedido_confirmacao(cod_pedido):
    pedido = Pedido.query.get_or_404(cod_pedido)

    return {
        "cod_pedido": pedido.cod_pedido,
        "status": pedido.status,
        "valor_total": float(pedido.valor_total),
        "valor_frete": float(pedido.valor_frete),
        "itens": [
            {
                "produto": item.produto.nome,
                "quantidade": item.quantidade,
                "preco_unitario": float(item.preco_unitario),
            }
            for item in pedido.itens
        ],
    }
