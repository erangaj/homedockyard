export const setEndpoints = (endpoints) => ({
    type: 'SET_ENDPOINTS',
    payload: {endpoints}
});

export const selectEndpoint = (endpoint) => ({
    type: 'SELECT_ENDPOINT',
    payload: {endpoint}
});
