package main

import (
	"github.com/erangaj/homedockyard/internal/server"
	"github.com/erangaj/homedockyard/pkg/dockerservice"
)

func main() {
	ds := dockerservice.DockerService{}
	ds.Init()
	server.Serv(&ds, false)
}
