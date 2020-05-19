import React, { Component } from 'react';
import './App.css';
import { Box, AppBar, Toolbar, IconButton, Typography, Button, Drawer, Badge } from '@material-ui/core';
import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { createMuiTheme, ThemeProvider, withStyles } from '@material-ui/core/styles';
import ContainerGrid from './components/container-grid/container-grid.component'
import { ConfirmDialog } from './components/util/confirm-dialog.component'
import CssBaseline from '@material-ui/core/CssBaseline';
import MenuIcon from '@material-ui/icons/Menu';
import UpdateIcon from '@material-ui/icons/Update';
import MenuOpenIcon from '@material-ui/icons/MenuOpen';
import { setContainersAndUpdateCount, setContainerLoading } from './redux/containers/containers.actions';
import { connect } from 'react-redux';
import { setConfirmDialog } from './redux/confirmdialog/confirmdialog.actions';

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
    this.state = {drawerOpen: false};
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
    this.fetchContainers();
    this.intervalID = setInterval(this.fetchContainers.bind(this), 60000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);
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

  onConfirmDialogYes() {
    switch(this.props.onConfirm) {
      case 'START_CONTAINER' : this.startContainer(this.props.onConfirmParam); break;
      case 'STOP_CONTAINER' : this.stopContainer(this.props.onConfirmParam); break;
      default: break;
    }
    this.props.setConfirmDialog(false, null, null, null);
  }

  startContainer(id) {
    let this_ = this;
    this.props.setContainerLoading(id);
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
    this.props.setContainerLoading(id);
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
    const { classes, updateCount } = this.props;
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
                  updateCount ?
                  <Badge badgeContent={updateCount} color="secondary">
                    <UpdateIcon title={"" + updateCount + " Updates Available"} />
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
            <ContainerGrid />
          </Box>
          <ConfirmDialog open={this.props.showConfirmDialog} text={this.props.confirmDialogText} onClose={this.closeConfirmDialog} onYes={this.onConfirmDialogYes} />
        </ThemeProvider>
      );
    }
}

const AppWithStyles = withStyles(useStyles)(App);

const mapDispatchToProps = dispatch => ({
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
  setConfirmDialog: (showConfirmDialog, onConfirm, onConfirmParam, confirmDialogText) => dispatch(setConfirmDialog(showConfirmDialog, onConfirm, onConfirmParam, confirmDialogText))

});

const mapStateToProps = state => ({
  containers: state.containers.containers,
  updateCount: state.containers.updateCount,
  showConfirmDialog: state.confirmDialog.showConfirmDialog, 
  onConfirm: state.confirmDialog.onConfirm,
  onConfirmParam: state.confirmDialog.onConfirmParam,
  confirmDialogText: state.confirmDialog.confirmDialogText
});

export default connect(mapStateToProps, mapDispatchToProps)(AppWithStyles);
