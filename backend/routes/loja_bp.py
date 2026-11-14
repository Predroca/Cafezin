import re 
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from permissoes import tipo_requerido
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from datetime import date, time
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from decimal import Decimal, InvalidOperation

from models.produto import Produto
from models.loja import Loja
from models.usuario import Usuario
from models.pedido import Pedido
from models.categoria import Categoria
from models.avaliacao_loja import AvaliacaoLoja
from models.comprador import Comprador
from models.item_pedido import ItemPedido


loja_bp = Blueprint("loja", __name__)

@loja_bp.errorhandler(SQLAlchemyError)
def _erro_nomeExist(nome):
    produto = Produto.query.filter_by(nome=nome).first()
    if produto != None:
            return ({"error" : "já existe um produto com o nome informado (tenha mais criatividade)"})
    
def _erro_lojaInexistente(cod_loja):
     loja = Loja.query.filter_by(cod_loja=cod_loja).first()
    
     if loja is None:
          return ({"error" : "não exite nenhuma loja com o codigo informado (melhore)"})

def loja_do_usuario_logado():
    cod_usuario = get_jwt_identity()
    loja = Loja.query.filter_by(cod_usuario=cod_usuario).first()
    return loja

def _hora_json(valor):
    return valor.strftime("%H:%M") if valor else None
 
def _perfil_loja_json(loja):
    usuario = loja.usuario
    end = loja.endereco
    return {
        "nome": usuario.nome,
        "cnpj": loja.cnpj,
        "email": usuario.email,
        "telefone": usuario.telefone,
        "foto_url": usuario.foto_url,
        "endereco": {
            "nome_logradouro": end.nome_logradouro,
            "numero": end.numero,
            "bairro": end.bairro,
            "cidade": end.cidade,
            "estado": end.estado,
            "cep": end.cep,
        },
        "horario_abertura": _hora_json(loja.horario_abertura),
        "horario_fecha": _hora_json(loja.horario_fecha),
    }


def _ler_hora(bruto):
    #'HH:MM' -> time. Vazio/None -> (None, None). Inválido -> (None, erro)."""
    if bruto in (None, ""):
        return None, None
    try:
        h, m = str(bruto).split(":")[:2]
        return time(int(h), int(m)), None
    except (ValueError, TypeError):
        return None, "horário deve estar no formato HH:MM"
 
 
def _texto_opcional(dados, chave, limite):
    #"""Devolve (valor, erro) para campos de texto opcionais; vazio vira None."""
    valor = (dados.get(chave) or "").strip()
    if len(valor) > limite:
        return None, f"{chave} deve ter no máximo {limite} caracteres"
    return (valor or None), None
 
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")

@loja_bp.route("/loja/perfil", methods=["GET"])
@tipo_requerido("Loja")
def ver_perfil_loja():
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404
    return _perfil_loja_json(loja), 200

UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}

