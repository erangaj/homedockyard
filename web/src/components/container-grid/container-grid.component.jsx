import React from 'react';
import './container-grid.component.css'
import Container from '../container/container.component'
import Grid from '@material-ui/core/Grid';

export const ContainerGrid = (props) => {
    return (
      <Grid container spacing={2}>
        {
          props.containers.map(container => (
            <Container container={container} key={container.id} onStart={props.onContainerStart} onStop={props.onContainerStop} />
          ))
        }
      </Grid>
    )
}