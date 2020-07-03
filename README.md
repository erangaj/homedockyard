#### HomeDockyard

cc is a small web app for monitoring Docker containers. As the name suggests, HomeDockyard is targeted for home users who run docker containers on their home servers. This project aims to create a docker based web app similar to Home Assistant Supervisor screen, but for generic docker containers.

##### Features

* Start/Stop containers
* Show updates available
* Update from UI
  * To enable this feature the docker-compose YAML files must be accessible to the HomeDockyard process. If you are running HomeDockyard in a docker container, you may mount the root directories(s) of you docker-compose files as volume(s) to the container to give access the docker-compose files.

Example:
`docker run -v /docker/compose/files:/docker/compose/files -v /more/docker/compose/files:/more/docker/compose/files -v /var/run/docker.sock:/var/run/docker.sock erangaj/homedockyard`

##### Planned

* Store and manage docker-compose files
* Support for multiple docker hosts

HomeDockyard is not an alternative for full-featured docker monitoring apps such as Portainer. Instead, HomeDockyard companion app which provides a graphical interface for basic container operations and upgrade notifications.

It is still in alpha stage and you are invited to try it at your own risk.

##### Installation

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
