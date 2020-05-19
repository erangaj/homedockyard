import React from 'react';
import './container-grid.component.css'
import Container from '../container/container.component'
import Grid from '@material-ui/core/Grid';
import { connect } from 'react-redux';

const ContainerGrid = ({containers, loading}) => {
    return (
      <Grid container spacing={2}>
        {
          containers.map(container => (
            <Container container={container} key={container.id} loading={container.id === loading} />
          ))
        }
      </Grid>
    )
}

const mapStateToProps = state => ({
  containers: state.containers.containers,
  loading: state.containers.loading
});

export default connect(mapStateToProps)(ContainerGrid);
