
from datetime import datetime

from flask import Blueprint, request
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from models.produto import Produto
from models.categoria import Categoria
from models.loja import Loja
from models.usuario import Usuario
from models.comprador_endereco import Comprador_Endereco
from models.comprador import Comprador
from models.pagamento import Pagamento
from models.pedido import Pedido
from models.item_pedido import ItemPedido

enderecoRegister_bp = Blueprint("catalogo", __name__)

VALOR_FRETE_PADRAO = 5.00
FORMAS_PAGAMENTO = ["PIX", "Boleto", "Cartão", "Dinheiro", "Transferência"]



@enderecoRegister_bp.route("/pedidos", methods=["POST"])
def criar_pedido():
    dados = request.get_json()

    cod_produto = dados.get("cod_produto")
    cod_comprador = dados.get("cod_comprador")
    cod_endereco = dados.get("cod_endereco")
    forma_pagamento = dados.get("forma_pagamento")
    quantidade = max(1, int(dados.get("quantidade", 1)))

    if forma_pagamento not in FORMAS_PAGAMENTO:
        return {"error": "forma de pagamento inválida"}, 400

    produto = Produto.query.get_or_404(cod_produto)

    if not produto.disponibilidade:
        return {"error": "produto indisponível no momento"}, 409

    valor_total = round(float(produto.preco) * quantidade + VALOR_FRETE_PADRAO, 2)
    agora = datetime.now()

    # cria o Pagamento e usa flush() para já ter o cod_pagamento gerado,
    # sem precisar de um commit isolado por tabela
    pagamento = Pagamento(tipo=forma_pagamento, data=agora)
    db.session.add(pagamento)
    db.session.flush()

    pedido = Pedido(
        data_pedido=agora,
        valor_frete=VALOR_FRETE_PADRAO,
        valor_total=valor_total,
        status="Confirmado",
        cod_comprador=cod_comprador,
        cod_loja=produto.cod_loja,
        cod_end_entrega=cod_endereco,
        cod_pagamento=pagamento.cod_pagamento,
    )
    db.session.add(pedido)
    db.session.flush()

    item = ItemPedido(
        quantidade=quantidade,
        preco_unitario=produto.preco,
        cod_pedido=pedido.cod_pedido,
        cod_produto=cod_produto,
    )
    db.session.add(item)

    db.session.commit()

    return {"message": "pedido criado", "cod_pedido": pedido.cod_pedido}, 201
