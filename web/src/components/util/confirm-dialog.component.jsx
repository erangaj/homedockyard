import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

export const ConfirmDialog = (props) => {
    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">Please Confirm</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {props.text}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onYes} color="primary" autoFocus>
                    Yes
                </Button>
                <Button onClick={props.onClose} color="primary">
                    No
                </Button>
            </DialogActions>
        </Dialog>
    )
}