import React from 'react';
import './container-grid.component.css'
import Container from '../container/container.component'
import Grid from '@material-ui/core/Grid';
import { connect } from 'react-redux';

const ContainerGrid = ({containers, loading, endpoint}) => {
    if (!endpoint) {
      return <div />;
    }
    return (
      <Grid container spacing={2}>
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

export default connect(mapStateToProps)(ContainerGrid);
