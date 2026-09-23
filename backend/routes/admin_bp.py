from datetime import date

from sqlalchemy import func
from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models.usuario import Usuario
from models.pedido import Pedido
from models.loja import Loja

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/admin/dashboard", methods=["GET"])
def informacoes():

    hoje = date.today()

    pedidos_hoje_query = Pedido.query.filter(
        Pedido.status != "Cancelado",
        func.date(Pedido.data_pedido) == hoje,
    )

    total_pedidos_hoje = pedidos_hoje_query.count()
    faturado_hoje = pedidos_hoje_query.with_entities(func.sum(Pedido.valor_total)).scalar() or 0

    total_compradores = Usuario.query.filter_by(tipo_usuario="Comprador").count()

    total_lojas = Usuario.query.filter_by(tipo_usuario="Comprador").count()

    return {
        "pedidos_hoje": total_pedidos_hoje,
        "faturado_hoje": float(faturado_hoje),
        "compradores_cadastrados": total_compradores,
        "lojas_cadastradas" : total_lojas
    }