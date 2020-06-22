import React, { Component } from 'react';
import './App.css';
import { Box, Button, Drawer, Badge } from '@material-ui/core';
import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { createMuiTheme, ThemeProvider, withStyles } from '@material-ui/core/styles';
import ContainerGrid from './components/container-grid/container-grid.component'
import { ConfirmDialog } from './components/util/confirm-dialog.component'
import { InfoDialog } from './components/util/info-dialog.component'
import CssBaseline from '@material-ui/core/CssBaseline';
import UpdateIcon from '@material-ui/icons/Update';
import MenuIcon from '@material-ui/icons/Menu';
import { setContainersAndUpdateCount, setContainerLoading } from './redux/containers/containers.actions';
import { connect } from 'react-redux';
import { setConfirmDialog } from './redux/confirmdialog/confirmdialog.actions';
import { setEndpoints, selectEndpoint } from './redux/endpoints/endpoints.actions';
import Icon from '@mdi/react'
import { mdiDocker } from '@mdi/js'

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

const useStyles = theme => ({
  root: {
    flexGrow: 1,
  },
  box: {
    padding: theme.spacing(2),
    marginLeft: theme.spacing(35)
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
});

class App extends Component {
  intervalID;
  quickRefreshCount = 0;
  
  constructor() {
    super();
    this.state = {drawerOpen: false, showInfoDialog: false, infoDialogText:"", infoDialogCompleted: 0, infoDialogError: false};
    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.startContainer = this.startContainer.bind(this);
    this.stopContainer = this.stopContainer.bind(this);
    this.closeConfirmDialog = this.closeConfirmDialog.bind(this);
    this.onConfirmDialogYes = this.onConfirmDialogYes.bind(this);
  }

  toggleDrawer() {
    this.setState(state => ({
      drawerOpen: !state.drawerOpen
    }));
  }

  componentDidMount() {
    this.fetchEndpoints();
    this.fetchContainers();
    this.intervalID = setInterval(this.fetchContainers.bind(this), 60000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);

  }

  fetchEndpoints = () => {
    const { fetchEndpoints } = this.props;
    fetchEndpoints();
  }

  fetchContainers() {
    const { fetchContainers } = this.props;
    fetchContainers();
  }

  quickRefresh() {
    if (this.quickRefreshCount<5) {
      this.quickRefreshCount++;
      this.fetchContainers.bind(this);
      this.fetchContainers();
    } else {
      clearInterval(this.intervalID);
      this.intervalID = setInterval(this.fetchContainers.bind(this), 60000);
    }
  }

  closeConfirmDialog() {
    this.props.setConfirmDialog(false, null, null, null)
  }

  closeInfoDialog = () => this.setState({showInfoDialog: false, infoDialogText:"", infoDialogCompleted: 0, infoDialogError: false});

  onConfirmDialogYes() {
    switch(this.props.onConfirm) {
      case 'START_CONTAINER': this.startContainer(this.props.onConfirmParam); break;
      case 'STOP_CONTAINER': this.stopContainer(this.props.onConfirmParam); break;
      case 'UPDATE_CONTAINER': this.updateContainer(this.props.onConfirmParam); break;
      default: break;
    }
    this.props.setConfirmDialog(false, null, null, null);
  }

  startContainer(c) {
    let this_ = this;
    this.props.setContainerLoading(c.id);
    fetch('/api/startcontainer', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        id: c.id,
        instanceID: c.instanceID
      })
    })
    .then(response => response.json())
    .then(result => {
      clearInterval(this_.intervalID);
      this_.quickRefreshCount = 0;
      this_.intervalID = setInterval(this.quickRefresh.bind(this), 10000);
    });
  }
 
  stopContainer(c) {
    let this_ = this;
    console.log(c.instanceID)
    this.props.setContainerLoading(c.id);
    fetch('/api/stopcontainer', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        id: c.id,
        instanceID: c.instanceID
      })
    })
    .then(response => response.json())
    .then(result => {
      clearInterval(this_.intervalID);
      this_.quickRefreshCount = 0;
      this_.intervalID = setInterval(this.quickRefresh.bind(this), 10000);
    });
  }

  updateContainer = c => {
    this.props.setContainerLoading(c.id);
    let status = "";
    let completed = 0;
    let this_ = this;
    this.setState({showInfoDialog: true, infoDialogText:status, infoDialogCompleted: completed, infoDialogError: false});
    fetch('/api/updatecontainer', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        id: c.id,
        instanceID: c.instanceID
      })
    })
    .then(response => {
      const reader = response.body.getReader();
      reader.read().then(function processText({ done, value }) {
        if (done) {
          if (status.includes("Success!")) {
            status += "\n\nUpgrade Completed!";
            completed = 100;
            this_.setState({infoDialogText:status, infoDialogCompleted: completed, infoDialogError: false});
          } else {
            status += "\n\nUpgrade Failed!";
            completed = 100;
            this_.setState({infoDialogText:status, infoDialogCompleted: completed, infoDialogError: true});
          }
          this_.props.setContainerLoading(c.id);
          clearInterval(this_.intervalID);
          this_.quickRefreshCount = 0;
          this_.intervalID = setInterval(this_.quickRefresh.bind(this_), 10000);
          return;
        }
        var textContent = String.fromCharCode.apply(null, value);
        status += textContent;
        completed += 25;
        this_.setState({infoDialogText:status, infoDialogCompleted: completed, infoDialogError: false});
        return reader.read().then(processText);
      });
    });
  }
 
  render() {
    const { classes, updateCount, endpoints, selectEndpoint } = this.props;
    return (
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <Drawer anchor='left' variant="permanent" open={this.state.drawerOpen}>
            <List>
              <ListItem button key='HomeDockyard'  onClick={this.toggleDrawer}>
                <ListItemIcon><MenuIcon /></ListItemIcon>
                <ListItemText primary='HomeDockyard' />
              </ListItem>
              { endpoints.map((ep) => (
                <ListItem button key={ep.instanceID} onClick={() => selectEndpoint(ep)} >
                  <ListItemIcon><Icon path={mdiDocker} title="Docker Connection" size={1} /></ListItemIcon>
                  <ListItemText primary={ep.id} />
                  <Button color="inherit">
              {
                updateCount ?
                <Badge badgeContent={updateCount} color="secondary">
                  <UpdateIcon title={"" + updateCount + " Updates Available"} />
                </Badge>
                :
                ""
              }
            </Button>
                </ListItem>
              ))}
            </List>

          </Drawer>
          <Box theme={darkTheme} className={classes.box} >
            <Button color="inherit">
              {
                updateCount ?
                <Badge badgeContent={updateCount} color="secondary">
                  <UpdateIcon title={"" + updateCount + " Updates Available"} />
                </Badge>
                :
                ""
              }
            </Button>
            <ContainerGrid />
          </Box>
          <ConfirmDialog open={this.props.showConfirmDialog} text={this.props.confirmDialogText} onClose={this.closeConfirmDialog} onYes={this.onConfirmDialogYes} />
          <InfoDialog open={this.state.showInfoDialog} text={this.state.infoDialogText} title="Upgrading Container" onClose={this.closeInfoDialog} completed={this.state.infoDialogCompleted} error={this.state.infoDialogError} />
        </ThemeProvider>
      );
    }
}

