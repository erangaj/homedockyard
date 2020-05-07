import React from 'react';
import './container-grid.component.css'
import { Container } from '../container/container.component'

export const ContainerGrid = (props) => {
    return (
        <div className="container-grid">
        {
          props.containers.map(container => (
            <Container container={container} />
          ))
        }
      </div>
    )
}