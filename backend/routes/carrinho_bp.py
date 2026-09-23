"""
Rotas (agora em JSON, sem templates):
  GET  /produtos                       -> catálogo de produtos (filtro opcional ?categoria=)
  GET  /produtos/<cod_produto>         -> detalhe de um produto (com média de avaliação)
  POST /pedidos                        -> registra o pedido no banco (Pagamento + Pedido + ItemPedido)
  GET  /pedidos/<cod_pedido>           -> confirmação com os dados do pedido registrado
"""

from datetime import datetime
from flask import jsonify
from sqlalchemy import func
from flask import Blueprint, request
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from models.produto import Produto
from models.loja import Loja
from models.usuario import Usuario
from models.pagamento import Pagamento
from models.pedido import Pedido
from models.item_pedido import ItemPedido
from models.produto_popularidade import ProdutoPopularidade
from models.avaliacao_produto import AvaliacaoProduto
from models.avaliacao_loja import AvaliacaoLoja
from models.loja_popularidade import LojaPopularidade


carrinho_bp = Blueprint("carrinho_bp", __name__)

@carrinho_bp.errorhandler(SQLAlchemyError)
def erro_banco(erro):
    """Qualquer erro do SQLAlchemy (conexão, query, etc.) cai aqui."""
    db.session.rollback()
    return {"error": f"erro ao acessar o banco de dados: {erro}"}, 500
def erro_pedido(erro):
    pedido = Pedido.query.filter_by(erro=erro).first()
    db.session.rollback()
    return {"error": f"comprador inexistente"}, 401


@carrinho_bp.route("/vizu_carrinho/<int:cod_comprador>", methods=["GET"])
def catalogo(cod_comprador):
    # Busca apenas os itens de pedidos com status 'Pendente' (simulando carrinho aberto)
    itens_carrinho = (
        ItemPedido.query
        .join(Pedido)
        .filter(Pedido.cod_comprador == cod_comprador, Pedido.status == "Pendente")
        .all()
    )
    
    '''erro = erro_pedido(cod_comprador)
    if erro:
        return erro'''
    
    # Transforma os objetos em JSON (já trazendo o produto acoplado por dentro)
    carrinho_json = [item.to_dict() for item in itens_carrinho]
    
    return jsonify(carrinho_json)


