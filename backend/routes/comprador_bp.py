from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

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