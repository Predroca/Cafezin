from extensions import db


class Entrega(db.Model):
    __tablename__ = "Entrega"

    cod_entrega = db.Column(db.Integer, primary_key=True)
    distancia = db.Column(db.Numeric(10, 2))
    data_saida = db.Column(db.DateTime)
    data_entrega = db.Column(db.DateTime)
    status = db.Column(
        db.Enum("Aguardando", "Em rota", "Concluída", "Cancelada"),
        nullable=False,
        default="Aguardando",
    )
    cod_pedido = db.Column(db.Integer, db.ForeignKey("Pedido.cod_pedido"), nullable=False)
    cod_entregador = db.Column(db.Integer, db.ForeignKey("Entregador.cod_entregador"), nullable=False)

    pedido = db.relationship("Pedido")
    entregador = db.relationship("Entregador")
