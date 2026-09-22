from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import date
from sqlalchemy import func

from models.produto import Produto
from models.loja import Loja
from models.pedido import Pedido
from models.avaliacao_loja import AvaliacaoLoja


loja_bp = Blueprint("loja", __name__)

@loja_bp.errorhandler(SQLAlchemyError)
def _erro_nomeExist(nome):
    produto = Produto.query.filter_by(nome=nome).first()
    if produto != None:
            return ({"error" : "já existe um produto com o nome informado (tenha mais criatividade)"})
    
def _erro_lojaInexistente(cod_loja):
     loja = Loja.query.filter_by(cod_loja=cod_loja).first()
    
     if loja is None:
          return ({"error" : "não exite nenhuma loja com o codigo informado (melhore)"})

def loja_do_usuario_logado():
    cod_usuario = get_jwt_identity()
    loja = Loja.query.filter_by(cod_usuario=cod_usuario).first()
    return loja

@loja_bp.route("/loja/produtos", methods=["GET"])
@jwt_required()
def meus_produtos():
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404

    cod_categoria = request.args.get("categoria", type=int)
    apenas_indisponiveis = request.args.get("indisponiveis", type=bool)

    query = Produto.query.filter_by(cod_loja=loja.cod_loja)

    if cod_categoria:
        query = query.filter(Produto.cod_categoria == cod_categoria)
    if apenas_indisponiveis:
        query = query.filter(Produto.disponibilidade.is_(False))

    produtos = query.order_by(Produto.nome).all()

    return {
        "produtos": [
            {
                "cod_produto": p.cod_produto,
                "nome": p.nome,
                "descricao": p.descricao,
                "preco": float(p.preco),
                "disponibilidade": p.disponibilidade,
                "cod_categoria": p.cod_categoria,
                "foto_url": p.foto_url,
            }
            for p in produtos
        ]
    }

@loja_bp.route("/loja/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404

    hoje = date.today()

    pedidos_hoje_query = Pedido.query.filter(
        Pedido.cod_loja == loja.cod_loja,
        Pedido.status != 'Cancelado',
        func.date(Pedido.data_pedido) == hoje,
    )

    total_pedidos_hoje = pedidos_hoje_query.count()
    faturado_hoje = pedidos_hoje_query.with_entities(func.sum(Pedido.valor_total)).scalar() or 0

    produtos_ativos = Produto.query.filter_by(
        cod_loja=loja.cod_loja, disponibilidade=True
    ).count()

    media_avaliacao = (
        db.session.query(func.avg(AvaliacaoLoja.nota))
        .join(Pedido, AvaliacaoLoja.cod_pedido == Pedido.cod_pedido)
        .filter(Pedido.cod_loja == loja.cod_loja)
        .scalar()
    )

    return {
        "pedidos_hoje": total_pedidos_hoje,
        "faturado_hoje": float(faturado_hoje),
        "produtos_ativos": produtos_ativos,
        "avaliacao_media": round(float(media_avaliacao), 1) if media_avaliacao else None,
    }

     
#/<string:nome>/<int:cod_loja>
@loja_bp.route("/registrar_produto/<int:cod_loja>/<string:nome>", methods=["POST"])
@jwt_required()
def registrar_endereco(nome , cod_loja):
        
        dados = request.get_json()

        erro = _erro_nomeExist(nome)
        if erro:
            return erro

        erro2 = _erro_lojaInexistente(cod_loja)
        if erro2:
            return erro2

        cod_loja = dados.get("cod_loja")
        nome = dados.get("nome")
        descricao = dados.get("descricao")
        preco = dados.get("preco")
        disponibilidade = dados.get("disponibilidade")
        cod_categoria = dados.get("cod_categoria")
        foto_url = dados.get("foto_url")
        


        end = Produto(
            cod_loja = cod_loja,
            nome = nome,
            descricao = descricao,
            preco = preco,
            disponibilidade = disponibilidade,
            cod_categoria = cod_categoria,
            foto_url = foto_url
        )

        db.session.add(end)
        db.session.commit()

        return {"message": "produto criado", "cod_produto": end.cod_produto}, 201
    
@loja_bp.route("/deletar_produto/<int:cod_produto>", methods=["DELETE"]) #não usem essa rota a não ser em ultimo caso , pode deletar metade do banco de dados
def deletar_produto(cod_produto):

    product = Produto.query.filter_by(cod_produto = cod_produto).first()

    if product != None:
        # Marcar o produto para exclusão
        db.session.delete(product)
        # Salvar as alterações no banco de dados
        db.session.commit()
        return{"message" : "Ja era KK , cabo com o banco de dados."}
    else:
        return{"message" : "Produto não encontrado."}

