from extensions import db


class Endereco(db.Model):
    __tablename__ = "Endereco"

    cod_endereco = db.Column(db.Integer, primary_key=True)
    nome_logradouro = db.Column(db.String(100), nullable=False)
    numero = db.Column(db.String(10))
    bairro = db.Column(db.String(50))
    cidade = db.Column(db.String(50))
    estado = db.Column(db.CHAR(2))
    cep = db.Column(db.CHAR(8))
