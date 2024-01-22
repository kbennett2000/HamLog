
// store.js
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


/*
// store.js
import { configureStore } from '@reduxjs/toolkit';

// You can create a slice or just use a simple reducer as before
const initialState = {
    lastInsertID: ''
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_LAST_INSERT_ID':
            return { ...state, lastInsertID: action.payload };
        default:
            return state;
    }
};

const store = configureStore({
    reducer: {
        // If you have multiple reducers, you can add them here
        lastInsertIDReducer: reducer,
    },
});

export default store;
*/