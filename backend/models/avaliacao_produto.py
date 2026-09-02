from extensions import db


class AvaliacaoProduto(db.Model):
    __tablename__ = "AvaliacaoProduto"

    cod_avaliacao_produto = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.Date)
    descricao = db.Column(db.Text)
    nota = db.Column(db.Integer)
    horario = db.Column(db.Time)
    cod_produto = db.Column(db.Integer, db.ForeignKey("Produto.cod_produto"), nullable=False)
    cod_comprador = db.Column(db.Integer, db.ForeignKey("Comprador.cod_comprador"), nullable=False)

    produto = db.relationship("Produto", back_populates="avaliacoes")
    comprador = db.relationship("Comprador", back_populates="avaliacoes_produto")
