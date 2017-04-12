import {GameStateManagerEvent, GameEndedReason} from './game-state-manager'


/*

export const GameStateManagerEvent = {

  newTargetDescription: 'newTargetDescription',
  strike: 'strike',
  correct: 'correct',
  incorrect: 'incorrect',
  pauseTrack: 'pauseTrack',
  unpauseTrack: 'unpauseTrack',
  pass: 'pass',
  remainingSecsChanged: 'remainingSecsChanged',

  gameStarted: 'gameStarted',
  gameEnded: 'gameEnded',

  changed: 'changed',

  roomFull: 'roomFull',
  roomNotFull: 'roomNotFull',

  networkError: 'networkError',

};


 */

export function Tracking(gsm) {

  if (window.ga === undefined)
    window.ga = function () {console.log("ga not initialized yet")};

  gsm.addEventListener(GameStateManagerEvent.gameStarted, (event) => {
    let startType = 'first-game';
    if (event.state && event.state.gameCount > 1) {
      startType = "replay";
    }
    ga('send', 'event', 'game', 'started', startType, event.state.gameCount);
  });
  gsm.addEventListener(GameStateManagerEvent.correct,     (event) => ga('send', 'event', 'game', 'correct'));
  gsm.addEventListener(GameStateManagerEvent.incorrect,   (event) => ga('send', 'event', 'game', 'incorrect'));
  gsm.addEventListener(GameStateManagerEvent.pauseTrack,  (event) => ga('send', 'event', 'game', 'pauseTrack'));
  gsm.addEventListener(GameStateManagerEvent.pass,        (event) => ga('send', 'event', 'game', 'skip'));
  gsm.addEventListener(GameStateManagerEvent.roomFull,    (event) => ga('send', 'event', 'game', 'roomFull'));
  gsm.addEventListener(GameStateManagerEvent.networkError,(event) => ga('send', 'event', 'game', 'networkError', event.error));
  gsm.addEventListener(GameStateManagerEvent.exiting,     (event) => ga('send', 'event', 'game', 'exiting'));
  gsm.addEventListener(GameStateManagerEvent.gameEnded,   (event) => {
    let score = -1;
    if (event.state && event.state.catchCount)
      score = event.state.catchCount;
    ga('send', 'event', 'game', 'ended', event.reason, score);
  });
}
