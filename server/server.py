# -*- coding: utf8 -*-

from flask import Flask
from flask import request
from flask import render_template
from flask import send_from_directory
from flask import jsonify
from redis import Redis
import schema_pb2
import hashlib

app = Flask(__name__)

@app.route('/')
def main_page():
    return render_template('main.html')

@app.route('/files/<path:path>')
def send_file(path):
    return send_from_directory('files', path)

@app.route('/get_all_reservations', methods=['POST'])
def respond_to_ajax():
    return jsonify({
        'data': get_all_reservations(request.form['restaurant_id'])
    })

@app.route('/add_reservation', methods=['POST'])
def respond_to_ajax():
    return jsonify({
        'responce': add_reservation(request.form['request_proto'])
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