@loja_bp.route("/loja/perfil", methods=["PATCH"])  # atualizar dados
@tipo_requerido("Loja")
def editar_perfil_loja():
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404

    dados = request.get_json(silent=True) or {}
    usuario = loja.usuario

    # identificação
    if "nome" in dados:
        nome = (dados["nome"] or "").strip()
        if len(nome) < 2 or len(nome) > 100:
            return {"error": "nome deve ter entre 2 e 100 caracteres"}, 400
        usuario.nome = nome

    if "cnpj" in dados:
        cnpj = re.sub(r"\D", "", dados["cnpj"] or "")
        if len(cnpj) != 14:
            return {"error": "cnpj deve ter 14 dígitos"}, 400
        loja.cnpj = cnpj

    # contato
    if "email" in dados:
        email = (dados["email"] or "").strip()
        if len(email) > 100 or not EMAIL_RE.match(email):
            return {"error": "e-mail inválido"}, 400
        em_uso = Usuario.query.filter(
            Usuario.email == email, Usuario.cod_usuario != usuario.cod_usuario
        ).first()
        if em_uso:
            return {"error": "e-mail já cadastrado"}, 409
        usuario.email = email

    if "telefone" in dados:
        telefone = (dados["telefone"] or "").strip()
        if telefone and len(re.sub(r"\D", "", telefone)) not in (10, 11):
            return {"error": "telefone deve ter DDD e 8 ou 9 dígitos"}, 400
        usuario.telefone = telefone or None

    # endereço: atualiza o Endereco já ligado à loja, não cria outro
    end_dados = dados.get("endereco")
    if end_dados is not None:
        if not isinstance(end_dados, dict):
            return {"error": "endereco deve ser um objeto"}, 400
        end = loja.endereco

        if "nome_logradouro" in end_dados:
            logradouro = (end_dados["nome_logradouro"] or "").strip()
            if not logradouro or len(logradouro) > 100:
                return {"error": "logradouro é obrigatório (máximo 100 caracteres)"}, 400
            end.nome_logradouro = logradouro

        for campo, limite in (("numero", 10), ("bairro", 50), ("cidade", 50)):
            if campo in end_dados:
                valor, erro = _texto_opcional(end_dados, campo, limite)
                if erro:
                    return {"error": erro}, 400
                setattr(end, campo, valor)

        if "estado" in end_dados:
            estado = (end_dados["estado"] or "").strip().upper()
            if estado and estado not in UFS:
                return {"error": "estado inválido (use a sigla, ex.: MG)"}, 400
            end.estado = estado or None

        if "cep" in end_dados:
            cep = re.sub(r"\D", "", end_dados["cep"] or "")
            if cep and len(cep) != 8:
                return {"error": "cep deve ter 8 dígitos"}, 400
            end.cep = cep or None

    # funcionamento (horário único)
    abertura, fecha = loja.horario_abertura, loja.horario_fecha
    if "horario_abertura" in dados:
        abertura, erro = _ler_hora(dados["horario_abertura"])
        if erro:
            return {"error": erro}, 400
    if "horario_fecha" in dados:
        fecha, erro = _ler_hora(dados["horario_fecha"])
        if erro:
            return {"error": erro}, 400
    if abertura and fecha and fecha <= abertura:
        return {"error": "o fechamento deve ser depois da abertura"}, 400
    loja.horario_abertura = abertura
    loja.horario_fecha = fecha

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "e-mail já cadastrado"}, 409
    except SQLAlchemyError as erro:
        db.session.rollback()
        return {"error": f"erro ao acessar o banco de dados: {erro}"}, 500

    return _perfil_loja_json(loja), 200



@loja_bp.route("/loja/produtos", methods=["GET"])
@tipo_requerido("Loja")
def meus_produtos():
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404

    cod_categoria = request.args.get("categoria", type=int)
    apenas_indisponiveis = request.args.get("indisponiveis", type=bool)

    query = Produto.query.filter_by(cod_loja=loja.cod_loja)

    if cod_categoria:
        query = query.filter(Produto.cod_categoria == cod_categoria)
    if apenas_indisponiveis:
        query = query.filter(Produto.disponibilidade.is_(False))

    produtos = query.order_by(Produto.nome).all()

    return {
        "produtos": [
            {
                "cod_produto": p.cod_produto,
                "nome": p.nome,
                "descricao": p.descricao,
                "preco": float(p.preco),
                "disponibilidade": p.disponibilidade,
                "cod_categoria": p.cod_categoria,
                "foto_url": p.foto_url,
            }
            for p in produtos
        ]
    }

@loja_bp.route("/loja/dashboard", methods=["GET"])
@tipo_requerido("Loja")
def dashboard():
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404

    hoje = date.today()

    pedidos_hoje_query = Pedido.query.filter(
        Pedido.cod_loja == loja.cod_loja,
        Pedido.status != 'Cancelado',
        func.date(Pedido.data_pedido) == hoje,
    )

    total_pedidos_hoje = pedidos_hoje_query.count()
    faturado_hoje = pedidos_hoje_query.with_entities(func.sum(Pedido.valor_total)).scalar() or 0

    produtos_ativos = Produto.query.filter_by(
        cod_loja=loja.cod_loja, disponibilidade=True
    ).count()

    media_avaliacao = (
        db.session.query(func.avg(AvaliacaoLoja.nota))
        .join(Pedido, AvaliacaoLoja.cod_pedido == Pedido.cod_pedido)
        .filter(Pedido.cod_loja == loja.cod_loja)
        .scalar()
    )

    return {
        "pedidos_hoje": total_pedidos_hoje,
        "faturado_hoje": float(faturado_hoje),
        "produtos_ativos": produtos_ativos,
        "avaliacao_media": round(float(media_avaliacao), 1) if media_avaliacao else None,
    }

     
