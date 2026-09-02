from flask import Flask, request
from flask import 
from flask_cors import CORS


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:@localhost:3306/Cafezin"

CORS(app)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
    
