# -*- coding: utf8 -*-

from google.protobuf import text_format
from redis import Redis
import schema_pb2

def setup_organization():
    organization = text_format.Parse(open('organization.pbtxt').read(), schema_pb2.Organization())
    r = Redis(host='localhost', port=6379, db=0)
    r.set('test_org', organization.SerializeToString())

if __name__ == "__main__":
    setup_organization()

