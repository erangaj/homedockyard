const INITIAL_STATE = {
    showConfirmDialog: false, 
    onConfirm: null, 
    onConfirmParam: null, 
    confirmDialogText: null
};

const confirmDialogReducer = (state=INITIAL_STATE, action) => {
    switch(action.type) {
        case 'SET_CONFIRM_DIALOG':
            return {
                ...state,
                showConfirmDialog: action.payload.showConfirmDialog,
                onConfirm: action.payload.onConfirm,
                onConfirmParam: action.payload.onConfirmParam,
                confirmDialogText: action.payload.confirmDialogText
            };
        default:
            return state;
    }
};

export default confirmDialogReducer;
