import React, { Component } from 'react';
import './App.css';
import { Box, AppBar, Toolbar, IconButton, Typography, Button, Drawer, Badge } from '@material-ui/core';
import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { createMuiTheme, ThemeProvider, withStyles } from '@material-ui/core/styles';
import { ContainerGrid } from './components/container-grid/container-grid.component'
import { ConfirmDialog } from './components/util/confirm-dialog.component'
import CssBaseline from '@material-ui/core/CssBaseline';
import MenuIcon from '@material-ui/icons/Menu';
import UpdateIcon from '@material-ui/icons/Update';
import MenuOpenIcon from '@material-ui/icons/MenuOpen';

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
    this.state = {containers: [], drawerOpen: false, updateCount: 0, showConfirmDialog: false, onConfirm: null, onConfirmParam: null};
    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.startContainer = this.startContainer.bind(this);
    this.stopContainer = this.stopContainer.bind(this);
    this.startContainerIfConfirmed = this.startContainerIfConfirmed.bind(this);
    this.stopContainerIfConfirmed = this.stopContainerIfConfirmed.bind(this);
    this.showLoading = this.showLoading.bind(this);
    this.closeConfirmDialog = this.closeConfirmDialog.bind(this);
    this.onConfirmDialogYes = this.onConfirmDialogYes.bind(this);
  }

  toggleDrawer() {
    this.setState(state => ({
      drawerOpen: !state.drawerOpen
    }));
  }

  componentDidMount() {
    this.fetchContainers();
    this.intervalID = setInterval(this.fetchContainers.bind(this), 60000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);
  }

  fetchContainers() {
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
      this.setState({containers, updateCount})
    });
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

  showLoading(id) {
      let cs = this.state.containers;
      let newcs = [];
      cs.forEach(c => {
        if (c.id===id) {
          c.loading=true
        }
        newcs.push(c);
      });
      this.setState({containers: newcs})
  }

  closeConfirmDialog() {
    this.setState({showConfirmDialog: false, onConfirm: null, onConfirmParam: null});
  }

  onConfirmDialogYes() {
    this.state.onConfirm(this.state.onConfirmParam);
    this.setState({showConfirmDialog: false, onConfirm: null, onConfirmParam: null});
  }

  startContainerIfConfirmed(container) {
    this.setState({showConfirmDialog: true, onConfirm: this.startContainer, onConfirmParam: container.id, confirmDialogText:'Do you really want to start ' + container.name + '?'});
  }

  stopContainerIfConfirmed(container) {
    this.setState({showConfirmDialog: true, onConfirm: this.stopContainer, onConfirmParam: container.id, confirmDialogText:'Do you really want to stop ' + container.name + '?'});
  }

  startContainer(id) {
    let this_ = this;
    this.showLoading(id);
    //fetch('https://codetest.eranga.org/api/startcontainer', {
    fetch('/api/startcontainer', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        id: id
      })
    })
    .then(response => response.json())
    .then(result => {
      clearInterval(this_.intervalID);
      this_.quickRefreshCount = 0;
      this_.intervalID = setInterval(this.quickRefresh.bind(this), 10000);
    });
  }
 
  stopContainer(id) {
    let this_ = this;
    this.showLoading(id);
    fetch('/api/stopcontainer', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        id: id
      })
    })
    .then(response => response.json())
    .then(result => {
      clearInterval(this_.intervalID);
      this_.quickRefreshCount = 0;
      this_.intervalID = setInterval(this.quickRefresh.bind(this), 10000);
    });
  }
 
  render() {
    const { classes } = this.props;
    return (
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <AppBar position="static">
            <Toolbar>
              <IconButton edge="start" onClick={this.toggleDrawer} className={classes.menuButton} color="inherit" aria-label="menu">
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" className={classes.title}>
                HomeDockyard
              </Typography>
              <Button color="inherit">
                {
                  this.state.updateCount ?
                  <Badge badgeContent={this.state.updateCount} color="secondary">
                    <UpdateIcon title={"" + this.state.updateCount + " Updates Available"} />
                  </Badge>
                  :
                  ""
                }
              </Button>
            </Toolbar>
          </AppBar>
          <Drawer anchor='left' variant="persistent" open={this.state.drawerOpen}>
            <List>
              <ListItem button key='HomeDockyard'  onClick={this.toggleDrawer}>
                <ListItemIcon><MenuOpenIcon /></ListItemIcon>
                <ListItemText primary='HomeDockyard' />
              </ListItem>
          </List>
          </Drawer>
          <Box theme={darkTheme} className={classes.box} >
            <ContainerGrid containers={this.state.containers} onContainerStart={this.startContainerIfConfirmed} onContainerStop={this.stopContainerIfConfirmed} />
          </Box>
          <ConfirmDialog open={this.state.showConfirmDialog} text={this.state.confirmDialogText} onClose={this.closeConfirmDialog} onYes={this.onConfirmDialogYes} />
        </ThemeProvider>
      );
    }
}

export default withStyles(useStyles)(App)
