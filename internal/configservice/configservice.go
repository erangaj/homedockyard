package configservice

import (
	"io/ioutil"
	"log"
	"os"

	"gopkg.in/yaml.v3"
)

// Endpoint represents the docker endpoint
type Endpoint struct {
	Name         string        `yaml:"name"`
	Type         string        `yaml:"type"`
	URL          string        `yaml:"URL"`
	PathMappings []PathMapping `yaml:"pathMappings"`
}

// PathMapping represent mapping of docker compose file paths
type PathMapping struct {
	From string `yaml:"from"`
	To   string `yaml:"to"`
}

// Config represents the config file
type Config struct {
	Endpoints []Endpoint `yaml:"endpoints"`
}

var logger = log.New(os.Stderr, "", log.LstdFlags)

// Read function reads the config file
func Read() *Config {
	filename := "/homedockyard/config.yaml"
	_, err := os.Stat(filename)
	if os.IsNotExist(err) {
		home, _ := os.UserHomeDir()
		filename = home + "/.homedockyard/config.yaml"
		_, err = os.Stat(filename)
		if os.IsNotExist(err) {
			filename = home + "/etc/homedockyard/config.yaml"
			_, err = os.Stat(filename)
			if os.IsNotExist(err) {
				filename = "config.yaml"
				_, err = os.Stat(filename)
				if os.IsNotExist(err) {
					logger.Println("No config file found. Generating local config...")
					local := Config{nil}
					return &local
				}
			}
		}
	}

	yamlFile, err := ioutil.ReadFile(filename)

	var config Config
	err = yaml.Unmarshal(yamlFile, &config)
	if err != nil {
		logger.Printf("Error parsing YAML file: %s\n", err)
		panic(err)
	}
	return &config
}
