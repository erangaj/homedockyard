package server

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/erangaj/homedockyard/pkg/dockerservice"
	"github.com/gorilla/mux"
)

const (
	defaultIcon = "default.svg"
)

var (
	icons map[string]string
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
	router.Use(commonMiddleware)

	router.PathPrefix("/api/containers").HandlerFunc(rs.containers).Methods("GET")
	router.PathPrefix("/api/pullimages").HandlerFunc(rs.pullimages).Methods("GET")
	// router.PathPrefix("/{dir}/{path}").HandlerFunc(rs.staticFile).Methods("GET")
	// router.PathPrefix("/{path}").HandlerFunc(rs.staticFile).Methods("GET")
	router.PathPrefix("/").HandlerFunc(rs.staticFile).Methods("GET")
	log.Fatal(http.ListenAndServe(":9080", router))

	ds.Close()
}

func commonMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.RequestURI, ".css") {
			w.Header().Add("Content-Type", "text/css; charset=utf-8")
		} else if strings.HasSuffix(r.RequestURI, ".js") {
			w.Header().Add("Content-Type", "application/javascript; charset=UTF-8")
		} else if strings.HasSuffix(r.RequestURI, ".jsx") {
			w.Header().Add("Content-Type", "application/javascript; charset=UTF-8")
		} else if strings.HasSuffix(r.RequestURI, ".html") {
			w.Header().Add("Content-Type", "apptext/html; charset=utf-8")
		} else if strings.HasSuffix(r.RequestURI, ".json") {
			w.Header().Add("Content-Type", "application/json; charset=UTF-8")
		} else if strings.HasPrefix(r.RequestURI, "/api") {
			w.Header().Add("Content-Type", "application/json; charset=UTF-8")
		}
		next.ServeHTTP(w, r)
	})
}

func (rs *restService) containers(w http.ResponseWriter, r *http.Request) {
	ds := rs.ds
	cs := ds.Containers()

	cs = updateIcon(cs)

	if err := json.NewEncoder(w).Encode(cs); err != nil {
		panic(err)
	}
}

func (rs *restService) pullimages(w http.ResponseWriter, r *http.Request) {
	ds := rs.ds
	res := ds.StartImagePull()
	fmt.Fprintf(w, res)
}

func (rs *restService) staticFile(w http.ResponseWriter, r *http.Request) { //TODO: use br.Serve
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

func updateIcon(cs []dockerservice.Container) []dockerservice.Container {
	if icons == nil {
		dir, _ := br.Open("/web/build/icons")
		files, _ := dir.Readdir(0)
		icons = make(map[string]string, len(files))
		for _, file := range files {
			filename := file.Name()
			icons[strings.ToLower(strings.Split(filename, ".")[0])] = filename
		}
	}

	newcs := make([]dockerservice.Container, len(cs))
	for i, c := range cs {
		imageNameParts := strings.Split(c.ImageName, ":")
		imageNameParts = strings.Split(imageNameParts[0], "/")
		if len(imageNameParts) > 1 {
			if f, ok := icons[strings.ToLower(c.Name)]; ok {
				c.Icon = f
			} else if f, ok := icons[imageNameParts[0]+"___"+imageNameParts[1]]; ok {
				c.Icon = f
			} else if f, ok := icons[imageNameParts[1]]; ok {
				c.Icon = f
			} else {
				c.Icon = defaultIcon
			}
		} else {
			if f, ok := icons[imageNameParts[0]]; ok {
				c.Icon = f
			} else {
				c.Icon = defaultIcon
			}
		}
		newcs[i] = c
	}
	return newcs
}
