import schema_pb2
import hashlib
import datetime

def get_all_resevations(organisation_id):
    r = Redis(host='localhost', port=6379, db=0)

    org = schema.Organisation
    org.ParseFromString(r.get(organisation_id))

    org.reservation_secret.Clear();

    return  org.SerializeToString()

def add_reservation(reservation_request):
    r = Redis(host='localhost', port=6379, db=0)
    org = schema.Organisation
    org.ParseFromString(r.get(reservation_request.organisation_id))

    responce = schema.ReservationResponce

    for reservation in org.reservation:
        if reservation.reservlet_id == reservation_request.reservlet_id:
            first_sign = reservation_request.from - reservation.to
            second_sign = reservation_request.to - reservation.from
            if (first_sign * second_sign < 0):
                responce.status = schema_pb2.ResponceStatus.FAILED
                responce.debug_message = "Given time is already reserved."
                return responce

    new_reservation = org.reservation.add()

    new_reservation.id = hashlib.blake2b(digest_size=10).update(str(reservation_request.SerializeToString()))
    new_reservation.time_from = reservation_request.time_from
    new_reservation.time_to = reservation_request.time_to
    new_reservation.reservlet_id = reservation_request.reservlet_id

    new_secret_code = org.reservation_secret.add()

    new_secret_code.secret_code = hashlib.blake2b(digest_size=5).update(str(datetime.datetime.now().time()) + reservation_request.reservlet_id)
    new_secret_code.reservlet_id = reservation_request.reservlet_id

    r.set(eservation_request.organisation_id, org.SerializeToString())

    responce.status = schema_pb2.ResponceStatus.SUCCESS
    responce.secret_code = new_secret_code.secret_code

    return responce

