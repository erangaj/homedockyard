import {combineReducers} from 'redux';

import containersReducer from './containers/containers.reducer';
import endpointsReducer from './endpoints/endpoints.reducer';
import confirmDialogReducer from './confirmdialog/confirmdialog.reducer';

export default combineReducers({
    containers: containersReducer,
    endpoints: endpointsReducer,
    confirmDialog: confirmDialogReducer
});
