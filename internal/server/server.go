package server

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/erangaj/homedockyard/pkg/dockerservice"
	"github.com/gorilla/mux"
)

type restService struct {
	ds *dockerservice.DockerService
}

//go:generate broccoli -src ../../web/public -o public

// Serv starts the HTTP server
func Serv() {
	ds := dockerservice.DockerService{}
	rs := restService{ds: &ds}

	ds.Init()

	router := mux.NewRouter()
	router.PathPrefix("/api/containers").HandlerFunc(rs.containers).Methods("GET")
	router.PathPrefix("/api/pullimages").HandlerFunc(rs.pullimages).Methods("GET")
	router.PathPrefix("/{dir}/{path}").HandlerFunc(staticFile).Methods("GET")
	router.PathPrefix("/{path}").HandlerFunc(staticFile).Methods("GET")
	router.PathPrefix("/").HandlerFunc(staticFile).Methods("GET")
	log.Fatal(http.ListenAndServe(":9080", router))

	ds.Close()
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

func staticFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	var filepath string
	if dir, ok := vars["dir"]; ok {
		filepath = "/" + dir
	}
	if path, ok := vars["path"]; ok {
		filepath += "/" + path
	}
	if filepath == "" {
		filepath = "/index.html"
	}

	hasError := false

	f, err := br.Open("/web/public" + filepath)

	if err != nil {
		log.Printf("Unable to open %v: %v", filepath, err)
		f, _ = br.Open("/web/public/404.html")
		w.WriteHeader(http.StatusNotFound)
		hasError = true
	}

	b, err := ioutil.ReadAll(f)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		hasError = true
		log.Fatalf("Unable to read %v: %v", filepath, err)
	}
	if !hasError {
		w.WriteHeader(http.StatusOK)
	}
	w.Write(b)
}
