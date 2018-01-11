// @flow

import {
    _SET_PIP_LISTENERS,
    PIP_MODE_CHANGED,
    REQUEST_PIP_MODE
} from './actionTypes';

/**
 * Sets the listeners for the PiP related events.
 *
 * @param {Array} listeners - Array of listeners to be set.
 * @protected
 * @returns {{
 *     type: _SET_PIP_LISTENERS,
 *     listeners: Array
 * }}
 */
export function _setListeners(listeners: ?Array<any>) {
    return {
        type: _SET_PIP_LISTENERS,
        listeners
    };
}

/**
 * Signals that the Picture-in-Picture (PiP) mode has changed. When in PiP mode,
 * the application is displayed in a small view and it's not rendered in full.
 *
 * @param {boolean} inPipMode - True if the app is in PiP mode, false otherwise.
 * @public
 * @returns {{
 *     type: PIP_MODE_CHANGED,
 *     inPipMode: boolean
 * }}
 */
export function pipModeChanged(inPipMode: boolean) {
    return {
        type: PIP_MODE_CHANGED,
        inPipMode
    };
}

/**
 * Requests Picture-in-Picture mode.
 *
 * @public
 * @returns {{
 *     type: REQUEST_PIP_MODE
 * }}
 */
export function requestPipMode() {
    return {
        type: REQUEST_PIP_MODE
    };
}
