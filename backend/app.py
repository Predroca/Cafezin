from flask import Flask
from flask_cors import CORS

from extensions import db, jwt
from routes.auth_rotas import auth_bp
from routes.catalogo_bp import catalogo_bp

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:@localhost:3306/Cafezin"
app.config["JWT_SECRET_KEY"] = "IcH6IkqK3RgsF964iwmMIWSZ3TpCXZ4JymducTUj5eOQpwmEij1IFdog8dAu7GWj"

CORS(app)
db.init_app(app)
jwt.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(catalogo_bp)


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)
