package server

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/erangaj/homedockyard/pkg/dockerservice"
	"github.com/gorilla/mux"
)

type restService struct {
	ds   *dockerservice.DockerService
	prod bool
}

//go:generate broccoli -src ../../web/build -o public

// Serv starts the HTTP server
func Serv(prod bool) {
	ds := dockerservice.DockerService{}
	rs := restService{ds: &ds, prod: prod}

	ds.Init()

	router := mux.NewRouter()
	router.PathPrefix("/api/containers").HandlerFunc(rs.containers).Methods("GET")
	router.PathPrefix("/api/pullimages").HandlerFunc(rs.pullimages).Methods("GET")
	// router.PathPrefix("/{dir}/{path}").HandlerFunc(rs.staticFile).Methods("GET")
	// router.PathPrefix("/{path}").HandlerFunc(rs.staticFile).Methods("GET")
	router.PathPrefix("/").HandlerFunc(rs.staticFile).Methods("GET")
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

func (rs *restService) staticFile(w http.ResponseWriter, r *http.Request) {
	var filepath string = r.RequestURI
	if filepath == "/" {
		filepath = "/index.html"
	}

	hasError := false

	f, err := openFile(filepath, rs.prod)

	if err != nil {
		log.Printf("Unable to open %v: %v", filepath, err)
		f, _ = openFile("/404.html", rs.prod)
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

func openFile(filepath string, prod bool) (io.Reader, error) {
	if prod {
		return br.Open("/web/build" + filepath)
	}
	return os.Open("../../web/build/" + filepath)
}
