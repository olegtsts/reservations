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
def get_all_reservations():
    r = Redis(host='localhost', port=6379, db=0)

    org = schema_pb2.Organization()
    org.ParseFromString(r.get(request.form['organization_id']))

    org.ClearField('reservation_secret')

    return org.SerializeToString();

@app.route('/add_reservation', methods=['POST'])
def add_reservation():
    r = Redis(host='localhost', port=6379, db=0)
    reservation_request = schema_pb2.ReservationRequest.ParseFromString(request.form['data'])

    org = schema_pb2.Organization()
    org.ParseFromString(r.get(reservation_request.organization_id))

    response = schema_pb2.ReservationResponse()

    for reservation in org.reservation:
        if reservation.reservlet_id == reservation_request.reservlet_id:
            first_sign = reservation_request.time_from - reservation.time_to
            second_sign = reservation_request.time_to - reservation.time_from
            if (first_sign * second_sign < 0):
                response.status = schema_pb2.ReservationResponse.ALREADY_RESERVED
                response.error_reason = "Given time is already reserved."
                return response

    new_reservation = org.reservation.add()

    new_reservation.id = hashlib.blake2b(digest_size=10).update(str(reservation_request.SerializeToString()))
    new_reservation.time_from = reservation_request.time_from
    new_reservation.time_to = reservation_request.time_to
    new_reservation.reservlet_id = reservation_request.reservlet_id

    new_secret_code = org.reservation_secret.add()

    new_secret_code.secret_code = hashlib.blake2b(digest_size=5).update(str(datetime.datetime.now().time()) + reservation_request.reservlet_id)
    new_secret_code.reservation_id = new_reservation.id

    r.set(reservation_request.organization_id, org.SerializeToString())

    response.status = schema_pb2.ReservationResponse.SUCCESS
    response.secret_code = new_secret_code.secret_code

    return jsonify({
        'response': response.SerializeToString()
    })

def run_server():
    app.run(
        host='::',
        port=5001,
        use_reloader=False,
        debug=True,
        threaded=True)

if __name__ == "__main__":
    run_server()

