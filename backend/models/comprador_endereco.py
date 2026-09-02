from extensions import db


class Comprador_Endereco(db.Model):
    __tablename__ = "Comprador_Endereco"

    cod_comp_end = db.Column(db.Integer, primary_key=True)
    cod_comprador = db.Column(db.Integer, db.ForeignKey("Comprador.cod_comprador"), nullable=False)
    cod_endereco = db.Column(db.Integer, db.ForeignKey("Endereco.cod_endereco"), nullable=False)

    comprador = db.relationship("Comprador", back_populates="enderecos")
    endereco = db.relationship("Endereco")
