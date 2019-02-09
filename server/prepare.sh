protoc -I=. --python_out=. schema.proto
python setup-organization.py
protoc --js_out=files/js/proto schema.proto
git clone https://github.com/google/closure-library files/closure-library
git clone git@github.com:protocolbuffers/protobuf.git files/protobuf
