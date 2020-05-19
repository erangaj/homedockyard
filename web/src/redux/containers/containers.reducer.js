const INITIAL_STATE = {
    containers: [],
    updateCount: 0,
    loading: null
};

const containersReducer = (state=INITIAL_STATE, action) => {
    switch(action.type) {
        case 'SET_CONTAINERS_UPDATECOUNT':
            return {
                ...state,
                containers: action.payload.containers,
                updateCount: action.payload.updateCount,
                loading: action.payload.loading
            };
        case 'SET_CONTAINERS':
            return {
                ...state,
                containers: action.payload.containers,
                loading: action.payload.loading
            };
        case 'SET_CONTAINER_LOADING':
            return {
                ...state,
                loading: action.payload.loading
            };
        default:
            return state;
    }
};

export default containersReducer;
