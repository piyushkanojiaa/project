/**
 * Kepler.gl Redux Store Configuration
 * 
 * Sets up Redux store with Kepler.gl reducers
 */

import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { taskMiddleware } from 'react-palm/tasks';
import keplerGlReducer from 'kepler.gl/reducers';

// Combine reducers
const rootReducer = combineReducers({
    // Kepler.gl reducer with instance ID
    keplerGl: keplerGlReducer.initialState({
        // Map instance IDs
        map: {}
    })
});

// Enable Redux DevTools Extension
const composeEnhancers =
    (typeof window !== 'undefined' &&
        (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;

// Create store with middleware
export const store = createStore(
    rootReducer,
    {},
    composeEnhancers(applyMiddleware(taskMiddleware))
);

export type RootState = ReturnType<typeof rootReducer>;
