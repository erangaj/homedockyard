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
	"time"

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
	dss  *[]dockerservice.DockerService
	prod bool
}

type idJSON struct {
	ID         string `json:"id"`
	InstanceID int    `json:"instanceID"`
}

//go:generate yarn --cwd ../../web build
//go:generate broccoli -src ../../web/build -o public

// Serv starts the HTTP server
func Serv(dss *[]dockerservice.DockerService, prod bool) {
	rs := restService{dss: dss, prod: prod}

	router := mux.NewRouter()
	router.Use(commonMiddleware)

	router.PathPrefix("/api/instances").HandlerFunc(rs.instances).Methods("GET")
	router.PathPrefix("/api/containers").HandlerFunc(rs.containers).Methods("GET")
	// router.PathPrefix("/api/pullimages").HandlerFunc(rs.pullimages).Methods("GET")
	router.PathPrefix("/api/startcontainer").HandlerFunc(rs.startcontainer).Methods("POST")
	router.PathPrefix("/api/restartcontainer").HandlerFunc(rs.restartcontainer).Methods("POST")
	router.PathPrefix("/api/stopcontainer").HandlerFunc(rs.stopcontainer).Methods("POST")
	router.PathPrefix("/api/updatecontainer").HandlerFunc(rs.updatecontainer).Methods("POST")
	// router.PathPrefix("/{dir}/{path}").HandlerFunc(rs.staticFile).Methods("GET")
	// router.PathPrefix("/{path}").HandlerFunc(rs.staticFile).Methods("GET")
	router.PathPrefix("/").HandlerFunc(rs.staticFile).Methods("GET")
	log.Fatal(http.ListenAndServe(":9080", router))

	for _, ds := range *dss {
		ds.Close()
	}
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
		} else if strings.HasSuffix(r.RequestURI, ".svg") {
			w.Header().Add("Content-Type", "image/svg+xml")
		} else if strings.HasSuffix(r.RequestURI, ".json") {
			w.Header().Add("Content-Type", "application/json; charset=UTF-8")
		} else if strings.HasPrefix(r.RequestURI, "/api") {
			w.Header().Add("Content-Type", "application/json; charset=UTF-8")
		}
		next.ServeHTTP(w, r)
	})
}

func (rs *restService) instances(w http.ResponseWriter, r *http.Request) {
	ins := make([]idJSON, 0)
	for _, ds := range *rs.dss {
		it := idJSON{InstanceID: ds.ID, ID: ds.Name}
		ins = append(ins, it)
	}
	if err := json.NewEncoder(w).Encode(ins); err != nil {
		panic(err)
	}
}

func (rs *restService) containers(w http.ResponseWriter, r *http.Request) {
	cs := make([]dockerservice.Container, 0)
	for _, ds := range *rs.dss {
		cs = append(cs, ds.Containers()...)
	}

	cs = updateIcon(cs)

	if err := json.NewEncoder(w).Encode(cs); err != nil {
		panic(err)
	}
}

/*func (rs *restService) pullimages(w http.ResponseWriter, r *http.Request) {
	ds := rs.ds
	res := ds.StartImagePull()
	fmt.Fprintf(w, res)
}*/

func (rs *restService) startcontainer(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var idjson idJSON
	err := decoder.Decode(&idjson)
	if err != nil {
		panic(err)
	}
	dss := *rs.dss
	dss[idjson.InstanceID].StartContainer(idjson.ID)
	fmt.Fprint(w, "{\"result\":\"success\"}")
}

func (rs *restService) restartcontainer(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var idjson idJSON
	err := decoder.Decode(&idjson)
	if err != nil {
		panic(err)
	}
	dss := *rs.dss
	dss[idjson.InstanceID].RestartContainer(idjson.ID)
	fmt.Fprint(w, "{\"result\":\"success\"}")
}

func (rs *restService) stopcontainer(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var idjson idJSON
	err := decoder.Decode(&idjson)
	if err != nil {
		panic(err)
	}
	dss := *rs.dss
	dss[idjson.InstanceID].StopContainer(idjson.ID)
	fmt.Fprint(w, "{\"result\":\"success\"}")
}

func (rs *restService) updatecontainer(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var idjson idJSON
	err := decoder.Decode(&idjson)
	if err != nil {
		panic(err)
	}

	c := make(chan string, 4)
	dss := *rs.dss
	go dss[idjson.InstanceID].UpdateContainer(idjson.ID, c)

Loop:
	for i := 0; i < 4; i++ {
		select {
		case msg := <-c:
			if msg == "Error" {
				fmt.Fprint(w, "Error: Operation Failed.")
				w.(http.Flusher).Flush()
				break Loop
			} else {
				fmt.Fprint(w, msg)
				w.(http.Flusher).Flush()
			}
		case <-time.After(60 * time.Second):
			fmt.Fprint(w, "Error: Operation Timed Out.")
			w.(http.Flusher).Flush()
		}
	}
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
		//dir, _ := os.Open("../../web/build/icons")
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
		if len(imageNameParts) == 2 && ((imageNameParts[0] == "hassioaddons") || (imageNameParts[0] == "homeassistant" && strings.Contains(imageNameParts[1], "addon"))) {
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "-amd64", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "amd64-", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "-armv7", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "armv7-", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "-armhf", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "armhf-", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "-i386", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "i386-", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "-aarch64", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "aarch64-", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "-addon", "")
			imageNameParts[1] = strings.ReplaceAll(imageNameParts[1], "addon-", "")
		}
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
