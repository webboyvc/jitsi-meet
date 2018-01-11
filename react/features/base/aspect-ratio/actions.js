// @flow

import { SET_ASPECT_RATIO } from './actionTypes';
import { ASPECT_RATIO_NARROW, ASPECT_RATIO_WIDE } from './constants';

import type { Dispatch } from 'redux';

/**
 * Sets the aspect ratio of the app's user interface based on specific width and
 * height.
 *
 * @param {number} width - The width of the app's user interface.
 * @param {number} height - The height of the app's user interface.
 * @returns {{
 *      type: SET_ASPECT_RATIO,
 *      aspectRatio: Symbol
 * }}
 */
export function setAspectRatio(width: number, height: number): Object {
    return (dispatch: Dispatch<*>, getState: Function) => {
        let aspectRatio;

        if (width === height) {
            // Iff the width and height are the same, keep the previously
            // computed aspect ratio.
            aspectRatio = getState()['features/base/aspect-ratio'].aspectRatio;
        } else {
            aspectRatio
                = width < height ? ASPECT_RATIO_NARROW : ASPECT_RATIO_WIDE;
        }

        return dispatch({
            type: SET_ASPECT_RATIO,
            aspectRatio
        });
    };
}
