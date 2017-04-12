import firebase from 'firebase';
import config from './core/config';
import { SpotTheBot } from './spot-the-bot';
import { loadFacebookAPI } from './util';

// Patch three.js with some enhancements.
import './util/three-ext';

window.onload = function () {

  loadFacebookAPI();

  Object.assign(config, {
    requireVRPresent: false, // allow mouse+keyboard display
    roomCharset: '123456789', // use numbers for easy prototyping
    prod: false,
  });

  firebase.initializeApp({
    apiKey: 'AIzaSyDgSHXVzXqw_3NOoumD5wRDaj8R2L2X-t0',
    authDomain: 'chrome-webvr-prototyping.firebaseapp.com',
    databaseURL: 'https://chrome-webvr-prototyping.firebaseio.com',
    storageBucket: 'chrome-webvr-prototyping.appspot.com',
    messagingSenderId: '582087411494',
  });

  SpotTheBot();
};
