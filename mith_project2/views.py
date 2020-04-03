# import necessary libraries
import os
import pandas as pd
# import json # to_json and json.loads
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func
from mith_project2 import app

from flask import (
    Flask,
    render_template,
    jsonify,
    request,
    redirect)

#################################################
# Database Setup
#################################################
engine = create_engine("sqlite:///db.sqlite")

# # reflect an existing database into a new model
# Base = automap_base()
# # reflect the tables
# Base.prepare(engine, reflect=True)
# Base.classes.keys()

# # Save reference to the table
# usautotable = Base.classes.usautotable

#################################################
# Flask Setup
#################################################
# app = Flask(__name__)

#################################################
# Database Setup
#################################################

# from flask_sqlalchemy import SQLAlchemy
# app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', '') or "sqlite:///db.sqlite"

# # Remove tracking modifications
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# db = SQLAlchemy(app)



# create route that renders index.html template
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/usauto")
def usauto():
    # print("code reached here")

    usautotable = pd.read_sql('select * from usautotable', con=engine)

    results = usautotable.to_dict(orient='records')

    # results = usautotable.to_json(orient='records')
    # results = json.loads(results)

    return jsonify(results)

# if __name__ == "__main__":
#     app.run()
