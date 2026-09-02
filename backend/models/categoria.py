from extensions import db


class Categoria(db.Model):
    __tablename__ = "Categoria"

    cod_categoria = db.Column(db.Integer, primary_key=True)
    nome_categoria = db.Column(db.String(255))

    produtos = db.relationship("Produto", back_populates="categoria")
