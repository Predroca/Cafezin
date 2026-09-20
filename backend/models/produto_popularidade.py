from extensions import db


class ProdutoPopularidade(db.Model):
    __tablename__ = "ProdutoPopularidade"

    cod_produto = db.Column(db.Integer, db.ForeignKey("Produto.cod_produto"), primary_key=True)
    total_vendido = db.Column(db.Integer, nullable=False, default=0)
    atualizado_em = db.Column(db.DateTime, nullable=False)

    produto = db.relationship("Produto")