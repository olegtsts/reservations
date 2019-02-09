protoc -I=. --python_out=. schema.proto
python setup-organization.py
protoc --js_out=files/js  schema.proto
