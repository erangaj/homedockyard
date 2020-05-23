generate:
	cd web && yarn build
	cd internal/server && go generate

compile:
	go build -ldflags "-linkmode external -extldflags -static" -a -o homedockyard cmd/homedockyard/homedockyard.go

build: generate compile

install: generate
	go install cmd/homedockyard/homedockyard.go

dockerbuild:
	docker build --tag erangaj/homedockyard:0.2 .

dockerdeploy:
	docker rm -f homedockyard
	docker run --publish 49080:9080 --detach -v /var/run/docker.sock:/var/run/docker.sock -v /docker/definitions:/docker/definitions  --name homedockyard erangaj/homedockyard:0.2

docker: build dockerbuild dockerdeploy

push:
	docker push erangaj/homedockyard:0.2
