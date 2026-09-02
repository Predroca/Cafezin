from extensions import db


class Produto(db.Model):
    __tablename__ = "Produto"

    cod_produto = db.Column(db.Integer, primary_key=True)
    cod_loja = db.Column(db.Integer, db.ForeignKey("Loja.cod_loja"), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)
    preco = db.Column(db.Numeric(10, 2), nullable=False)
    disponibilidade = db.Column(db.Boolean)
    cod_categoria = db.Column(db.Integer, db.ForeignKey("Categoria.cod_categoria"))
    foto_url = db.Column(db.String(255))

    loja = db.relationship("Loja", back_populates="produtos")
    categoria = db.relationship("Categoria", back_populates="produtos")
    avaliacoes = db.relationship("AvaliacaoProduto", back_populates="produto")
