from extensions import db


class Pedido(db.Model):
    __tablename__ = "Pedido"

    cod_pedido = db.Column(db.Integer, primary_key=True)
    data_pedido = db.Column(db.DateTime, nullable=False)
    valor_frete = db.Column(db.Numeric(10, 2))
    valor_total = db.Column(db.Numeric(10, 2))
    status = db.Column(
        db.Enum("Pendente", "Em preparo", "Em andamento", "Entregue", "Cancelado"),
        nullable=False,
        default="Pendente",
    )
    cod_comprador = db.Column(db.Integer, db.ForeignKey("Comprador.cod_comprador"), nullable=False)
    cod_loja = db.Column(db.Integer, db.ForeignKey("Loja.cod_loja"), nullable=False)
    cod_end_entrega = db.Column(db.Integer, db.ForeignKey("Endereco.cod_endereco"), nullable=False)
    cod_pagamento = db.Column(db.Integer, db.ForeignKey("Pagamento.cod_pagamento"), nullable=False)

    comprador = db.relationship("Comprador", back_populates="pedidos")
    loja = db.relationship("Loja")
    endereco_entrega = db.relationship("Endereco")
    pagamento = db.relationship("Pagamento")
    itens = db.relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan")
