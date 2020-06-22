package main

import (
	"github.com/erangaj/homedockyard/internal/configservice"
	"github.com/erangaj/homedockyard/internal/schedular"
	"github.com/erangaj/homedockyard/internal/server"
	"github.com/erangaj/homedockyard/pkg/dockerservice"
)

func main() {

	conf := configservice.Read()
	endpoints := conf.Endpoints
	dockerServices := make([]dockerservice.DockerService, 0)

	if endpoints == nil || len(endpoints) == 0 {
		ds := dockerservice.DockerService{}
		ds.Name = "Local"
		ds.ID = 0
		ds.InitLocal()
		go schedular.ExecuteCronJobs(&ds)
		dockerServices = append(dockerServices, ds)
	}

	for i, endpoint := range endpoints {
		ds := dockerservice.DockerService{}
		ds.Name = endpoint.Name
		ds.ID = i
		if endpoint.Type == "Local" {
			ds.InitLocal()
		} else {
			ds.Init(endpoint.URL)
		}
		go schedular.ExecuteCronJobs(&ds)
		dockerServices = append(dockerServices, ds)
	}

	server.Serv(&dockerServices, true)
}
