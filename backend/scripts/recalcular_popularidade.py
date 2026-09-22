from datetime import datetime

from sqlalchemy import func

from app import app, db
from models.produto import Produto
from models.item_pedido import ItemPedido
from models.pedido import Pedido
from models.produto_popularidade import ProdutoPopularidade

with app.app_context():
    vendas = (
        db.session.query(ItemPedido.cod_produto, func.sum(ItemPedido.quantidade))
        .join(Pedido, ItemPedido.cod_pedido == Pedido.cod_pedido)
        .filter(Pedido.status != "Cancelado")
        .group_by(ItemPedido.cod_produto)
        .all()
    )
    vendas_por_produto = {cod_produto: int(total) for cod_produto, total in vendas}

    agora = datetime.now()
    produtos = Produto.query.all()

    for produto in produtos:
        popularidade = ProdutoPopularidade.query.get(produto.cod_produto)
        if popularidade is None:
            popularidade = ProdutoPopularidade(cod_produto=produto.cod_produto)
            db.session.add(popularidade)

        popularidade.total_vendido = vendas_por_produto.get(produto.cod_produto, 0)
        popularidade.atualizado_em = agora

    db.session.commit()
    print(f"popularidade recalculada para {len(produtos)} produto(s)")