@loja_bp.route("/loja/produto", methods=["POST"])
@tipo_requerido("Loja")
def criar_produto():
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404

    dados = request.get_json(silent=True) or {}

    nome = (dados.get("nome") or "").strip()
    if not nome or len(nome) > 100:
        return {"error": "nome é obrigatório (máximo 100 caracteres)"}, 400

    ja_existe = Produto.query.filter_by(cod_loja=loja.cod_loja, nome=nome).first()
    if ja_existe:
        return {"error": "sua loja já tem um produto com esse nome"}, 409

    preco, erro = _ler_preco(dados.get("preco"))
    if erro:
        return {"error": erro}, 400

    disponibilidade = dados.get("disponibilidade", True)
    if not isinstance(disponibilidade, bool):
        return {"error": "disponibilidade deve ser true ou false"}, 400

    cod_categoria = dados.get("cod_categoria")

    produto = Produto(
        cod_loja=loja.cod_loja,
        nome=nome,
        descricao=(dados.get("descricao") or "").strip() or None,
        preco=preco,
        disponibilidade=disponibilidade,
        cod_categoria=cod_categoria,
    )

    db.session.add(produto)
    db.session.commit()

    return {"message": "produto criado", "cod_produto": produto.cod_produto}, 201
    
@loja_bp.route("/deletar_produto/<int:cod_produto>", methods=["DELETE"]) #não usem essa rota a não ser em ultimo caso , pode deletar metade do banco de dados
def deletar_produto(cod_produto):

    product = Produto.query.filter_by(cod_produto = cod_produto).first()

    if product != None:
        # Marcar o produto para exclusão
        db.session.delete(product)
        # Salvar as alterações no banco de dados
        db.session.commit()
        return{"message" : "Ja era KK , cabo com o banco de dados."}
    else:
        return{"message" : "Produto não encontrado."}

@loja_bp.route("/loja/pedidos", methods=["GET"])
@tipo_requerido("Loja")
def listar_pedidos_loja():
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "essa loja nem existe"}, 404

    status_filtro = request.args.getlist("status")

    query = Pedido.query.filter_by(cod_loja=loja.cod_loja)
    if status_filtro:
        query = query.filter(Pedido.status.in_(status_filtro))
    else:
        query = query.filter(Pedido.status.in_(["Pendente", "Em preparo", "Em andamento"]))

    pedidos = query.order_by(Pedido.data_pedido.asc()).all()

    return {
        "pedidos": [
            {
                "cod_pedido": p.cod_pedido,
                "status": p.status,
                "data_pedido": p.data_pedido.isoformat(),
                "valor_total": float(p.valor_total),
                "comprador": p.comprador.usuario.nome,
                "itens": [
                    {"produto": i.produto.nome, "quantidade": i.quantidade}
                    for i in p.itens
                ],
            }
            for p in pedidos
        ]
    }

TRANSICOES_VALIDAS = {
    "Pendente": {"aceitar": "Em preparo", "recusar": "Cancelado"},
    "Em preparo": {"pronto": "Em andamento"},
    "Em andamento": {"entregue": "Entregue"},
}


@loja_bp.route("/loja/pedidos/<int:cod_pedido>/status", methods=["PATCH"])
@tipo_requerido("Loja")
def atualizar_status_pedido(cod_pedido):
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "não achei a loja"}, 404

    pedido = Pedido.query.get_or_404(cod_pedido)
    if pedido.cod_loja != loja.cod_loja:
        return {"error": "pedido não pertence a esta loja"}, 403

    dados = request.get_json()
    acao = dados.get("acao")

    transicoes = TRANSICOES_VALIDAS.get(pedido.status, {})
    novo_status = transicoes.get(acao)

    if novo_status is None:
        return {"error": f"ação '{acao}' inválida pra isso aqui '{pedido.status}'"}, 400

    pedido.status = novo_status
    db.session.commit()

    return {"cod_pedido": pedido.cod_pedido, "status": pedido.status}


