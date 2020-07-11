#### HomeDockyard

HomeDockyard is a small web app for monitoring Docker containers from multiple hosts. As the name suggests, HomeDockyard is targeted for home users who run docker containers on their home servers. This project aims to create a docker based web app similar to Home Assistant Supervisor screen, but for generic docker containers.

##### Features

* Start/Stop containers
* Show updates available
* Update from UI
  * To enable this feature the docker-compose YAML files must be accessible to the HomeDockyard process. If you are running HomeDockyard in a docker container, you may mount the root directories(s) of you docker-compose files as volume(s) to the container to give access the docker-compose files.

Example:
`docker run -v /docker/compose/files:/docker/compose/files -v /more/docker/compose/files:/more/docker/compose/files -v /var/run/docker.sock:/var/run/docker.sock erangaj/homedockyard`

HomeDockyard is not an alternative for full-featured Docker monitoring apps such as Portainer. Instead, HomeDockyard companion app which provides a graphical interface for basic container operations and upgrade notifications.

It is still in alpha stage and you are invited to try it at your own risk.

##### Installation

Following command runs HomeDockyard with defaults settings. If you want to monitor multiple docker hosts, refer to the "Configuration" section below.

`docker run -p 49080:9080 -p -v /var/run/docker.sock:/var/run/docker.sock -v /docker/compose/files:/docker/compose/files --name homedockyard erangaj/homedockyard`

###### Docker Compose

```yaml
version: '3.3'
services:
    homedockyard:
        ports:
            - '49080:9080'
            - true
        volumes:
            - '/var/run/docker.sock:/var/run/docker.sock'
            - '/docker/compose/files:/docker/compose/files' # Required to update containers from UI
        container_name: homedockyard
        image: erangaj/homedockyard
```

###### Configuration

A configuration file is required to configure HomeDockyard to monitor multiple Docker hosts. At startup HomeDockyard looks for a configuration file in the following locations:

* /config/config.yaml
* ~/.homedockyard/config.yaml
* /etc/homedockyard/config.yaml

config.yaml lists the Docker endpoints. Endpoint definition consists of the below items:
* name **Required** Name of the endpoint
* type **Required** Local or Remote (Local: HomeDockyard must have access to the /var/run/docker.sock. Remote: connects to a remote Docker host via [TCP socket](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-socket-option))
* URL **Required for Remote connections** TCP URL to the remote Docker host
* pathMappings **Optional** One or more mappings to convert Docker Compose YAML file locations to the actual files accessible to HomeDockyard. Use these mappings to map the file paths if the original Docker Compose file names (Stored as docker container labels) are not accessible to HomeDockyard.

config.yaml example:

```yaml
endpoints:
  - name: Local
    type: Local
  - name: Server2
    type: Remote
    URL: tcp://10.20.30.40:2376
    pathMappings:
      - from: /docker/compose/files
        to: /docker/compose/files/server2
  - name: AWS
    type: Remote
    URL: tcp://aws.domain.net:2376
```

**Docker installation with config file**

if config.yaml is located at /docker/config/homedockyard/config.yaml

`docker run -p 49080:9080 -p -v /docker/config/homedockyard:/config -v /var/run/docker.sock:/var/run/docker.sock -v /docker/compose/files:/docker/compose/files --name homedockyard erangaj/homedockyard`

or use docker-compose

```yaml
version: '3.3'
services:
    homedockyard:
        ports:
            - '49080:9080'
            - true
        volumes:
            - '/docker/config/homedockyard:/config'
            - '/var/run/docker.sock:/var/run/docker.sock'
            - '/docker/compose/files:/docker/compose/files'
            - '/docker/compose/filesForServer2:/docker/compose/files/server2'
        container_name: homedockyard
        image: erangaj/homedockyard
```