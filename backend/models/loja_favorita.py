from extensions import db


class LojaFavorita(db.Model):
    __tablename__ = "LojaFavorita"
    __table_args__ = (
        db.UniqueConstraint("cod_comprador", "cod_loja", name="uq_loja_favorita_comprador_loja"),
    )

    cod_favorito = db.Column(db.Integer, primary_key=True)
    cod_loja = db.Column(db.Integer, db.ForeignKey("Loja.cod_loja"), nullable=False)
    cod_comprador = db.Column(db.Integer, db.ForeignKey("Comprador.cod_comprador"), nullable=False)

    loja = db.relationship("Loja")
    comprador = db.relationship("Comprador")