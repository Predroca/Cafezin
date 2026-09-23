from extensions import db


class ItemPedido(db.Model):
    __tablename__ = "ItemPedido"

    cod_item = db.Column(db.Integer, primary_key=True)
    quantidade = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    cod_pedido = db.Column(db.Integer, db.ForeignKey("Pedido.cod_pedido"), nullable=False)
    cod_produto = db.Column(db.Integer, db.ForeignKey("Produto.cod_produto"), nullable=False)

    pedido = db.relationship("Pedido", back_populates="itens")
    produto = db.relationship("Produto")

    def to_dict(self):
        preco_un = float(self.preco_unitario)
        subtotal = self.quantidade * preco_un
        
        return {
            "cod_item": self.cod_item,
            "quantidade": self.quantidade,
            "preco_unitario": preco_un,
            "subtotal": round(subtotal, 2), # Calcula o total deste produto no carrinho
            "cod_pedido": self.cod_pedido,
            
            # Puxa automaticamente os dados da classe Produto se o relacionamento existir
            "produto": self.produto.to_dict() if self.produto else None
        }from extensions import db


class ItemPedido(db.Model):
    __tablename__ = "ItemPedido"

    cod_item = db.Column(db.Integer, primary_key=True)
    quantidade = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    cod_pedido = db.Column(db.Integer, db.ForeignKey("Pedido.cod_pedido"), nullable=False)
    cod_produto = db.Column(db.Integer, db.ForeignKey("Produto.cod_produto"), nullable=False)

    pedido = db.relationship("Pedido", back_populates="itens")
    produto = db.relationship("Produto")
