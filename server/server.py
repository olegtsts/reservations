# -*- coding: utf8 -*-

from flask import Flask
from flask import render_template

app = Flask(__name__)

@app.route('/')
def main_page():
    return render_template('main.html')

def run_server():
    app.run(
        host='::',
        port=5001,
        use_reloader=False,
        debug=True,
        threaded=False)

if __name__ == "__main__":
    run_server()
