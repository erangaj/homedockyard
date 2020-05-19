export const setContainersAndUpdateCount = (containers, updateCount) => ({
    type: 'SET_CONTAINERS_UPDATECOUNT',
    payload: {containers, updateCount, loading: null}
});

export const setContainers = (containers) => ({
    type: 'SET_CONTAINERS',
    payload: {containers, loading: null}
});

export const setContainerLoading = (id) => ({
    type: 'SET_CONTAINER_LOADING',
    payload: {loading: id}
});
