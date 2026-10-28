from functools import wraps

from flask_jwt_extended import get_jwt, verify_jwt_in_request


def tipo_requerido(*tipos):
    def decorator(funcao):
        @wraps(funcao)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            if get_jwt().get("tipo_usuario") not in tipos:
                return {"error": "acesso negado para este tipo de usuário"}, 403
            return funcao(*args, **kwargs)
        return wrapper
    return decorator