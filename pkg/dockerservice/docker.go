package dockerservice

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/erangaj/homedockyard/internal/configservice"
)

const dockerComposePath = "/usr/local/bin/docker-compose"

// DockerService contains the Docker API client code
type DockerService struct {
	ImagePullRunning bool
	client           *client.Client
	ID               int
	Name             string
	IsLocal          bool
	URL              string
	PathMappings     []configservice.PathMapping
}

var logger = log.New(os.Stderr, "", log.LstdFlags)
var webClient = &http.Client{Timeout: 10 * time.Second}
var imageUpdates map[string]bool

// Container represents a single container
type Container struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	ImageID         string `json:"imageID"`
	ImageName       string `json:"imageName"`
	UpdateAvailable bool   `json:"updateAvailable"`
	//Ports     []types.Port
	//Labels    map[string]string
	State       string      `json:"state"`
	Status      string      `json:"status"`
	Icon        string      `json:"icon"`
	ComposeData ComposeData `json:"composeData"`
	InstanceID  int         `json:"instanceID"`
}

// ComposeData holds values of docker-compose labels
type ComposeData struct {
	Service     string `json:"service"`
	Project     string `json:"project"`
	ConfigFiles string `json:"config_files"`
	//WorkingDir   string `json:"working_dir"`
	ConfigExists bool `json:"configExists"`
}

// InitLocal Initiates Docker connection
func (s *DockerService) InitLocal() {
	cli, err := client.NewEnvClient()
	s.client = cli
	if err != nil {
		panic(err)
	}
}

// Init Initiates Docker connection
func (s *DockerService) Init() {
	imageUpdates = make(map[string]bool)
	if s.IsLocal {
		s.InitLocal()
	} else {
		cli, err := client.NewClient(s.URL, "", nil, nil)
		s.client = cli
		if err != nil {
			panic(err)
		}
	}
}

// Containers returns all containers
func (s *DockerService) Containers() []Container {
	containers, err := s.client.ContainerList(context.Background(), types.ContainerListOptions{All: true})
	result := make([]Container, len(containers))
	if err != nil {
		//panic(err)
		log.Printf(err.Error())
		return result
	}

	for i, container := range containers {
		cIns, err := s.client.ContainerInspect(context.Background(), container.ID)
		if err != nil {
			log.Printf(err.Error())
			continue
		}

		var name string
		if len(container.Names) > 0 {
			name = container.Names[0]
			name = strings.Trim(name, "/")
		}

		imageName := cIns.Config.Image

		composeData := s.getComposeData(container.Labels)

		if composeData.ConfigFiles != "" {
			if _, err := os.Stat(composeData.ConfigFiles); err == nil {
				composeData.ConfigExists = true
			}
		}

		result[i] = Container{
			ID:              container.ID,
			Name:            name,
			ImageName:       imageName,
			ImageID:         container.ImageID,
			UpdateAvailable: imageUpdates[container.ID],
			//Labels:    container.Labels,
			State:  container.State,
			Status: container.Status,
			//Ports:     container.Ports,
			ComposeData: composeData,
			InstanceID:  s.ID,
		}
	}

	return result
}

// StartCheckForUpdates starts pulling latest images from the registries
func (s *DockerService) StartCheckForUpdates() string {
	if !s.ImagePullRunning {
		go s.checkForUpdates()
		return "started"
	}
	return "already running"
}

// Close closes Docker connection
func (s *DockerService) Close() {
	s.client.Close()
}

/*func (s *DockerService) pullImages() {
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
}*/

// StartContainer starts the container
func (s *DockerService) StartContainer(containerID string) bool {
	err := s.client.ContainerStart(context.Background(), containerID, types.ContainerStartOptions{})
	if err != nil {
		logger.Println(err)
		return false
	}
	return true
}

