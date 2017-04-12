import is from 'is_js';
import Vue from 'vue';
import Vuex from 'vuex';

if (process.env.NODE_ENV === 'production') {

  Vue.use(Vuex); // vuex mounts itself in development

}

/**
 * @typedef {Object} UIRoute
 * @enum {String}
 * @readonly
 */
export const UIRoute = Object.freeze({

  load: 'load',
  menu: 'menu',
  gameReady:   'game:ready',
  gameRunning: 'game:running',
  gameScore:   'game:score',

});

/**
 * @typedef {Object} UIMutation
 * @enum {String}
 * @readonly
 */
export const UIMutation = Object.freeze({

  mute:               'UIMutation.mute',
  unmute:             'UIMutation.unmute',
  navigate:           'UIMutation.navigate',
  updateWebGLSupport: 'UIMutation.updateWebGLSupport',
  updateWebVRDisplay: 'UIMutation.updateWebVRDisplay',

});

export const store = new Vuex.Store({

  state: load({

    muted: false,
    route: UIRoute.load,
    mobile: (is.mobile() || is.tablet()),
    webvrDisplay: null,
    webvrPresenting: false,
    webglSupported: false,

  }),

  mutations: {

    [UIMutation.mute] (state) {

      state.muted = true;
      persist(state);

    },

    [UIMutation.unmute] (state) {

      state.muted = false;
      persist(state);

    },

    [UIMutation.navigate] (state, payload) {

      state.route = payload;

    },

    [UIMutation.updateWebGLSupport] (state, payload) {

      state.webglSupported = (payload === true);

    },

    [UIMutation.updateWebVRDisplay] (state, display) {

      if (display) state.webvrDisplay = display;

      state.webvrPresenting = (state.webvrDisplay && state.webvrDisplay.isPresenting);

    }

  },

});

/**
 * Persist some members of the UI state to local storage.
 *
 * @param {Object} state - The raw state object.
 * @return {Object} the original state object.
 */
function persist(state) {

  localStorage.setItem('muted', state.muted);

  return state;

}

/**
 * Load some members of the UI state from local storage.
 *
 * @param {Object} state - The raw state object.
 * @return {Object} the original state object.
 */
function load(state) {

  state.muted = localStorage.getItem('muted') === 'true';

  return state;

}
