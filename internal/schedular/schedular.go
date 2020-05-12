package schedular

import (
	"github.com/jasonlvhit/gocron"

	"github.com/erangaj/homedockyard/pkg/dockerservice"
)

type context struct {
	ds *dockerservice.DockerService
}

func (c *context) pullImages() {
	c.ds.StartImagePull()
}

// ExecuteCronJobs starts backdround jobs
func ExecuteCronJobs(ds *dockerservice.DockerService) {
	c := context{ds: ds}
	gocron.Every(1).Hour().Do(c.pullImages)
	<-gocron.Start()
}