@loja_bp.route("/loja/pedidos/todos", methods=["GET"])
@tipo_requerido("Loja")
def listar_todos_pedidos_loja():
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404

    pedidos = (
        Pedido.query.filter_by(cod_loja=loja.cod_loja)
        .options(
            joinedload(Pedido.comprador).joinedload(Comprador.usuario),
            joinedload(Pedido.itens).joinedload(ItemPedido.produto),
        )
        .order_by(Pedido.data_pedido.desc())
        .all()
    )

    return [
        {
            "nomeCliente": p.comprador.usuario.nome,
            "codigoPedido": p.cod_pedido,
            "horario": p.data_pedido.strftime("%H:%M"),
            "produtosPedido": [i.produto.nome for i in p.itens],
            "dia": p.data_pedido.day,
            "mes": p.data_pedido.month,
            "ano": p.data_pedido.year,
            "valorDoPedido": float(p.valor_total),
        }
        for p in pedidos
    ]



def _ler_preco(bruto):
    try:
        preco = Decimal(str(bruto).replace(",", "."))
    except InvalidOperation:
        return None, "preço inválido"
    if preco <= 0:
        return None, "preço deve ser maior que zero"
    return preco, None

def _produto_json(p):
    return {
        "cod_produto": p.cod_produto,
        "nome": p.nome,
        "descricao": p.descricao,
        "preco": float(p.preco),
        "disponibilidade": p.disponibilidade,
        "cod_categoria": p.cod_categoria,
        "foto_url": p.foto_url,
    }

def _produto_da_loja(cod_produto, loja):
    produto = db.session.get(Produto, cod_produto)
    if produto is None or produto.cod_loja != loja.cod_loja:
        return None
    return produto

@loja_bp.route("/loja/produtos/<int:cod_produto>", methods=["GET"])
@tipo_requerido("Loja")
def ver_produto(cod_produto):
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404

    produto = _produto_da_loja(cod_produto, loja)
    if produto is None:
        return {"error": "produto não encontrado"}, 404

    return _produto_json(produto), 200

@loja_bp.route("/loja/produtos/<int:cod_produto>", methods=["PATCH"])
@tipo_requerido("Loja")
def editar_produto(cod_produto):
    loja = loja_do_usuario_logado()
    if loja is None:
        return {"error": "loja não encontrada"}, 404

    produto = _produto_da_loja(cod_produto, loja)
    if produto is None:
        return {"error": "produto não encontrado"}, 404
     
    dados = request.get_json(silent=True) or {}
    
     
    if "nome" in dados:
        nome = (dados["nome"] or "").strip()
        if not nome or len(nome) > 100:
            return {"error": "nome é obrigatório (máximo 100 caracteres)"}, 400
        repetido = Produto.query.filter(
            Produto.cod_loja == loja.cod_loja,
            Produto.nome == nome,
            Produto.cod_produto != produto.cod_produto,
        ).first()
        if repetido:
            return {"error": "sua loja já tem um produto com esse nome"}, 409
        produto.nome = nome

    if "descricao" in dados:
        descricao = (dados["descricao"] or "").strip()
        produto.descricao = descricao or None

    if "preco" in dados:
        preco, erro = _ler_preco(dados["preco"])
        if erro:
            return {"error": erro}, 400
        produto.preco = preco
    
    if "disponibilidade" in dados:
        disponibilidade = dados["disponibilidade"]
        if not isinstance(disponibilidade, bool):
            return {"error": "disponibilidade deve ser true ou false"}, 400
        produto.disponibilidade = disponibilidade

    if "cod_categoria" in dados:
        cod_categoria = dados["cod_categoria"]
        if cod_categoria is not None:
            if db.session.get(Categoria, cod_categoria) is None:
                return {"error": "categoria não encontrada"}, 400
        produto.cod_categoria = cod_categoria

    db.session.commit()
    return _produto_json(produto), 200
