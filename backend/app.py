from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:@localhost:3306/Cafezin"

CORS(app)

db = SQLAlchemy(app)

class Usuario (db.Model):
    __tablename__= "Usuario"

    cod_usuario = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    tipo_usuario = db.Column(db.String(30), nullable=False)
    telefone = db.Column(db.String(20))


@app.route ('/inicio')
def inicio():
    return{"Status": "ok"}

@app.route('/register', methods=['POST'])
def registrar():
    dados = request.get_json()

    existe = Usuario.query.filter_by(email=dados['email']).first()
    if existe is not None:
        return {"error" : "email já cadastrado"}, 409
    
    senha_hash = generate_password_hash(dados["senha"])

    novo_usuario = Usuario(
        email = dados['email'],
        senha = senha_hash,
        nome = dados["nome"],
        tipo_usuario = dados["tipo_usuario"],
        telefone = dados.get("telefone")
    )

    db.session.add(novo_usuario)
    db.session.commit()

    return {"menssage" : "usuario criado", "usuario" : novo_usuario.nome}

@app.route('/login', methods=['POST'])
def login():
    dados=request.get_json()

    usuario = Usuario.query.filter_by(email=dados['email']).first()

    if usuario is None or not check_password_hash(usuario.senha, dados['senha']):
        return {"error" : "Dados invalidos"}
    
    return {"menssage" : f"bem vindo, {usuario.nome}!", "tipo_usuario": usuario.tipo_usuario}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
    
