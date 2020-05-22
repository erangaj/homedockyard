import React, { Component } from 'react';
import './container.component.css'
import { Grid, Paper, Typography, IconButton, Tooltip, CircularProgress, Popover } from '@material-ui/core';
import { Stop, PlayArrow, Update } from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';
import { setConfirmDialog } from '../../redux/confirmdialog/confirmdialog.actions';
import { connect } from 'react-redux';

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
    },
    popover: {
        padding: theme.spacing(2),
    },
    
});

class Container extends Component {

    constructor() {
        super();
        this.state = {popoverOpen: false, popoverAnchorEl:null};
    }

    componentDidUpdate(prevProps) {
    }
    
    onStart = () => {
        this.props.setConfirmDialog(true, 'START_CONTAINER', this.props.container.id, 'Do you really want to start ' + this.props.container.name + '?');
    };

    onStop = () => {
        this.props.setConfirmDialog(true, 'STOP_CONTAINER', this.props.container.id, 'Do you really want to stop ' + this.props.container.name + '?');
    };

    onUpdate = e => {
        if(this.props.container.composeData.configExists) {
            this.props.setConfirmDialog(true, 'UPDATE_CONTAINER', this.props.container.id, 'Do you really want to update ' + this.props.container.name + ' to the latest version?');
        } else {
            this.setState({popoverOpen: true, popoverAnchorEl:e.currentTarget});
        }
    };

    handleClose = () => {
        this.setState({popoverOpen: false, popoverAnchorEl:null});
    };

    render() {
        const { classes } = this.props;
        if (this.props.loading) {
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
                            <Typography variant="body2" className={classes.running}>{this.props.container.state}<IconButton size="small" onClick={(e) => this.onStop()} title="Stop Container" color="default"><Stop /></IconButton></Typography>
                            :
                            <Typography variant="body2" className={classes.not_running}>{this.props.container.state}<IconButton size="small" onClick={(e) => this.onStart()} title="Start Container" color="default" ><PlayArrow /></IconButton></Typography>
                        }
                    </div>
                    <div>
                        {
                            this.props.container.updateAvailable ?
                            <div>
                                <IconButton size="small" onClick={(e) => this.onUpdate(e)} title="Start Container" className='container-update-icon' color="default" >
                                    <Update color="primary" title="Updates Available" />
                                </IconButton>
                                <Popover
                                    open={this.state.popoverOpen}
                                    anchorEl={this.state.popoverAnchorEl}
                                    onClose={this.handleClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'center',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'center',
                                    }}
                                >
                                    <Typography className={classes.popover}>Can't update {this.props.container.name}.<br />Docker Compose details not found.</Typography>
                                </Popover>
                            </div>
                            : ""
                        }
                    </div>    
                </div>
            </Paper>
        </Grid>
        )
    }
}

const ContainerWithStyles = withStyles(useStyles)(Container)

const mapDispatchToProps = dispatch => ({
    setConfirmDialog: (showConfirmDialog, onConfirm, onConfirmParam, confirmDialogText) => dispatch(setConfirmDialog(showConfirmDialog, onConfirm, onConfirmParam, confirmDialogText))
});
  
export default connect(null, mapDispatchToProps)(ContainerWithStyles);
