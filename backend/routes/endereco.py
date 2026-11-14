from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from permissoes import tipo_requerido
from models.endereco import Endereco
from models.comprador import Comprador
from models.comprador_endereco import Comprador_Endereco
from validacoes import ler_uf, ler_cep, texto_opcional

endereco_bp = Blueprint("endereco", __name__)


@endereco_bp.errorhandler(SQLAlchemyError)
def erro_banco(erro):
    db.session.rollback()
    return {"error": f"erro ao acessar o banco de dados: {erro}"}, 500


def _comprador_logado():
    return Comprador.query.filter_by(cod_usuario=get_jwt_identity()).first()


def _endereco_json(e):
    return {
        "cod_endereco": e.cod_endereco,
        "nome_logradouro": e.nome_logradouro,
        "numero": e.numero,
        "bairro": e.bairro,
        "cidade": e.cidade,
        "estado": e.estado,
        "cep": e.cep,
    }


@endereco_bp.route("/enderecos", methods=["GET"])
@tipo_requerido("Comprador")
def listar_enderecos():
    comprador = _comprador_logado()
    if comprador is None:
        return {"error": "comprador não encontrado"}, 404

    vinculos = Comprador_Endereco.query.filter_by(
        cod_comprador=comprador.cod_comprador
    ).all()

    return {"enderecos": [_endereco_json(v.endereco) for v in vinculos]}, 200


@endereco_bp.route("/enderecos", methods=["POST"])
@tipo_requerido("Comprador")
def criar_endereco():
    comprador = _comprador_logado()
    if comprador is None:
        return {"error": "comprador não encontrado"}, 404

    dados = request.get_json(silent=True) or {}

    logradouro = str(dados.get("nome_logradouro") or "").strip()
    if not logradouro or len(logradouro) > 100:
        return {"error": "logradouro é obrigatório (máximo 100 caracteres)"}, 400

    campos = {}
    for campo, limite in (("numero", 10), ("bairro", 50), ("cidade", 50)):
        valor, erro = texto_opcional(dados, campo, limite)
        if erro:
            return {"error": erro}, 400
        campos[campo] = valor

    estado, erro = ler_uf(dados.get("estado"))
    if erro:
        return {"error": erro}, 400

    cep, erro = ler_cep(dados.get("cep"))
    if erro:
        return {"error": erro}, 400

    endereco = Endereco(nome_logradouro=logradouro, estado=estado, cep=cep, **campos)
    db.session.add(endereco)
    db.session.flush()  # gera o cod_endereco sem fechar a transação

    db.session.add(Comprador_Endereco(
        cod_comprador=comprador.cod_comprador,
        cod_endereco=endereco.cod_endereco,
    ))
    db.session.commit()

    return _endereco_json(endereco), 201


@endereco_bp.route("/enderecos/<int:cod_endereco>", methods=["DELETE"])
@tipo_requerido("Comprador")
def remover_endereco(cod_endereco):
    comprador = _comprador_logado()
    if comprador is None:
        return {"error": "comprador não encontrado"}, 404

    vinculo = Comprador_Endereco.query.filter_by(
        cod_comprador=comprador.cod_comprador,
        cod_endereco=cod_endereco,
    ).first()
    if vinculo is None:
        return {"error": "endereço não encontrado"}, 404

    db.session.delete(vinculo)
    db.session.commit()

    return {"mensagem": "endereço removido"}, 200
