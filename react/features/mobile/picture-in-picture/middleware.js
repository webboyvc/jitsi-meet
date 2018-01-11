// @flow

import { DeviceEventEmitter, Dimensions } from 'react-native';

import {
    APP_WILL_MOUNT,
    APP_WILL_UNMOUNT
} from '../../app';
import {
    CONFERENCE_JOINED,
    VIDEO_QUALITY_LEVELS,
    setLastN,
    setReceiveVideoQuality
} from '../../base/conference';
import { pinParticipant } from '../../base/participants';
import { MiddlewareRegistry } from '../../base/redux';

import {
    _setListeners,
    pipModeChanged
} from './actions';
import {
    _SET_PIP_LISTENERS,
    PIP_MODE_CHANGED,
    REQUEST_PIP_MODE
} from './actionTypes';
import { enterPictureInPictureMode } from './functions';

/**
 * Threshold for detecting if the application is in Picture-in-Picture mode. If
 * either the width or height is below this threshold, the app is considered to
 * be in PiP mode and the UI will be adjusted accordingly.
 */
const PIP_THRESHOLD_SIZE = 240;

/**
 * Middleware that handles Picture-in-Picture mode changes and reacts to them
 * by dispatching the needed actions for the application to adjust itself to
 * the mode. Currently the following happens when PiP mode is engaged:
 *  - any pinned participant is unpinned
 *  - last N is set to 1
 *  - received video quality is set to low
 * All these actions are reversed when PiP mode is disengaged. If audio-only
 * mode is in use, last N and received video quality remain untouched.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_PIP_LISTENERS: {
        // Remove the current/old listeners.
        const { listeners } = store.getState()['features/pip'];

        if (listeners) {
            for (const listener of listeners) {
                listener.remove();
            }
        }
        break;
    }

    case APP_WILL_MOUNT:
        _appWillMount(store);
        break;

    case APP_WILL_UNMOUNT:
        store.dispatch(_setListeners(undefined));
        break;

    case CONFERENCE_JOINED:
    case PIP_MODE_CHANGED:
        _pipModeChanged(store, action);
        break;

    case REQUEST_PIP_MODE:
        _enterPictureInPicture(store);
        break;

    }

    return next(action);
});

/**
 * Notifies the feature pip that the action {@link APP_WILL_MOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code APP_WILL_MOUNT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _appWillMount({ dispatch, getState }) {
    const context = {
        dispatch,
        getState
    };

    const listeners = [

        // App window dimension changes
        Dimensions.addEventListener(
            'change', _onDimensionsChanged.bind(context)),

        // Android's onUserLeaveHint activity lifecycle callback
        DeviceEventEmitter.addListener('onUserLeaveHint', () => {
            _enterPictureInPicture(context);
        })
    ];

    dispatch(_setListeners(listeners));
}

/**
 * Helper function to enter PiP mode. This is triggered by user request
 * (either pressing the button in the toolbox or the home button on Android)
 * ans this triggers the PiP mode, iff it's available and we are in a
 * conference.
 *
 * @param {Object} store - Redux store.
 * @private
 * @returns {void}
 */
function _enterPictureInPicture({ getState }) {
    const state = getState();
    const { app } = state['features/app'];
    const { conference, joining } = state['features/base/conference'];

    if (app.props.pipAvailable && (conference || joining)) {
        enterPictureInPictureMode().catch(e => {
            console.warn(`Error entering PiP mode: ${e}`);
        });
    }
}

/**
 * Handle window dimension changes. When the window size (either width or
 * height) is below the threshold, we consider the app to be in PiP mode. Here
 * we focus on the 'window', because the 'screen' represents the entire
 * available surface on the device, not the surface our view is taking.
 *
 * @param {Object} dimensions - Representation of the device dimensions,
 * according to React Native's {@link Dimensions} module.
 * @private
 * @returns {void}
 */
function _onDimensionsChanged(dimensions: Object) {
    const { dispatch, getState } = this; // eslint-disable-line no-invalid-this
    const { width, height } = dimensions.window;
    const wasInPipMode = getState()['features/pip'].inPipMode;
    const inPipMode = width < PIP_THRESHOLD_SIZE || height < PIP_THRESHOLD_SIZE;

    if (wasInPipMode !== inPipMode) {
        dispatch(pipModeChanged(inPipMode));
    }
}

/**
 * Handles PiP mode changes. Dispatches the necessary Redux actions for setting
 * the app layout / behavior to the PiP mode. See above for details.
 *
 * @param {Object} store - Redux store.
 * @param {Action} action - The Redux action {@code CONFERENCE_JOINED} or
 * {@code PIP_MODE_CHANGED} which is * being dispatched in the specified
 * {@code store}.
 * @private
 * @returns {void}
 */
function _pipModeChanged({ dispatch, getState }, action: Object) {
    const state = getState();
    const { audioOnly } = state['features/base/conference'];
    let { inPipMode } = action;

    if (typeof inPipMode === 'undefined') {
        inPipMode = state['features/pip'].inPipMode;
    }

    inPipMode && dispatch(pinParticipant(null));

    if (!audioOnly) {
        dispatch(setLastN(inPipMode ? 1 : undefined));
        dispatch(
            setReceiveVideoQuality(
                inPipMode
                    ? VIDEO_QUALITY_LEVELS.LOW : VIDEO_QUALITY_LEVELS.HIGH));
    }
}
