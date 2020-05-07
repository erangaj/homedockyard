import React from 'react';
import './container.component.css'

export const Container = (props) => {
    console.log(props.container)
    return (
        <div className="container-grid-item" key={props.container.id}>
            <div className="container-icon-cell">
                <img className="container-icon" src={'icons/' + props.container.icon} />
            </div>
            <div className="container-name-cell">
                <div>{props.container.name}</div>
            </div>
            <div className="container-update-cell">
                <img className={props.container.updateAvailable ? "container-update-icon" : "hide"} src='icons/update-badge.svg' />
            </div>
        </div>
    )
}