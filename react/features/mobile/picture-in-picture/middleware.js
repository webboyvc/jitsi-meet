// @flow

import { DeviceEventEmitter, NativeModules } from 'react-native';
import type { Dispatch } from 'redux';

import {
    APP_WILL_MOUNT,
    APP_WILL_UNMOUNT
} from '../../app';
import {
    VIDEO_QUALITY_LEVELS,
    setLastN,
    setReceiveVideoQuality
} from '../../base/conference';
import { pinParticipant } from '../../base/participants';
import { MiddlewareRegistry } from '../../base/redux';

import {
    _setListener,
    pipModeChanged
} from './actions';
import {
    _SET_PIP_MODE_LISTENER,
    PIP_MODE_CHANGED,
    REQUEST_PIP_MODE
} from './actionTypes';

/**
 * Reference to the Picture-in-Picture helper module. Currently only implemented
 * for Android, as iOS "fakes" it since there is PiP support for phones.
 */
const pip = NativeModules.PictureInPicture;

/**
 * Middleware that handles Picture-in-Picture mode changes and reacts to them
 * by dispatching the needed actions for the application to adjust itself to
 * the mode. Currently the following happens when PiP mode is engaged:
 *  - any pinned participant is unpinned
 *  - last N is set to 1
 *  - received video quality is set to low
 * All these actions are reversed when PiP mode is disengaged.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_PIP_MODE_LISTENER: {
        // Remove the current/old listener.
        const { pipModeListener } = store.getState()['features/pip'];

        if (pipModeListener) {
            pipModeListener.remove();
        }

        // Add the new listener.
        if (action.listener) {
            DeviceEventEmitter.addListener(
                'pictureInPictureModeChanged', action.listener);
        }
        break;
    }

    case APP_WILL_MOUNT:
        store.dispatch(
            _setListener(
                _onPipModeChange.bind(undefined, store.dispatch)));
        break;

    case APP_WILL_UNMOUNT:
        store.dispatch(_setListener(null));
        break;

    case PIP_MODE_CHANGED:
        _pipModeChanged(store, action.inPipMode);
        break;

    case REQUEST_PIP_MODE:
        _requestPipMode();
        break;

    }

    return next(action);
});

/**
 * Handles PiP mode changes. Dispatches the necessary Redux actions for setting
 * the app layout / behavior to the PiP mode. See above for details.
 *
 * @param {Object} store - Redux store.
 * @param {boolean} inPipMode - The current PiP mode.
 * @private
 * @returns {void}
 */
function _pipModeChanged({ dispatch, getState }, inPipMode: boolean) {
    const { audioOnly } = getState()['features/base/conference'];

    if (inPipMode) {
        // Unpin any pinned participant
        dispatch(pinParticipant(null));

        // Set last N to 1, unless we are in audio-only mode
        if (!audioOnly) {
            dispatch(setLastN(1));
        }

        // Set the received video quality to low
        dispatch(setReceiveVideoQuality(VIDEO_QUALITY_LEVELS.LOW));
    } else {
        // Set last N back to its original value
        if (!audioOnly) {
            dispatch(setLastN(undefined));
        }

        // Set the received video quality back to high
        dispatch(setReceiveVideoQuality(VIDEO_QUALITY_LEVELS.HIGH));
    }
}

/**
 * Called by React Native's DeviceEventEmitter API to notify that the PiP mode
 * has changed. Dispatches the change within the (associated) Redux store.
 *
 * @param {Dispatch} dispatch - Redux dispatch function.
 * @param {Object} event - The PiP mode changed event.
 * @private
 * @returns {void}
 */
function _onPipModeChange(dispatch: Dispatch<*>, { isInPictureInPictureMode }) {
    dispatch(pipModeChanged(isInPictureInPictureMode));
}

/**
 * Handle a request for entering Picture-Picture mode.
 *
 * @private
 * @returns {void}
 */
function _requestPipMode() {
    if (pip) {
        pip.enterPictureInPictureMode();
    }
}
