from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from models.usuario import Usuario, db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    dados = request.get_json()
    usuario = Usuario.query.filter_by(email=dados['email']).first()

    if not usuario or not check_password_hash(usuario.senha, dados['senha']):
        return jsonify({'erro': 'Email ou senha inválidos'}), 401

    token = create_access_token(
        identity=str(usuario.cod_usuario),
        additional_claims={'tipo_usuario': usuario.tipo_usuario, 'nome': usuario.nome}
    )
    return jsonify({'token': token}), 200


@auth_bp.route('/esqueci-senha', methods=['POST'])
def esqueci_senha():
  
