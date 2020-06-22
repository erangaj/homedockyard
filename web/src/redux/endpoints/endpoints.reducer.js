const INITIAL_STATE = {
    endpoints: [],
    currentEndpoint: null
};

const endpointsReducer = (state=INITIAL_STATE, action) => {
    switch(action.type) {
        case 'SET_ENDPOINTS':
            return {
                ...state,
                endpoints: action.payload.endpoints
            };
        case 'SELECT_ENDPOINT':
            return {
                ...state,
                currentEndpoint: action.payload.endpoint
            };
        default:
            return state;
    }
};

export default endpointsReducer;
