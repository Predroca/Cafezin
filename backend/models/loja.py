from extensions import db


class Loja(db.Model):
    __tablename__ = "Loja"

    cod_loja = db.Column(db.Integer, primary_key=True)
    cnpj = db.Column(db.CHAR(14), nullable=False)
    horario_funcionamento = db.Column(db.Time)
    cod_endereco = db.Column(db.Integer, db.ForeignKey("Endereco.cod_endereco"), nullable=False)
    cod_usuario = db.Column(db.Integer, db.ForeignKey("Usuario.cod_usuario"), nullable=False)

    endereco = db.relationship("Endereco")
    usuario = db.relationship("Usuario", back_populates="loja")
    produtos = db.relationship("Produto", back_populates="loja")