// RestartContainer starts the container
func (s *DockerService) RestartContainer(containerID string) bool {
	err := s.client.ContainerRestart(context.Background(), containerID, nil)
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
	composeData := s.getComposeData(cIns.Config.Labels)

	composeFile := composeData.ConfigFiles

	c <- fmt.Sprintf("Stopping service %s... ", composeData.Service)

	// docker-compose -f docker-compose.yml -f docker-compose.admin.yml run backup_db
	s.runCommand(dockerComposePath, "-f", composeFile, "stop", composeData.Service)

	c <- fmt.Sprintf("done.,\nRemoving service %s... ", composeData.Service)
	time.Sleep(2 * time.Second)
	s.runCommand(dockerComposePath, "-f", composeFile, "rm", "-f", composeData.Service)

	c <- fmt.Sprintf("done.,\nStarting service %s with the latest image... ", composeData.Service)
	time.Sleep(2 * time.Second)
	s.runCommand(dockerComposePath, "-f", composeFile, "up", "-d", composeData.Service)
	//runCommand(dockerComposePath, "-f", composeFile, "start", composeData.Service)
	c <- "done.\nSuccess!"
}

func (s *DockerService) runCommand(name string, arg ...string) {
	cmd := exec.Command(name, arg...)

	if !s.IsLocal {
		cmd.Env = os.Environ()
		cmd.Env = append(cmd.Env, fmt.Sprintf("DOCKER_HOST=%s", s.URL))
	}

	stdout, err := cmd.Output()

	if err != nil {
		panic(err.Error())
	}

	logger.Println(string(stdout))
}

func (s *DockerService) getComposeData(labels map[string]string) ComposeData {
	var composeData ComposeData
	workingDir := ""
	for label, labelVal := range labels {
		switch label {
		case "com.docker.compose.service":
			composeData.Service = labelVal
		case "com.docker.compose.project":
			composeData.Project = labelVal
		case "com.docker.compose.project.config_files":
			composeData.ConfigFiles = labelVal
		case "com.docker.compose.project.working_dir":
			workingDir = labelVal
		}
	}

	if !strings.HasPrefix(composeData.ConfigFiles, workingDir) {
		composeData.ConfigFiles = fmt.Sprintf("%s/%s", workingDir, composeData.ConfigFiles)
	}

	if s.PathMappings != nil {
		for _, m := range s.PathMappings {
			if strings.HasPrefix(composeData.ConfigFiles, m.From) {
				composeData.ConfigFiles = strings.Replace(composeData.ConfigFiles, m.From, m.To, 1)
			}
		}
	}
	return composeData
}

// checkForUpdates checks for updates
func (s *DockerService) checkForUpdates() {

	info, err := s.client.Info(context.Background())
	if err != nil {
		logger.Println(err)
		return
	}

	var arch string
	var variant string
	os := info.OSType

	infoarch := info.Architecture
	if infoarch == "x86_64" {
		arch = "amd64"
		variant = ""
	} else if strings.HasPrefix(infoarch, "armv7") {
		arch = "arm"
		variant = "v7"
	} else if strings.HasPrefix(infoarch, "armv6") {
		arch = "arm"
		variant = "v6"
	} else {
		arch = infoarch
		variant = ""
	}

	containers := s.Containers()
	for _, c := range containers {
		image := c.ImageName

		iIns, _, err := s.client.ImageInspectWithRaw(context.Background(), image)
		if err != nil {
			logger.Println(err)
			continue
		}

		if len(iIns.RepoDigests) == 0 {
			continue
		}

		version := ""
		if strings.Contains(image, ":") {
			split := strings.Split(image, ":")
			image = split[0]
			version = split[1]
		}

		if strings.Contains(image, "/") {
			image = "https://hub.docker.com/v2/repositories/" + image
		} else {
			image = "https://hub.docker.com/v2/repositories/library/" + image
		}

		image = image + "/tags/" + version

		r, err := webClient.Get(image)
		if err != nil {
			logger.Println(err)
			continue
		}
		defer r.Body.Close()

		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			logger.Println(err)
			continue
		}

		var objmap map[string]interface{}
		err = json.Unmarshal([]byte(string(body)), &objmap)
		if err != nil {
			logger.Println(err)
			continue
		}

		m := objmap["results"]

		if m != nil {
			results := m.([]interface{})
			result := results[0].(map[string]interface{})
			images := result["images"].([]interface{})

			for _, im := range images {
				image := im.(map[string]interface{})
				if image["architecture"] != arch {
					continue
				}

				if image["os"] != os {
					continue
				}

				imageVariant := image["variant"]
				if (variant != "" || imageVariant != nil) && (variant != imageVariant) {
					continue
				}

				digest := image["digest"].(string)
				imageUpdates[c.ID] = !strings.Contains(iIns.RepoDigests[0], digest)
			}
		}

	}
}
