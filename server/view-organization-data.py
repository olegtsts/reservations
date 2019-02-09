# -*- coding: utf8 -*-

from redis import Redis
import sys
import schema_pb2


def get_organization_data(organization_id):
    r = Redis(host='localhost', port=6379, db=0)
    org_data = r.get(organization_id)
    if org_data is None:
        print("No such org found")
    else:
        org = schema_pb2.Organisation()
        org.ParseFromString(org_data)
        print(org)

if __name__ == "__main__":
    get_organization_data(sys.argv[1])
