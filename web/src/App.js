import React, { Component } from 'react';
import './App.css';
import { Box, AppBar, Toolbar, IconButton, Typography, Button, Drawer, Badge } from '@material-ui/core';
import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { createMuiTheme, ThemeProvider, withStyles } from '@material-ui/core/styles';
import { ContainerGrid } from './components/container-grid/container-grid.component'
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
  
  constructor() {
    super();
    this.state = {containers: [], drawerOpen: false, updateCount: 0};
    this.toggleDrawer = this.toggleDrawer.bind(this);
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
    fetch("https://codetest.eranga.org/api/containers")
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
 
  render() {
    const { classes } = this.props;
    return (
      <ThemeProvider theme={darkTheme} className={classes.root}>
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
          <ContainerGrid containers={this.state.containers} />
        </Box>
      </ThemeProvider>
    );
    }
}

export default withStyles(useStyles)(App)
