import { ReducerRegistry } from '../../base/redux';

import {
    _SET_PIP_LISTENERS,
    PIP_MODE_CHANGED
} from './actionTypes';

ReducerRegistry.register('features/pip', (state = {}, action) => {
    switch (action.type) {
    case _SET_PIP_LISTENERS:
        return {
            ...state,
            listeners: action.listeners
        };

    case PIP_MODE_CHANGED:
        return {
            ...state,
            inPipMode: action.inPipMode
        };
    }

    return state;
});
