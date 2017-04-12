import firebase from 'firebase';
import config from './core/config';
import { SpotTheBot } from './spot-the-bot';
import { loadFacebookAPI } from './util';

// Patch three.js with some enhancements.
import './util/three-ext';

window.onload = function () {

  loadFacebookAPI();

  Object.assign(config, {
    requireVRPresent: true, // require a VR device
    roomCharset: 'BCDFGHJKMNPQRSTVWXYZ23456789', // use alphanumeric without vowels or easily mistaken letters
    prod: true,
  });

  firebase.initializeApp( {
    apiKey: "AIzaSyAFK84pmYv3TSqaLjhKXnV7f7tz79v5dvQ",
    authDomain: "spot-the-bot.firebaseapp.com",
    databaseURL: "https://spot-the-bot.firebaseio.com",
    storageBucket: "spot-the-bot.appspot.com",
    messagingSenderId: "942185142071"
  });

  SpotTheBot();

};
