generate:
	cd internal/server && go generate

compile:
	go build -ldflags "-linkmode external -extldflags -static" -a -o homedockyard cmd/homedockyard/homedockyard.go

build: generate compile

install: generate
	go install cmd/homedockyard/homedockyard.go

dockerbuild:
	docker build --tag erangaj/homedockyard:0.1 .

dockerdeploy:
	docker rm -f homedockyard
	docker run --publish 49080:9080 --detach -v /var/run/docker.sock:/var/run/docker.sock --name homedockyard erangaj/homedockyard:0.1

docker: dockerbuild dockerdeploy

push:
	docker push erangaj/homedockyard:0.1
