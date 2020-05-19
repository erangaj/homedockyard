export const setConfirmDialog = (showConfirmDialog, onConfirm, onConfirmParam, confirmDialogText) => ({
    type: 'SET_CONFIRM_DIALOG',
    payload: {showConfirmDialog, onConfirm, onConfirmParam, confirmDialogText}
});
