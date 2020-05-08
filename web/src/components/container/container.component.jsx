import React from 'react';
import './container.component.css'
import { Grid, Paper, Typography, IconButton, Tooltip } from '@material-ui/core';
import { Stop, PlayArrow, Update } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    paper: {
      padding: theme.spacing(1),
      textAlign: 'center',
      color: theme.palette.text.primary,
      whiteSpace: 'nowrap',
      marginBottom: theme.spacing(0),
      width: '300px',
      height: '65px'
    },
    running: {
        color: theme.palette.success.light,
        'text-transform': 'capitalize',
    },
    not_running: {
        color: theme.palette.error.light,
        'text-transform': 'capitalize',
    }
  }));

export const Container = (props) => {
    const classes = useStyles();

    return (
        <Grid item>
            <Paper elevation={2} className={classes.paper}>
                <div className="container-grid-item">
                    <div className="container-icon-cell">
                      <Tooltip title={props.container.imageName}>
                        <img alt={props.container.imageName} className="container-icon" src={'icons/' + props.container.icon} />
                      </Tooltip>
                    </div>
                    <div className="container-name-cell">
                        <Typography variant="body1" >{props.container.name}</Typography>
                        {
                            props.container.state==='running' ?
                            <Typography variant="body2" className={classes.running}>{props.container.state}<IconButton size="small" title="Stop Container" color="default"><Stop /></IconButton></Typography>
                            :
                            <Typography variant="body2" className={classes.not_running}>{props.container.state}<IconButton size="small" title="Start Container" color="default" ><PlayArrow /></IconButton></Typography>
                        }
                    </div>
                    <div>
                        {
                            props.container.updateAvailable ? <Update color="primary" title="Updates Available" className='container-update-icon' /> : ""
                        }
                    </div>    
                </div>
            </Paper>
        </Grid>
    )
}
