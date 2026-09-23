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

    def to_dict(self):
        return {
            "cod_produto": self.cod_produto,
            "cod_loja": self.cod_loja,
            "nome": self.nome,
            "descricao": self.descricao,
            "preco": float(self.preco),
            "disponibilidade": self.disponibilidade,
            "cod_categoria": self.cod_categoria,
            "foto_url": self.foto_url
        }
