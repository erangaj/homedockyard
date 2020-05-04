package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	dockerservice "github.com/erangaj/HomeDockyard/dockerservice"

	"github.com/gorilla/mux"
)

type restService struct {
	ds *dockerservice.DockerService
}

func main() {
	ds := dockerservice.DockerService{}
	rs := restService{ds: &ds}

	ds.Init()

	router := mux.NewRouter()
	router.PathPrefix("/api/containers").HandlerFunc(rs.containers).Methods("GET")
	router.PathPrefix("/api/pullimages").HandlerFunc(rs.pullimages).Methods("GET")
	router.PathPrefix("/").Handler(http.FileServer(http.Dir("./web/")))
	log.Fatal(http.ListenAndServe(":9080", router))

	ds.Close()
}

func homeLink(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Welcome home!")
}

func (rs *restService) containers(w http.ResponseWriter, r *http.Request) {
	ds := rs.ds
	cs := ds.Containers()

	if err := json.NewEncoder(w).Encode(cs); err != nil {
		panic(err)
	}
}

func (rs *restService) pullimages(w http.ResponseWriter, r *http.Request) {
	ds := rs.ds
	res := ds.StartImagePull()
	fmt.Fprintf(w, res)
}