const AppWithStyles = withStyles(useStyles)(App);

const mapDispatchToProps = dispatch => ({
  fetchEndpoints: () => {
    fetch("/api/instances")
    .then(response => response.json())
    .then(endpoints => {
      dispatch(setEndpoints(endpoints));
      if (endpoints.length > 0) {
        dispatch(selectEndpoint(endpoints[0]));
      }
    });
  },
  fetchContainers: () => {
    fetch("/api/containers")
    .then(response => response.json())
    .then(containers => {
      let updateCount = 0;
      containers.map(container => {
        if (container.updateAvailable) {
          updateCount++;
        }
        return 1;
      });
      dispatch(setContainersAndUpdateCount(containers, updateCount));
    });
  },

  setContainerLoading: id => dispatch(setContainerLoading(id)),
  selectEndpoint: endpoint => dispatch(selectEndpoint(endpoint)),
  setConfirmDialog: (showConfirmDialog, onConfirm, onConfirmParam, confirmDialogText) => dispatch(setConfirmDialog(showConfirmDialog, onConfirm, onConfirmParam, confirmDialogText))

});

const mapStateToProps = state => ({
  containers: state.containers.containers,
  updateCount: state.containers.updateCount,
  showConfirmDialog: state.confirmDialog.showConfirmDialog, 
  onConfirm: state.confirmDialog.onConfirm,
  onConfirmParam: state.confirmDialog.onConfirmParam,
  confirmDialogText: state.confirmDialog.confirmDialogText,
  endpoints: state.endpoints.endpoints,
  currentEndpoint: state.endpoints.currentEndpoint
});

export default connect(mapStateToProps, mapDispatchToProps)(AppWithStyles);
