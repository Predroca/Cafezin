from extensions import db


class ItemPedido(db.Model):
    __tablename__ = "ItemPedido"

    cod_item = db.Column(db.Integer, primary_key=True)
    quantidade = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    cod_pedido = db.Column(db.Integer, db.ForeignKey("Pedido.cod_pedido"), nullable=False)
    cod_produto = db.Column(db.Integer, db.ForeignKey("Produto.cod_produto"), nullable=False)

    pedido = db.relationship("Pedido", back_populates="itens")
    produto = db.relationship("Produto")
