import React, { Component } from 'react';
import './App.css';
import { AppBar, Tabs, Tab, Box, Button, Drawer, Badge } from '@material-ui/core';
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
    padding: theme.spacing(0),
    marginLeft: theme.spacing(25)
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
    this.restartContainer = this.restartContainer.bind(this);
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
      case 'RESTART_CONTAINER': this.restartContainer(this.props.onConfirmParam); break;
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
 
  restartContainer(c) {
    let this_ = this;
    this.props.setContainerLoading(c.id);
    fetch('/api/restartcontainer', {
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

  a11yProps = index => {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }
 
  render() {
    const { classes, updateCount, endpoints, selectEndpoint, currentEndpoint } = this.props;
    return (
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <Drawer anchor='left' variant="permanent" open={this.state.drawerOpen}>
            <List>
              <ListItem button key='HomeDockyard'  onClick={this.toggleDrawer}>
                <ListItemIcon><MenuIcon /></ListItemIcon>
                <ListItemText primary='HomeDockyard' />
              </ListItem>
              <ListItem button key='Containers' onClick={() => {}} >
                  <ListItemIcon><Icon path={mdiDocker} title="Docker Connection" size={1} /></ListItemIcon>
                  <ListItemText primary='Containers' />
                </ListItem>
              </List>
          </Drawer>
          <Box theme={darkTheme} className={classes.box} >
            <AppBar position="static">
              <Tabs value={currentEndpoint ? currentEndpoint : null} onChange={(event, newEp) => selectEndpoint(newEp)} aria-label="simple tabs example" variant="scrollable" scrollButtons="on">
                { endpoints.map((ep) => {
                  let updates = updateCount[ep.instanceID.toString()];
                  if (!updates) {
                    return (
                      <Tab label={ <span>{ ep.id }</span> } value = {ep} {...this.a11yProps(0)} />
                    )
                  }
                  return (
                    <Tab label={ <span>{ ep.id } <Badge  badgeContent={updates} color="secondary"><UpdateIcon title={"" + updates + " Updates Available"} /></Badge></span> } value = {ep} {...this.a11yProps(0)} />
                  )
                })}
              </Tabs>
            </AppBar>
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
      let updateCount = {};
      containers.map(container => {
        if (container.updateAvailable) {
          if (updateCount[container.instanceID]) {
            updateCount[container.instanceID.toString()] = updateCount[container.instanceID.toString()] + 1;
          } else {
            updateCount[container.instanceID.toString()] = 1;
          }
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
