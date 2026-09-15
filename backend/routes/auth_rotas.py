from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token


from models.usuario import Usuario
from models.loja import Loja
from models.comprador import Comprador
from models import Entregador
from models.endereco import Endereco
from models.pagamento import Pagamento

from flask_cors import CORS
from extensions import db

auth_bp = Blueprint('auth', __name__)

CORS(auth_bp)

@auth_bp.route('/register/comprador', methods=['POST'])
def registrar_comprador():
    dados = request.get_json()

    existe = Usuario.query.filter_by(email=dados['email']).first()
    if existe is not None:
        return {"error" : "email já cadastrado"}, 409
    
    senha_hash = generate_password_hash(dados["senha"])

    novo_usuario = Usuario(
        email = dados['email'],
        senha = senha_hash,
        nome = dados["nome"],
        tipo_usuario = 'Comprador',
        telefone = dados.get("telefone")
    )

    db.session.add(novo_usuario)
    db.session.flush()

    comprador = Comprador(
        cpf = dados["cpf"],
        data_nasc = dados.get('data_nasc'),
        sexo = dados.get('sexo'),
        cod_usuario = novo_usuario.cod_usuario
    )

    db.session.add(comprador)
    db.session.commit()

    return {"menssage" : "usuario criado", "usuario" : novo_usuario.nome}, 201


@auth_bp.route('/register/loja', methods=['POST'])
def registrar_loja():
    dados = request.get_json()

    existe = Usuario.query.filter_by(email=dados['email']).first()
    if existe is not None:
        return {"error" : "email já cadastrado"}, 409
    
    senha_hash = generate_password_hash(dados["senha"])

    novo_usuario = Usuario(
        email = dados['email'],
        senha = senha_hash,
        nome = dados["nome"],
        tipo_usuario = 'Loja',
        telefone = dados.get("telefone")
    )

    db.session.add(novo_usuario)
    db.session.flush()

    end = dados['endereco']
    endereco = Endereco(
        nome_logradouro = end['nome_logradouro'],
        numero = end.get('numero'),
        complemento = end.get('complemento'),
        bairro = end.get('bairro'),
        cidade = end.get('cidade'),
        estado = end.get('estado'),
        cep = end.get('cep')
    )

    db.session.add(endereco)
    db.session.flush()

    loja = Loja (
        cpf = dados["cnpj"],
        horario_funcionamento=dados.get('horario_funcionamento'),
        cod_endereco=endereco.cod_endereco,
        cod_usuario=novo_usuario.cod_usuario
    )

    db.session.add(loja)
    db.session.commit()

    return {"menssage" : "loja criada", "usuario" : novo_usuario.nome}, 201


@auth_bp.route('/register/entregador', methods=['POST'])
def registrar_entregador():
    dados = request.get_json()

    existe = Usuario.query.filter_by(email=dados['email']).first()
    if existe is not None:
        return {"error" : "email já cadastrado"}, 409
    
    senha_hash = generate_password_hash(dados["senha"])

    novo_usuario = Usuario(
        email = dados['email'],
        senha = senha_hash,
        nome = dados["nome"],
        tipo_usuario = 'Entregador',
        telefone = dados.get("telefone")
    )

    db.session.add(novo_usuario)
    db.session.flush()

    pag = dados['pagamento']
    pagamento = Pagamento(
        tipo = pag['tipo'],
        data = pag.get('data')
    )

    db.session.add(pagamento)
    db.session.flush()

    entregador = Entregador (
        cpf = dados["cpf"],
        data_nasc = dados.get('data_nasc'),
        cnh = dados.get('cnh'),
        cod_pagamento = pagamento.cod_pagamento,
        cod_usuario = novo_usuario.cod_usuario
        
    )

    db.session.add(entregador)
    db.session.commit()

    return {"menssage" : "Entregador(a) criado(a)", "usuario" : novo_usuario.nome}, 201




@auth_bp.route('/login', methods=['POST'])
def login():
    dados = request.get_json()

    usuario = Usuario.query.filter_by(
        email=dados['email']
    ).first()

    print("Email recebido:", dados['email'])
    print("Usuário encontrado:", usuario is not None)

    if usuario:
        print("Senha confere:",
              check_password_hash(usuario.senha, dados['senha']))

    if not usuario or not check_password_hash(
        usuario.senha,
        dados['senha']
    ):
        return jsonify({
            'erro': 'Email ou senha inválidos'
        }), 401

    token = create_access_token(
        identity=str(usuario.cod_usuario),
        additional_claims={
            'tipo_usuario': usuario.tipo_usuario,
            'nome': usuario.nome
        }
    )

    return jsonify({'token': token}), 200

@auth_bp.route('/esqueci-senha', methods=['POST'])
def esqueci():
    dados = request.get_json()

    usuario = Usuario.query.filter_by(email=dados['email']).first()

    if usuario is None:
        return {"error" : "Email nao encontrado"}
    
    usuario.senha = generate_password_hash(dados["nova_senha"])
    db.session.commit() 

    return {"mensagem" : "Senha redefinida com sucesso"}

