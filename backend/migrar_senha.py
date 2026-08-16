from app import app, db, Usuario
from werkzeug.security import generate_password_hash

with app.app_context():
    usuarios = Usuario.query.all()

    for usuario in usuarios:
        if not usuario.senha.startswith("scrypt:"):
            usuario.senha=generate_password_hash(usuario.senha)
    db.session.commit()
    print(f"{len(usuarios)} senha(s) verificada(s)/atualizada(s)")