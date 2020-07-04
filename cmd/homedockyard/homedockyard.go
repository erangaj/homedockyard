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
		ds.IsLocal = true
		ds.PathMappings = nil
		ds.ID = 0
		ds.Init()
		go schedular.ExecuteCronJobs(&ds)
		dockerServices = append(dockerServices, ds)
	} else {
		for i, endpoint := range endpoints {
			ds := dockerservice.DockerService{}
			ds.Name = endpoint.Name
			ds.PathMappings = endpoint.PathMappings
			ds.URL = endpoint.URL
			ds.ID = i
			ds.IsLocal = (endpoint.Type == "Local")
			ds.Init()
			go schedular.ExecuteCronJobs(&ds)
			dockerServices = append(dockerServices, ds)
		}
	}
	server.Serv(&dockerServices, true)
}
