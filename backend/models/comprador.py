from extensions import db


class Comprador(db.Model):
    __tablename__ = "Comprador"

    cod_comprador = db.Column(db.Integer, primary_key=True)
    cpf = db.Column(db.CHAR(11), nullable=False)
    data_nasc = db.Column(db.Date)
    sexo = db.Column(db.CHAR(1))
    cod_usuario = db.Column(db.Integer, db.ForeignKey("Usuario.cod_usuario"), nullable=False)

    usuario = db.relationship("Usuario", back_populates="comprador")
    enderecos = db.relationship("Comprador_Endereco", back_populates="comprador")
    pedidos = db.relationship("Pedido", back_populates="comprador")
    avaliacoes_produto = db.relationship("AvaliacaoProduto", back_populates="comprador")
