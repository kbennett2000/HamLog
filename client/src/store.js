import { createStore } from 'redux';

// Define an initial state
const initialState = {
    lastInsertID: ''
};

// Create a reducer function
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_LAST_INSERT_ID':
            return { ...state, lastInsertID: action.payload };
        default:
            return state;
    }
};

// Create the store
const store = createStore(reducer);

export default store;