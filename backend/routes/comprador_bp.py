import re
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import joinedload
from datetime import date, time

from extensions import db
from permissoes import tipo_requerido
from models import Comprador, Loja, LojaFavorita, Usuario, Comprador_Endereco, Pedido
from models import ItemPedido 

comprador_bp = Blueprint("comprador", __name__)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")

def comprador_do_usuario_logado():
    return Comprador.query.filter_by(cod_usuario=get_jwt_identity()).first()


def _perfil_json(comprador):
    usuario = comprador.usuario
    return {
        "nome": usuario.nome,
        "email": usuario.email,
        "telefone": usuario.telefone,
        "data_nasc": comprador.data_nasc.isoformat() if comprador.data_nasc else None,
        "foto_url": usuario.foto_url,
        "resumo": {
            "pedidos": Pedido.query.filter_by(cod_comprador=comprador.cod_comprador).count(),
            "favoritas": LojaFavorita.query.filter_by(cod_comprador=comprador.cod_comprador).count(),
            "enderecos": Comprador_Endereco.query.filter_by(cod_comprador=comprador.cod_comprador).count(),
        },
    }


@comprador_bp.route("/comprador/perfil", methods=["GET"])
@tipo_requerido("Comprador")
def ver_perfil():
    comprador = comprador_do_usuario_logado()
    if comprador is None:
        return {"error": "comprador não encontrado"}, 404
    return _perfil_json(comprador), 200

comprador_bp.route("/comprador/perfil", methods=["PATCH"])
@tipo_requerido("Comprador")
def editar_perfil():
    comprador = comprador_do_usuario_logado()
    if comprador is None:
        return {"error": "comprador não encontrado"}, 404
 
    dados = request.get_json(silent=True) or {}
    usuario = comprador.usuario
 
    # só atualiza o que veio no corpo; cpf e senha não passam por aqui
    if "nome" in dados:
        nome = (dados["nome"] or "").strip()
        if len(nome) < 3 or len(nome) > 100:
            return {"error": "nome deve ter entre 3 e 100 caracteres"}, 400
        usuario.nome = nome
 
    if "email" in dados:
        email = (dados["email"] or "").strip()
        if len(email) > 100 or not EMAIL_RE.match(email):
            return {"error": "e-mail inválido"}, 400
        em_uso = Usuario.query.filter(
            Usuario.email == email, Usuario.cod_usuario != usuario.cod_usuario
        ).first()
        if em_uso:
            return {"error": "e-mail já cadastrado"}, 409
        usuario.email = email
 
    if "telefone" in dados:
        telefone = (dados["telefone"] or "").strip()
        if telefone and len(re.sub(r"\D", "", telefone)) not in (10, 11):
            return {"error": "telefone deve ter DDD e 8 ou 9 dígitos"}, 400
        usuario.telefone = telefone or None
 
    if "data_nasc" in dados:
        bruto = dados["data_nasc"]
        if bruto:
            try:
                nascimento = date.fromisoformat(bruto)
            except (TypeError, ValueError):
                return {"error": "data_nasc deve estar no formato AAAA-MM-DD"}, 400
            if nascimento > date.today():
                return {"error": "data de nascimento no futuro"}, 400
            comprador.data_nasc = nascimento
        else:
            comprador.data_nasc = None
 
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "e-mail já cadastrado"}, 409
    except SQLAlchemyError as erro:
        db.session.rollback()
        return {"error": f"erro ao acessar o banco de dados: {erro}"}, 500
 
    return _perfil_json(comprador), 200



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

STATUS_TELA = {
    "Pendente": "Preparando",
    "Em preparo": "Preparando",
    "Em andamento": "A caminho",
    "Entregue": "Entregue",
    "Cancelado": "Cancelado",
}


comprador_bp.route("/comprador/pedidos", methods=["GET"])
@tipo_requerido("Comprador")
def listar_meus_pedidos():
    comprador = comprador_do_usuario_logado()
    if comprador is None:
        return {"error": "comprador não encontrado"}, 404
 
    query = (
        Pedido.query.filter_by(cod_comprador=comprador.cod_comprador)
        .options(
            joinedload(Pedido.loja).joinedload(Loja.usuario),
            joinedload(Pedido.itens).joinedload(ItemPedido.produto),
        )
    )
 
    status_filtro = request.args.getlist("status")
    if status_filtro:
        query = query.filter(Pedido.status.in_(status_filtro))
 
    pedidos = query.order_by(Pedido.data_pedido.desc()).all()
 
    return {
        "pedidos": [
            {
                "cod_pedido": p.cod_pedido,
                "cod_loja": p.cod_loja,
                "loja": p.loja.usuario.nome,
                "data_pedido": p.data_pedido.isoformat(),
                "valor_total": float(p.valor_total or 0),
                "status": p.status,
                "status_tela": STATUS_TELA[p.status],
                "itens": [
                    {
                        "cod_produto": i.cod_produto,
                        "produto": i.produto.nome,
                        "quantidade": i.quantidade,
                        "preco_unitario": float(i.preco_unitario),
                    }
                    for i in p.itens
                ],
            }
            for p in pedidos
        ]
    }, 200

