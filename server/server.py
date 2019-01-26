# -*- coding: utf8 -*-

from flask import Flask
from flask import request
from flask import render_template
from flask import send_from_directory
from flask import jsonify
from redis import Redis


app = Flask(__name__)

@app.route('/')
def main_page():
    return render_template('main.html')

@app.route('/files/<path:path>')
def send_file(path):
    return send_from_directory('files', path)

@app.route('/ajax', methods=['POST'])
def respond_to_ajax():
    r = Redis(host='localhost', port=6379, db=0)
    return jsonify({
        'response': str(r.get('key123'), 'utf-8'),
    })

def run_server():
    app.run(
        host='::',
        port=5001,
        use_reloader=False,
        debug=True,
        threaded=False)

if __name__ == "__main__":
    run_server()
