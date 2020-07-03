import React from 'react';
import './container-grid.component.css'
import Container from '../container/container.component'
import Grid from '@material-ui/core/Grid';
import { connect } from 'react-redux';
import { createMuiTheme, ThemeProvider, withStyles } from '@material-ui/core/styles';

const ContainerGrid = ({containers, loading, endpoint, classes}) => {
    if (!endpoint) {
      return <div />;
    }
    return (
      <Grid container spacing={2} className={classes.box}>
        {
          containers.map(container => (
            container.instanceID===endpoint.instanceID ? <Container container={container} key={container.id} loading={container.id === loading} /> : ''
          ))
        }
      </Grid>
    )
}

const mapStateToProps = state => ({
  containers: state.containers.containers,
  loading: state.containers.loading,
  endpoint: state.endpoints.currentEndpoint
});

const useStyles = theme => ({
  box: {
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1)
  },
});

const ContainerGridWithStyles = withStyles(useStyles)(ContainerGrid);
export default connect(mapStateToProps)(ContainerGridWithStyles);
