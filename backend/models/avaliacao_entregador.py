from extensions import db


class AvaliacaoEntregador(db.Model):
    __tablename__ = "AvaliacaoEntregador"

    cod_avaliacao_entregador = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.Date)
    descricao = db.Column(db.Text)
    nota = db.Column(db.Integer)
    horario = db.Column(db.Time)
    cod_pedido = db.Column(db.Integer, db.ForeignKey("Pedido.cod_pedido"), nullable=False)

    pedido = db.relationship("Pedido")
