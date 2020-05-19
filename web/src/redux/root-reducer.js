import {combineReducers} from 'redux';

import containersReducer from './containers/containers.reducer';
import confirmDialogReducer from './confirmdialog/confirmdialog.reducer';

export default combineReducers({
    containers: containersReducer,
    confirmDialog: confirmDialogReducer
});
