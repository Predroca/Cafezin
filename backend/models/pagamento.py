from extensions import db


class Pagamento(db.Model):
    __tablename__ = "Pagamento"

    cod_pagamento = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(
        db.Enum("PIX", "Boleto", "Cartão", "Dinheiro", "Transferência"), nullable=False
    )
    data = db.Column(db.DateTime)
