from extensions import db


class Usuario(db.Model):
    __tablename__ = "Usuario"

    cod_usuario = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    tipo_usuario = db.Column(
        db.Enum("Admin", "Comprador", "Loja", "Entregador"), nullable=False
    )
    telefone = db.Column(db.String(20))
    foto_url = db.Column(db.String(255))

    comprador = db.relationship("Comprador", back_populates="usuario", uselist=False)
    entregador = db.relationship("Entregador", back_populates="usuario", uselist=False)
    loja = db.relationship("Loja", back_populates="usuario", uselist=False)
