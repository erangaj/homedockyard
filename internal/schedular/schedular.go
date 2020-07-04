package schedular

import (
	"math/rand"
	"time"

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
	time.Sleep(time.Duration(rand.Intn(20)) * time.Minute)
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		for t := range ticker.C {
			_ = t
			c := context{ds: ds}
			go c.pullImages()
		}
	}()

}
