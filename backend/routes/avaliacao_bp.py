from datetime import datetime

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from models.pedido import Pedido
from models.comprador import Comprador
from models.avaliacao_produto import AvaliacaoProduto
from models.avaliacao_loja import AvaliacaoLoja
from models.avaliacao_entregador import AvaliacaoEntregador

avaliacao_bp = Blueprint("avaliacao", __name__)

@avaliacao_bp.errorhandler(SQLAlchemyError)
def erro_banco(erro):
    db.session.rollback()
    return {"error": f"erro ao acessar o banco de dados: {erro}"}, 500

def _validar_pedido_do_comprador(cod_pedido):
    cod_usuario = get_jwt_identity()
    comprador = Comprador.query.filter_by(cod_usuario=cod_usuario).first()

    if comprador is None:
        return None, ({"error": "comprador não encontrado"}, 404)

    pedido = Pedido.query.get(cod_pedido)
    if pedido is None:
        return None, ({"error": "pedido não encontrado"}, 404)

    if pedido.cod_comprador != comprador.cod_comprador:
        return None, ({"error": "este pedido não pertence ao usuário logado"}, 403)

    if pedido.status != "Entregue":
        return None, ({"error": "só é possível avaliar pedidos entregues"}, 409)

    return pedido, None

def _validar_nota(dados):
    nota = dados.get("nota")
    if nota is None or not isinstance(nota, int) or not (1 <= nota <= 5):
        return None, ({"error": "nota deve ser um inteiro entre 1 e 5"}, 400)
    return nota, None


@avaliacao_bp.route('/pedidos/<int:cod_pedido>/avaliar/produto', methods=['POST'])
@jwt_required()
def avaliar_prod(cod_pedido):
    dados = request.get_json()

    pedido, erro = _validar_pedido_do_comprador(cod_pedido)
    if erro:
        return erro

    nota, erro = _validar_nota(dados)
    if erro:
        return erro

    cod_produto = dados.get("cod_produto")
    produtos_do_pedido = {item.cod_produto for item in pedido.itens}
    if cod_produto not in produtos_do_pedido:
        return {"error": "esse produto não faz parte deste pedido"}, 400

    avaliacao = AvaliacaoProduto(
        data=datetime.now().date(),
        horario=datetime.now().time(),
        descricao=dados.get("descricao"),
        nota=nota,
        cod_produto=cod_produto,
        cod_comprador=pedido.cod_comprador,
    )

    db.session.add(avaliacao)
    db.session.commit()

    return {"message": "avaliação de produto registrada"}, 201

@avaliacao_bp.route("/pedidos/<int:cod_pedido>/avaliar/loja", methods=["POST"])
@jwt_required()
def avaliar_loja(cod_pedido):
    dados = request.get_json()

    pedido, erro = _validar_pedido_do_comprador(cod_pedido)
    if erro:
        return erro

    nota, erro = _validar_nota(dados)
    if erro:
        return erro

    avaliacao = AvaliacaoLoja(
        data=datetime.now().date(),
        horario=datetime.now().time(),
        descricao=dados.get("descricao"),
        nota=nota,
        cod_pedido=cod_pedido,
    )
    db.session.add(avaliacao)
    db.session.commit()

    return {"message": "avaliação de loja registrada"}, 201

@avaliacao_bp.route("/pedidos/<int:cod_pedido>/avaliar/entregador", methods=["POST"])
@jwt_required()
def avaliar_entregador(cod_pedido):
    dados = request.get_json()

    pedido, erro = _validar_pedido_do_comprador(cod_pedido)
    if erro:
        return erro

    if not pedido.entrega:
        return {"error": "este pedido ainda não possui uma entrega registrada"}, 409

    nota, erro = _validar_nota(dados)
    if erro:
        return erro

    avaliacao = AvaliacaoEntregador(
        data=datetime.now().date(),
        horario=datetime.now().time(),
        descricao=dados.get("descricao"),
        nota=nota,
        cod_pedido=cod_pedido,
    )
    db.session.add(avaliacao)
    db.session.commit()

    return {"message": "avaliação de entregador registrada"}, 201
