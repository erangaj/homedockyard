import React, { Component } from 'react';
import './container.component.css'
import { Grid, Paper, Typography, IconButton, Tooltip, CircularProgress } from '@material-ui/core';
import { Stop, PlayArrow, Update } from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
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
    }
);
  

class Container extends Component {

    componentDidUpdate(prevProps) {
    }
    
    render() {
        const { classes } = this.props;
        if (this.props.container.loading) {
            return (
                <Grid item>
                    <Paper elevation={2} className={classes.paper}>
                        <div className="container-grid-item">
                            <div className="container-icon-cell">
                                <CircularProgress />
                            </div>
                            <div className="container-name-cell">
                                <Typography variant="body1" >{this.props.container.name}</Typography>
                            </div>
                        </div>
                    </Paper>
                </Grid>
            );
        }
        return (
        <Grid item>
            <Paper elevation={2} className={classes.paper}>
                <div className="container-grid-item">
                    <div className="container-icon-cell">
                        <Tooltip title={this.props.container.imageName}>
                            <img alt={this.props.container.imageName} className="container-icon" src={'icons/' + this.props.container.icon} />
                        </Tooltip>
                    </div>
                    <div className="container-name-cell">
                        <Typography variant="body1" >{this.props.container.name}</Typography>
                        {
                            this.props.container.state==='running' ?
                            <Typography variant="body2" className={classes.running}>{this.props.container.state}<IconButton size="small" onClick={(e) => this.props.onStop(this.props.container.id)} title="Stop Container" color="default"><Stop /></IconButton></Typography>
                            :
                            <Typography variant="body2" className={classes.not_running}>{this.props.container.state}<IconButton size="small" onClick={(e) => this.props.onStart(this.props.container.id)} title="Start Container" color="default" ><PlayArrow /></IconButton></Typography>
                        }
                    </div>
                    <div>
                        {
                            this.props.container.updateAvailable ? <Update color="primary" title="Updates Available" className='container-update-icon' /> : ""
                        }
                    </div>    
                </div>
            </Paper>
        </Grid>
        )
    }
}
export default withStyles(useStyles)(Container)
