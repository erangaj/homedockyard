package dockerservice

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
)

const DockerComposePath = "/home/coder/go/bin/docker-compose"

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
	State       string      `json:"state"`
	Status      string      `json:"status"`
	Icon        string      `json:"icon"`
	ComposeData ComposeData `json:"composeData"`
}

// ComposeData holds values of docker-compose labels
type ComposeData struct {
	Service      string `json:"service"`
	Project      string `json:"project"`
	ConfigFiles  string `json:"config_files"`
	WorkingDir   string `json:"working_dir"`
	ConfigExists bool   `json:"configExists"`
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

		composeData := getComposeData(container.Labels)

		if composeData.ConfigFiles != "" {
			if _, err := os.Stat(composeData.WorkingDir + "/" + composeData.ConfigFiles); err == nil {
				composeData.ConfigExists = true
			}
		}

		result[i] = Container{
			ID:              container.ID,
			Name:            name,
			ImageName:       imageName,
			UpdateAvailable: (container.ImageID != iIns.ID),
			//Labels:    container.Labels,
			State:  container.State,
			Status: container.Status,
			//Ports:     container.Ports,
			ComposeData: composeData,
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

// StartContainer starts the container
func (s *DockerService) StartContainer(containerID string) bool {
	err := s.client.ContainerStart(context.Background(), containerID, types.ContainerStartOptions{})
	if err != nil {
		logger.Println(err)
		return false
	}
	return true
}

// StopContainer stops the container
func (s *DockerService) StopContainer(containerID string) bool {
	err := s.client.ContainerStop(context.Background(), containerID, nil)
	if err != nil {
		logger.Println(err)
		return false
	}
	return true
}

// UpdateContainer updates the container with the latest image
func (s *DockerService) UpdateContainer(containerID string, c chan string) {
	cIns, err := s.client.ContainerInspect(context.Background(), containerID)
	if err != nil {
		c <- "Error!"
		panic(err)
	}
	composeData := getComposeData(cIns.Config.Labels)

	var composeFile string
	if strings.HasPrefix(composeData.ConfigFiles, composeData.WorkingDir) {
		composeFile = composeData.ConfigFiles
	} else {
		composeFile = fmt.Sprintf("%s/%s", composeData.WorkingDir, composeData.ConfigFiles)
	}

	c <- fmt.Sprintf("Stopping service %s... ", composeData.Service)

	// docker-compose -f docker-compose.yml -f docker-compose.admin.yml run backup_db
	runCommand(DockerComposePath, "-f", composeFile, "stop", composeData.Service)

	c <- fmt.Sprintf("done.,\nRemoving service %s... ", composeData.Service)
	time.Sleep(2 * time.Second)
	//runCommand(DockerComposePath, "-f", composeFile, "rm", "-f", composeData.Service)

	c <- fmt.Sprintf("done.,\nStarting service %s with the latest image... ", composeData.Service)
	time.Sleep(2 * time.Second)
	//runCommand(DockerComposePath, "-f", composeFile, "up", "-d", composeData.Service)
	runCommand(DockerComposePath, "-f", composeFile, "start", composeData.Service)
	c <- "done."
}

func runCommand(name string, arg ...string) {
	cmd := exec.Command(name, arg...)
	stdout, err := cmd.Output()

	if err != nil {
		panic(err.Error())
	}

	logger.Println(string(stdout))
}

func getComposeData(labels map[string]string) ComposeData {
	var composeData ComposeData
	for label, labelVal := range labels {
		switch label {
		case "com.docker.compose.service":
			composeData.Service = labelVal
		case "com.docker.compose.project":
			composeData.Project = labelVal
		case "com.docker.compose.project.config_files":
			composeData.ConfigFiles = labelVal
		case "com.docker.compose.project.working_dir":
			composeData.WorkingDir = labelVal
		}
	}
	return composeData
}
