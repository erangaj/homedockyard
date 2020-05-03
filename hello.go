package main

import (
	"context"
	"fmt"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
)

func main2() {
	cli, err := client.NewEnvClient()
	if err != nil {
		panic(err)
	}

	containers, err := cli.ContainerList(context.Background(), types.ContainerListOptions{})
	if err != nil {
		panic(err)
	}

	for _, container := range containers {
		fmt.Printf("%s %s\n", container.ID[:10], container.Image)
	}

	cli.ContainerStop(context.Background(), "b8028701b1", nil)
	cli.ContainerStart(context.Background(), "b8028701b1", types.ContainerStartOptions{})

	op := types.ImageSearchOptions{Limit: 10}
	res, _ := cli.ImageSearch(context.Background(), "containous/whoami", op)

	fmt.Println(res)

	cli.Close()
}
