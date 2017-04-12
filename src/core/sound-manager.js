import is from 'is_js';
import Debug from 'debug';
import assets from './assets';
import { shuffle, rotate } from '../util';
import { Object3D, PositionalAudio, Audio } from 'three';
import { FixedAudioLoader } from '../util/three-ext/fixed-audio-loader';
import { GameStateManagerEvent } from './game-state-manager';
import { GazeSelectorEvent } from './gaze-selector';
import config from './config';

const debug = Debug('app:audio');

export const SoundManagerEvent = Object.freeze({
  muted:   'SoundManagerEvent.muted',
  unmuted: 'SoundManagerEvent.unmuted',
});

const gazeSounds = [
  'sounds/bot_gazeOver',
  'sounds/bot_gazeOut',
];

const correctSounds = [
  'sounds/bot_correct_ALRIGHT',
  'sounds/bot_correct_TALKINBOUT',
  'sounds/bot_correct_WOOHOO',
];

const incorrectSounds = [
  'sounds/bot_wrong_NO_01',
  'sounds/bot_wrong_NO_02',
  'sounds/bot_wrong_NO_03',
  'sounds/bot_wrong_SIGH_02',
  'sounds/bot_wrong_NO_04',
  'sounds/bot_wrong_SIGH_01',
];

const correctDingPath = "sounds/right_ding";
const incorrectDingPath = "sounds/wrong_buzz";

/**
 * Transform an audio filename into an asset description.
 *
 * @param {String} filename - The audio filename.
 * @return {AssetDescription}
 */
function filenameToAudioAsset(filename) {

  // The experimental Chromium WebVR build doesn't include the MP3 codec so we use OGG. But iOS and
  // macOS don't support OGG so we have to toggle back to MP3.
  const extension = (is.ios() || is.mac()) ? '.mp3' : '.ogg';

  return {
    key: filename,
    url: (filename + extension),
    loader: FixedAudioLoader
  };

}

export const manifest = [
  ...gazeSounds.map(filenameToAudioAsset),
  ...correctSounds.map(filenameToAudioAsset),
  ...incorrectSounds.map(filenameToAudioAsset),
  filenameToAudioAsset(correctDingPath),
  filenameToAudioAsset(incorrectDingPath),
];


export function SoundManager(options = {}) {

  if (!config.audio) {
    // return a dummy object that doesn't do anything!
    const root = new Object3D();
    root.isMuted = false;
    root.mute = () => {root.isMuted = true; root.dispatchEvent({ type: SoundManagerEvent.muted });};
    root.unmute = () => {root.isMuted = false; root.dispatchEvent({ type: SoundManagerEvent.unmuted });};
    return root ;
  }

  if (options.gsm === undefined) throw new Error('options.gsm is required');
  if (options.listener === undefined) throw new Error('options.listener is required');
  if (options.gaze === undefined) { if (config.log) debug('gaze selector not provided'); }

  options = Object.assign({
    volume: 0.5,
  }, options);

  const root = new Object3D();
  const {gsm, listener, gaze} = options;

  root.name = 'Sound Manager';

  const gazeAudio      = gazeSounds.map(filename => createPositionalAudioFromAsset(listener, filename));
  const correctAudio   = correctSounds.map(filename => createPositionalAudioFromAsset(listener, filename));
  const incorrectAudio = incorrectSounds.map(filename => createPositionalAudioFromAsset(listener, filename));
  const correctDing    = createAudioFromAsset(listener, correctDingPath);
  const incorrectDing  = createAudioFromAsset(listener, incorrectDingPath);

  correctDing.setVolume(0.5);
  incorrectDing.setVolume(0.5);

  const [ gazeOnAudio, gazeOutAudio ] = gazeAudio;

  shuffle(correctAudio);
  shuffle(incorrectAudio);

  gsm.addEventListener(GameStateManagerEvent.correct, (event) => {

    const bot = gsm.state.lastCheckedObj;
    if (bot) {
      rotate(correctAudio);
      playAudioOnObject3D(bot, correctAudio[0]);
      correctDing.play();
    }

  });

  gsm.addEventListener(GameStateManagerEvent.incorrect, (event) => {

    const bot = gsm.state.lastCheckedObj;
    if (bot) {
      rotate(incorrectAudio);
      playAudioOnObject3D(bot, incorrectAudio[0]);
      incorrectDing.play();
    }

  });

  let gazeOver = null;
  let lastPlayTime = performance.now();
  let lastGazeChange = performance.now();

  if (gaze) {

    gaze.addEventListener(GazeSelectorEvent.gazeChanged, (event) => {

      const now = performance.now();
      const playDiff = now - lastPlayTime;
      const canPlayNow = playDiff > 200.0;
      let audio = null;
      let object = null;
      if (event.object && event.object.userData.description) {
        if (gazeOver !== null) { // hack to make sure the we don't get a sound right after init
          audio = gazeOnAudio;
          object = event.object;
        }
        gazeOver = true;
        lastGazeChange = now;
      } else if (event.prevObject && gazeOver !== null && event.prevObject.userData.description) {
        gazeOver = false;
        lastGazeChange = now;
        audio = gazeOutAudio;
        object = event.prevObject;
      }

      if (audio && canPlayNow) {
        console.log(object, audio);
        playAudioOnObject3D(object, audio);
        lastPlayTime = now;
      }
    });
  }

  root.isMuted = localStorage.muted === "true" || localStorage.muted === true;

  /**
   * Mute the managed audio.
   */
  root.mute = function () {

    if (config.log) debug('muting');

    const mute = (audio) => audio.setVolume(0);

    gazeAudio.forEach(mute);
    correctAudio.forEach(mute);
    incorrectAudio.forEach(mute);
    mute(correctDing);
    mute(incorrectDing);

    root.isMuted = true;

    root.dispatchEvent({ type: SoundManagerEvent.muted });

  };

  /**
   * Unmute the managed audio.
   */
  root.unmute = function () {

    if (config.log) debug('unmuting');

    const unmute = (audio) => audio.setVolume(options.volume);

    gazeAudio.forEach(unmute);
    correctAudio.forEach(unmute);
    incorrectAudio.forEach(unmute);
    unmute(correctDing);
    unmute(incorrectDing);

    root.isMuted = false;

    root.dispatchEvent({ type: SoundManagerEvent.unmuted });

  };

  return root;

}

/**
 * Create a THREE.PositionalAudio instance from a loaded asset.
 *
 * @param {AudioListener} listener
 * @param {String} filename
 *
 * @return {PositionalAudio}
 */
function createPositionalAudioFromAsset(listener, filename) {

  const buffer = assets.get(filename);
  const audio = new PositionalAudio(listener);

  audio.name = filename;
  audio.setBuffer(buffer);
  audio.setRefDistance(10);

  return audio;

}


/**
 * Create a THREE.Audio instance from a loaded asset.
 *
 * @param {AudioListener} listener
 * @param {String} filename
 *
 * @return {Audio}
 */
function createAudioFromAsset(listener, filename) {

  const buffer = assets.get(filename);
  const audio = new Audio(listener);

  audio.name = filename;
  audio.setBuffer(buffer);

  return audio;
}


/**
 * Parent a PositionalAudio instance under another object and play it.
 *
 * @param {PositionalAudio} audio
 * @param {Object3D} obj
 */
function playAudioOnObject3D(obj, audio) {

  if (config.log) debug(`playing "${ audio.name }" on "${ obj.name }"`);

  if (audio.parent) audio.parent.remove(audio);

  obj.add(audio);

  if (audio.isPlaying) audio.stop();

  audio.play();

}

