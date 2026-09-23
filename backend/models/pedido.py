from extensions import db

class Pedido(db.Model):
    __tablename__ = "Pedido"

    cod_pedido = db.Column(db.Integer, primary_key=True)
    data_pedido = db.Column(db.DateTime, nullable=False)
    valor_frete = db.Column(db.Numeric(10, 2))
    valor_total = db.Column(db.Numeric(10, 2))
    status = db.Column(
        db.Enum("Pendente", "Em preparo", "Em andamento", "Entregue", "Cancelado"),
        nullable=False,
        default="Pendente",
    )
    cod_comprador = db.Column(db.Integer, db.ForeignKey("Comprador.cod_comprador"), nullable=False)
    cod_loja = db.Column(db.Integer, db.ForeignKey("Loja.cod_loja"), nullable=False)
    cod_end_entrega = db.Column(db.Integer, db.ForeignKey("Endereco.cod_endereco"), nullable=False)
    cod_pagamento = db.Column(db.Integer, db.ForeignKey("Pagamento.cod_pagamento"), nullable=False)

    comprador = db.relationship("Comprador", back_populates="pedidos")
    loja = db.relationship("Loja")
    endereco_entrega = db.relationship("Endereco")
    pagamento = db.relationship("Pagamento")
    itens = db.relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan")

    # ADICIONE ESTE MÉTODO:
    def to_dict(self):
        return {
            "cod_pedido": self.cod_pedido,
            # Converte a data para string no formato ISO (ex: "2026-03-23T14:00:00")
            "data_pedido": self.data_pedido.isoformat() if self.data_pedido else None,
            # Trata os valores decimais (Numeric) para float para não quebrar o JSON
            "valor_frete": float(self.valor_frete) if self.valor_frete else 0.0,
            "valor_total": float(self.valor_total) if self.valor_total else 0.0,
            "status": self.status,
            "cod_comprador": self.cod_comprador,
            "cod_loja": self.cod_loja,
            "cod_end_entrega": self.cod_end_entrega,
            "cod_pagamento": self.cod_pagamento,
            
            # Puxa automaticamente a lista de itens deste pedido com os produtos inclusos!
            "itens": [item.to_dict() for item in self.itens] if self.itens else []
        }
