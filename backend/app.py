from flask import Flask, request
from flask_cors import CORS
from routes import auth_rotas , catalogo_bp

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:@localhost:3306/Cafezin"
app.register_blueprint(auth_rotas)
app.register_blueprint(catalogo_bp)
CORS(app)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
    
