from datetime import datetime

from sqlalchemy import func

from app import app, db
from models.produto import Produto
from models.item_pedido import ItemPedido
from models.pedido import Pedido
from models.loja import Loja
from models.produto_popularidade import ProdutoPopularidade
from models.loja_popularidade import LojaPopularidade

with app.app_context():
    agora = datetime.now()

    # --- Popularidade de produto ---
    vendas_produto = (
        db.session.query(ItemPedido.cod_produto, func.sum(ItemPedido.quantidade))
        .join(Pedido, ItemPedido.cod_pedido == Pedido.cod_pedido)
        .filter(Pedido.status != "Cancelado")
        .group_by(ItemPedido.cod_produto)
        .all()
    )
    vendas_por_produto = {cod_produto: int(total) for cod_produto, total in vendas_produto}

    produtos = Produto.query.all()
    for produto in produtos:
        popularidade = ProdutoPopularidade.query.get(produto.cod_produto)
        if popularidade is None:
            popularidade = ProdutoPopularidade(cod_produto=produto.cod_produto)
            db.session.add(popularidade)
        popularidade.total_vendido = vendas_por_produto.get(produto.cod_produto, 0)
        popularidade.atualizado_em = agora

    # --- Popularidade de loja ---
    vendas_loja = (
        db.session.query(ItemPedido.quantidade, Pedido.cod_loja)
        .join(Pedido, ItemPedido.cod_pedido == Pedido.cod_pedido)
        .filter(Pedido.status != "Cancelado")
        .all()
    )
    vendas_por_loja = {}
    for quantidade, cod_loja in vendas_loja:
        vendas_por_loja[cod_loja] = vendas_por_loja.get(cod_loja, 0) + quantidade

    lojas = Loja.query.all()
    for loja in lojas:
        popularidade_loja = LojaPopularidade.query.get(loja.cod_loja)
        if popularidade_loja is None:
            popularidade_loja = LojaPopularidade(cod_loja=loja.cod_loja)
            db.session.add(popularidade_loja)
        popularidade_loja.total_vendido = vendas_por_loja.get(loja.cod_loja, 0)
        popularidade_loja.atualizado_em = agora

    db.session.commit()
    print(f"popularidade recalculada: {len(produtos)} produto(s), {len(lojas)} loja(s)")
