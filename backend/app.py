from flask import Flask
from flask_cors import CORS


from extensions import db, jwt
from routes.auth_rotas import auth_bp
from routes.catalogo_bp import catalogo_bp
from routes.endereco import endereco_bp

from config import Config


app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLALCHEMY_DATABASE_URI
app.config["SECRET_KEY"] = Config.SECRET_KEY

db.init_app(app)
jwt.init_app(app)

CORS(app)


app.register_blueprint(auth_bp)
app.register_blueprint(catalogo_bp)
app.register_blueprint(endereco_bp)


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)
