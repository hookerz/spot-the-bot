/**
 * A no-op function.
 */
export function noop() {}

/**
 * List the values of an object.
 *
 * @param {Object} obj - The object to iterate over.
 * @return {Array} A list of values on the object.
 */
export function values(obj) {

  return Object.keys(obj).map(key => obj[key]);

}

/**
 * Non-mutating version of Object.assign
 *
 * @return {Object} A new object with all of the properties of the arguments.
 */
export function assign(...args) {

  return Object.assign({}, ...args);

}

/**
 * Shuffle an array in place.
 *
 * @param {Array} arr - The array to shuffle.
 * @return {Array} The same array.
 */
export function shuffle(arr) {

  if (Array.isArray(arr) !== true) {

    throw new Error('arr must be an array');

  }

  for (let i = arr.length - 1; i >= 0; i--) {

    const j = Math.floor(Math.random() * i);

    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;

  }

  return arr;

}

/**
 * Rotate an array in place. All of the elements are shifted forward one index, and the last element
 * is moved to the start.
 *
 * @param {Array} arr - The array to rotate.
 * @return {Array} The same array.
 */
export function rotate(arr) {

  if (Array.isArray(arr) !== true) {

    throw new Error('arr must be an array');

  }

  const last = arr[arr.length - 1];

  for (let i = arr.length - 1; i > 0; i--) {

    arr[i] = arr[i - 1];

  }

  arr[0] = last;

  return arr;

}

/**
 * Load the Facebook API by inserting a script tag into the document head.
 */
export function loadFacebookAPI() {

  const appId = '634863893370379';

  window.fbAsyncInit = function() {

    FB.init({ appId, xfbml: true, version: 'v2.8' });
    FB.AppEvents.logPageView();

  };

  const el = document.createElement('script');
  el.src = 'https://connect.facebook.net/en_US/sdk.js';

  document.head.appendChild(el);

}
