import os
import uuid

from flask import Blueprint, current_app, request, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.loja import Loja
from models.produto import Produto
from models.usuario import Usuario

upload_bp = Blueprint("upload", __name__)

SUBPASTAS = ("produtos", "usuarios")

def salvar_foto(arquivo, subpasta):
    nome_original = arquivo.filename or ""
    ext = nome_original.rsplit(".", 1)[-1].lower() if "." in nome_original else ""
    if ext not in current_app.config["EXTENSOES_PERMITIDAS"]:
        return None

    nome = f"{uuid.uuid4().hex}.{ext}"
    pasta = os.path.join(current_app.config["UPLOAD_FOLDER"], subpasta)
    os.makedirs(pasta, exist_ok=True)
    arquivo.save(os.path.join(pasta, nome))
    return f"/uploads/{subpasta}/{nome}"

def remover_foto(foto_url):
    if not foto_url:
        return
    partes = foto_url.split("/")
    if len(partes) != 4 or partes[1] != "uploads" or partes[2] not in SUBPASTAS:
        return
    caminho = os.path.join(
        current_app.config["UPLOAD_FOLDER"], partes[2], os.path.basename(partes[3])
    )
    if os.path.isfile(caminho):
        os.remove(caminho)

def _arquivo_da_requisicao():
    arquivo = request.files.get("foto")
    if arquivo is None or arquivo.filename == "":
        return None
    return arquivo


@upload_bp.route("/loja/produtos/<int:cod_produto>/foto", methods=["POST"])
@jwt_required()
def foto_produto(cod_produto):
    loja = Loja.query.filter_by(cod_usuario=int(get_jwt_identity())).first()
    produto = db.get_or_404(Produto, cod_produto)

    if loja is None or produto.cod_loja != loja.cod_loja:
        return {"error": "produto não pertence a esta loja"}, 403

    arquivo = _arquivo_da_requisicao()
    if arquivo is None:
        return {"error": "envie o arquivo no campo 'foto'"}, 400

    caminho = salvar_foto(arquivo, "produtos")
    if caminho is None:
        return {"error": "formato inválido (use png, jpg, jpeg ou webp)"}, 400

    foto_antiga = produto.foto_url
    produto.foto_url = caminho
    db.session.commit()
    remover_foto(foto_antiga)

    return {"foto_url": caminho}, 200

@upload_bp.route("/perfil/foto", methods=["POST"])
@jwt_required()
def foto_perfil():
    usuario = db.get_or_404(Usuario, int(get_jwt_identity()))

    arquivo = _arquivo_da_requisicao()
    if arquivo is None:
        return {"error": "envie o arquivo no campo 'foto'"}, 400
    
    caminho = salvar_foto(arquivo, "produtos")
    if caminho is None:
        return {"error": "formato inválido (use png, jpg, jpeg ou webp)"}, 400
    
    foto_antiga = usuario.foto_url
    db.session.commit()
    remover_foto(foto_antiga)
    
    return {"foto_url": caminho}, 200

@upload_bp.route("/uploads/<subpasta>/<nome>", methods=["GET"])
def servir_foto(subpasta, nome):
    if subpasta not in SUBPASTAS:
        return {"error": "não encontrado"}, 404
    pasta = os.path.join(current_app.config["UPLOAD_FOLDER"], subpasta)
    return send_from_directory(pasta, nome)

@upload_bp.app_errorhandler(413)
def arquivo_grande_demais(_erro):
    return {"error": "arquivo muito grande (máximo 5 MB)"}, 413
    

