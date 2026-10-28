from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from extensions import db
from permissoes import tipo_requerido
from models import Comprador, Loja, LojaFavorita, Usuario

comprador_bp = Blueprint("comprador", __name__)

def comprador_do_usuario_logado():
    return Comprador.query.filter_by(cod_usuario=get_jwt_identity()).first()



@comprador_bp.route("/favoritas", methods=["GET"])
@tipo_requerido("Comprador")
def listar_lojas_favoritas():
    comprador = comprador_do_usuario_logado()
    if not comprador:
        return jsonify({"erro": "Comprador não encontrado"}), 404

    linhas = (
        db.session.query(Loja, Usuario)
        .join(LojaFavorita, LojaFavorita.cod_loja == Loja.cod_loja)
        .join(Usuario, Usuario.cod_usuario == Loja.cod_usuario)
        .filter(LojaFavorita.cod_comprador == comprador.cod_comprador)
        .all()
    )

    return jsonify([
        {
            "cod_loja": loja.cod_loja,
            "nome": usuario.nome,
            "foto_url": usuario.foto_url,
            "horario_abertura": loja.horario_abertura.strftime("%H:%M") if loja.horario_abertura else None,
            "horario_fecha": loja.horario_fecha.strftime("%H:%M") if loja.horario_fecha else None,
        }
        for loja, usuario in linhas
    ]), 200

@comprador_bp.route("/favoritas/<int:cod_loja>", methods=["POST"])
@tipo_requerido("Comprador")
def favoritar_loja(cod_loja):
    comprador = comprador_do_usuario_logado()
    if comprador is None:
        return {"error": "voce nem existe"}, 404

    if db.session.get(Loja, cod_loja) is None:
        return {"error": "loja não encontrada, tenta ota vez"}, 404

    ja_favoritou = LojaFavorita.query.filter_by(
        cod_comprador=comprador.cod_comprador,
        cod_loja=cod_loja,
    ).first()
    if ja_favoritou:
        return {"error": "voce ja gosta dessa loja"}, 409

    favorito = LojaFavorita(cod_comprador=comprador.cod_comprador, cod_loja=cod_loja)
    db.session.add(favorito)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "esta loja já está nos seus favoritos"}, 409
    except SQLAlchemyError as erro:
        db.session.rollback()
        return {"error": f"erro ao acessar o banco de dados: {erro}"}, 500

    return {"mensagem": "loja favoritada", "cod_favorito": favorito.cod_favorito}, 201

@comprador_bp.route("/favoritas/<int:cod_loja>", methods=["DELETE"])
@tipo_requerido("Comprador")
def desfavoritar_loja(cod_loja):
    comprador = comprador_do_usuario_logado()
    if comprador is None:
        return {"error": "voce não existe"}, 404

    favorito = LojaFavorita.query.filter_by(
        cod_comprador=comprador.cod_comprador,
        cod_loja=cod_loja,
    ).first()
    if favorito is None:
        return {"error": "voce nem gosta dessa loja"}, 404

    db.session.delete(favorito)

    try:
        db.session.commit()
    except SQLAlchemyError as erro:
        db.session.rollback()
        return {"error": f"erro ao acessar o banco de dados: {erro}"}, 500

    return {"mensagem": "loja removida dos favoritos"}, 200
