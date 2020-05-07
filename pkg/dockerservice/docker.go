package dockerservice

import (
	"bytes"
	"context"
	"log"
	"os"
	"strings"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
)

// DockerService contains the Docker API client code
type DockerService struct {
	ImagePullRunning bool
	client           *client.Client
}

var logger = log.New(os.Stderr, "", log.LstdFlags)

// Container represents a single container
type Container struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	ImageName       string `json:"imageName"`
	UpdateAvailable bool   `json:"updateAvailable"`
	//Ports     []types.Port
	//Labels    map[string]string
	State  string `json:"state"`
	Status string `json:"status"`
	Icon   string `json:"icon"`
}

// Init Initiates Docker connection
func (s *DockerService) Init() {
	cli, err := client.NewEnvClient()
	s.client = cli
	if err != nil {
		panic(err)
	}
}

// Containers returns all containers
func (s *DockerService) Containers() []Container {
	containers, err := s.client.ContainerList(context.Background(), types.ContainerListOptions{All: true})
	if err != nil {
		panic(err)
	}

	result := make([]Container, len(containers))

	for i, container := range containers {
		cIns, err := s.client.ContainerInspect(context.Background(), container.ID)
		if err != nil {
			panic(err)
		}

		var name string
		if len(container.Names) > 0 {
			name = container.Names[0]
			name = strings.Trim(name, "/")
		}

		imageName := cIns.Config.Image

		iIns, _, err := s.client.ImageInspectWithRaw(context.Background(), imageName)

		result[i] = Container{
			ID:              container.ID,
			Name:            name,
			ImageName:       imageName,
			UpdateAvailable: (container.ImageID != iIns.ID),
			//Labels:    container.Labels,
			State:  container.State,
			Status: container.Status,
			//Ports:     container.Ports,
		}
	}

	return result
}

// StartImagePull starts pulling latest images from the registries
func (s *DockerService) StartImagePull() string {
	if !s.ImagePullRunning {
		go s.pullImages()
		return "started"
	} else {
		return "already running"
	}
}

// Close closes Docker connection
func (s *DockerService) Close() {
	s.client.Close()
}

func (s *DockerService) pullImages() {
	logger.Println("Start pulling images")
	s.ImagePullRunning = true
	containers := s.Containers()
	for _, c := range containers {
		image := c.ImageName

		if strings.Contains(image, "/") {
			image = "docker.io/" + c.ImageName
		} else {
			image = "docker.io/library/" + c.ImageName
		}
		logger.Println(image)

		reader, err := s.client.ImagePull(context.Background(), image, types.ImagePullOptions{})

		if err != nil {
			logger.Println(err)
		} else {
			buf := new(bytes.Buffer)
			buf.ReadFrom(reader)
			logger.Println(buf.String())
			reader.Close()
		}
	}
	logger.Println("Finish pulling images")
	s.ImagePullRunning = false
}
