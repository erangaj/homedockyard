package main

import (
	"github.com/erangaj/homedockyard/internal/schedular"
	"github.com/erangaj/homedockyard/internal/server"
	"github.com/erangaj/homedockyard/pkg/dockerservice"
)

func main() {
	ds := dockerservice.DockerService{}
	ds.Init()

	go schedular.ExecuteCronJobs(&ds)
	server.Serv(&ds, true)
}
