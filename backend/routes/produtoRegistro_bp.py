from flask import Flask , request , Blueprint
from flask_cors import CORS
from sqlalchemy.exc import SQLAlchemyError
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db, jwt
from models.produto import Produto 
from models.loja import Loja
from config import Config


produtoRegistro_bp = Blueprint("produtoRegistro_bp" , __name__)


@produtoRegistro_bp.errorhandler(SQLAlchemyError)
def _erro_nomeExist(nome):
    produto = Produto.query.filter_by(nome=nome).first()
    if produto != None:
            return ({"error" : "já existe um produto com o nome informado (tenha mais criatividade)"})
    
def _erro_lojaInexistente(cod_loja):
     loja = Loja.query.filter_by(cod_loja=cod_loja).first()
     

     if loja is None:
          return ({"error" : "não exite nenhuma loja com o codigo informado (melhore)"})
     
#/<string:nome>/<int:cod_loja>
@produtoRegistro_bp.route("/registrar_produto/<int:cod_loja>/<string:nome>", methods=["POST"])
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
    
@produtoRegistro_bp.route("/deletar_produto/<int:cod_produto>", methods=["DELETE"])
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



@produtoRegistro_bp.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    produtoRegistro_bp.run(debug=True, port=5000)