from extensions import db


class LojaPopularidade(db.Model):
    __tablename__ = "LojaPopularidade"

    cod_loja = db.Column(db.Integer, db.ForeignKey("Loja.cod_loja"), primary_key=True)
    total_vendido = db.Column(db.Integer, nullable=False, default=0)
    atualizado_em = db.Column(db.DateTime, nullable=False)
