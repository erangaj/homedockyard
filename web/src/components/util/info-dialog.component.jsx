import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, LinearProgress } from '@material-ui/core';

export const InfoDialog = (props) => {
    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            fullWidth={true}
        >
            <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
            <DialogContent>
                <LinearProgress variant="determinate" value={props.completed} color={props.error ? "secondary" : "primary"} />
                <DialogContentText id="alert-dialog-description">
                    <pre>
                        {props.text}
                    </pre>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">
                    Hide
                </Button>
            </DialogActions>
        </Dialog>
    )
}