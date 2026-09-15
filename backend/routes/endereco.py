from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint, request
from sqlalchemy.exc import SQLAlchemyError

from models.endereco import Endereco
from models.comprador import Comprador
from models.comprador_endereco import Comprador_Endereco

from extensions import db


endereco_bp = Blueprint("endereco", __name__)

@endereco_bp.route("/registrar_endereco", methods=["POST"])
def registrar_endereco():
    try:
        dados = request.get_json()
        
        nome_logradouro = dados.get("nome_logradouro")
        bairro = dados.get("bairro")
        numero = dados.get("numero")
        cidade = dados.get("cidade")
        estado = dados.get("estado")
        cep = dados.get("cep")

        end = Endereco(
            nome_logradouro=nome_logradouro,
            bairro=bairro,
            numero=numero,
            cidade=cidade,
            estado=estado,
            cep=cep
        )
        db.session.add(end)

        db.session.commit()

        return {"message": "endereço criado", "cod_endereco": end.cod_endereco}, 201
    
    except SQLAlchemyError as e:
            db.session.rollback()
            return {"message": "Erro ao criar endereço", "error": str(e)}, 500
    

    
    
@endereco_bp.route("/enderecos", methods=["GET"])
@jwt_required()
def listar_enderecos():
    cod_usuario = get_jwt_identity()

    comprador = Comprador.query.filter_by(cod_usuario=cod_usuario).first()
    if comprador is None:
        return {"error": "comprador não encontrado"}, 404

    vinculos = Comprador_Endereco.query.filter_by(cod_comprador=comprador.cod_comprador).all()

    return {
        "enderecos": [
            {
                "cod_endereco": v.endereco.cod_endereco,
                "logradouro": v.endereco.nome_logradouro,
                "numero": v.endereco.numero,
                "bairro": v.endereco.bairro,
                "cidade": v.endereco.cidade,
                "estado": v.endereco.estado,
                "cep": v.endereco.cep,
            }
            for v in vinculos
        ]
    }
