from extensions import db


class Entregador(db.Model):
    __tablename__ = "Entregador"

    cod_entregador = db.Column(db.Integer, primary_key=True)
    cpf = db.Column(db.CHAR(11), nullable=False)
    data_nasc = db.Column(db.Date)
    cnh = db.Column(db.String(20))
    cod_pagamento = db.Column(db.Integer, db.ForeignKey("Pagamento.cod_pagamento"), nullable=False)
    cod_usuario = db.Column(db.Integer, db.ForeignKey("Usuario.cod_usuario"), nullable=False)

    usuario = db.relationship("Usuario", back_populates="entregador")
    pagamento = db.relationship("Pagamento")
