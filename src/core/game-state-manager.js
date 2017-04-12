import Debug from 'debug';
import {EventDispatcher} from 'three';
import {descriptionDistance, LevelContext} from './robot-generator'
import {WorldEvent} from './world';
import {PlayerRole, PlayerEvent} from './player-manager'
import {default as gamemode, GamePhase, GameAction} from './gamemodes/gamemode-rush';
import { duration as correctAnimationDuration } from '../animation/celebrations';
import { NetworkEvent } from './networking/network-interface';
import config from './config';

const debug = Debug('app:gamestate');

export const GameStateManagerEvent = Object.freeze({
  newTargetDescription: 'newTargetDescription',
  strike:               'strike',
  correct:              'correct',
  incorrect:            'incorrect',
  pauseTrack:           'pauseTrack',
  unpauseTrack:         'unpauseTrack',
  pass:                 'pass',
  remainingSecsChanged: 'remainingSecsChanged',
  gameStarted:          'gameStarted',
  gameEnded:            'gameEnded',
  changed:              'changed',
  roomFull:             'roomFull',
  roomNotFull:          'roomNotFull',
  networkError:         'networkError',
  exiting:              'exiting',
});

export const GameEndedReason = Object.freeze({
  timeExpired:        'GameEndedReason.timeExpired',
  networkError:       'GameEndedReason.networkError',
  playerDisconnected: 'GameEndedReason.playerDisconnected',
});

export const maxTimeRemaining = 999.0;

/**
 * Manages the game state and shares it with other clients.
 */
export function GameStateManager(options) {
  if (options.world === undefined)   throw new Error('The game state manager requires options.world');
  if (options.players === undefined) throw new Error('The game state manager requires options.players');
  if (options.network === undefined) throw new Error('The game state manager requires options.network');

  let lvlContext = options.levelContext || LevelContext();
  let state = gamemode.initialize();
  let actionsRef = null;
  let disconnected = false;

  const {network, players, world} = options;

  const manager = Object.create(EventDispatcher.prototype, {

    state: {
      get() { return state },
      set() { throw new Error('The game state is read only.') }
    },

    networkInterface: {
      get() { return network; },
      set() { throw new Error('read-only'); },
    },

    playerManager: {
      get() { return players; },
      set() { throw new Error('read-only'); },
    },

    levelContext: {
      get() { return lvlContext; },
      set(value) { lvlContext = value; }
    },
    time: {
      value: {
        lastUpdateTime: 0,
        timeRemaining: 0,
        remainingSecs: 0,
      }
    },
    exitToMainMenu: {
      value: () => {
        manager.dispatchEvent({type: GameStateManagerEvent.exiting});
        window.location.reload() // this is a pretty lame hack for now
      }
    },
  });

  const gamemodeServices = {
    gsm: manager,
    players: options.players,
    network: options.network,
  };

  function pushStateAction(action) {
    if (disconnected) {
      if (config.log) debug('Cannot push an action while the network state is disconnected');
      return false;
    }

    if (config.log) debug(`pushing action ${ action.type }`);

    action.timestamp = options.network.time;

    actionsRef.push(action).catch(err => {
      debug('unable to write to gamestate actions');
      disconnected = true;
      manager.dispatchEvent({type: GameStateManagerEvent.networkError, state, error: 'unable to write to gamestate actions'});
    });

    return true;
  }

  manager.pushStateAction = pushStateAction;

  // POGO this event out
  network.addEventListener(NetworkEvent.disconnected, () => {
    // we don't really know why this has happened... but usually its because the other player closed the connection to the room
    disconnected = true;
    manager.dispatchEvent({type: GameStateManagerEvent.networkError, state, error: 'Network interface is disconnected'});
    if (state.phase === GamePhase.running) {
      let action = {type: GameAction.EndGame, reason: GameEndedReason.playerDisconnected };
      let pushed = pushStateAction(action);
      if (!pushed) {
        // we can't push state anymore so we need to manually call into gamemode
        gamemode[GameAction.EndGame](state, action, gamemodeServices);
      }
    }
  });

  manager.startGame = function () {
    return pushStateAction({type: GameAction.StartGame});
  };

  let lastCheckTime = null;
  const minRepeatTimeMS = 1500; // TODO: this should be synced with the pop-up time...

  manager.checkDescription = function (obj) {
    // prevent repeat selection of previously tried wrong answer
    const now = performance.now();
    if (lastCheckTime !== null) {
      const elapsedMS = now - lastCheckTime;
      if (obj === state.lastCheckedObj && elapsedMS < minRepeatTimeMS) {
        return false;
      }
    }

    lastCheckTime = now;
    state.lastCheckedObj = obj;

    const otherDescription = obj.userData.description || obj.description;
    const distance = descriptionDistance(state.targetDescription, otherDescription);
    const correct = (distance === 0);

    if (config.log) debug('guess distance ' + distance);

    if (correct) {
      lastCheckTime = null;
      pushStateAction({type: GameAction.CorrectGuess});
    } else {
      pushStateAction({type: GameAction.IncorrectGuess});
    }

    return correct;
  };

  function onStateAction(snapshot) {

    const action = snapshot.val();

    if (action === null || action.type === undefined) {
      throw new Error(`undefined action type on ${ action }`);
    }

    const handler = gamemode[action.type];
    if (handler) {
      if (config.log) debug(`applying action ${ action.type }`);

      const response = handler(state, action, gamemodeServices);
      if (response)
        pushStateAction(response);
    } else {
      if (config.log) debug(`unhandled action ${ action.type }`);
    }
  }

  function onRoleVacated() {
    if (state.phase === GamePhase.running) {
      pushStateAction({type: GameAction.EndGame, reason: GameEndedReason.playerDisconnected });
    }
    manager.dispatchEvent({type: GameStateManagerEvent.roomNotFull, state});
  }

  function onAllRolesFilled() {
    actionsRef = options.network.ref('gamestate-actions');
    actionsRef.on('child_added', onStateAction);
    manager.dispatchEvent({type: GameStateManagerEvent.roomFull, state});
  }

  world.addEventListener(WorldEvent.start, (event) => {
    // NOTE: for the helper-player, the room will already be full by time execution gets here...
    if (options.players.full) {
      onAllRolesFilled();
    } else {
      options.players.once(PlayerEvent.allRolesFilled, onAllRolesFilled);
    }

    options.players.addEventListener(PlayerEvent.roleVacated, onRoleVacated);
  });

  let isPaused = false;
  let pauseTimestamp;
  let pauseDurationMs;

  manager.pause = function () {
    pauseInternal(lvlContext.difficulty.pauseDuration);
  };

  function pauseInternal(duration) {

    isPaused = true;
    pauseTimestamp = performance.now();
    pauseDurationMs = duration * 1000;

  }

  manager.incorrectGuess = function() {
    manager.time.timeRemaining = Math.max(0, manager.time.timeRemaining + lvlContext.difficulty.incorrectGuessPenalty); // penalty is negative so add
    updateTime();
  };

  manager.correctGuess = function() {
    // we fake a clock pause by adding in the correctAnimationDuration + bonus
    manager.time.timeRemaining = Math.min(maxTimeRemaining, manager.time.timeRemaining + lvlContext.difficulty.correctGuessBonus + correctAnimationDuration);
    // update this manually here so we can force a visual refresh of the time while the clocking is 'paused' durning the animation
    manager.time.remainingSecs = Math.min(maxTimeRemaining, manager.time.remainingSecs + lvlContext.difficulty.correctGuessBonus);
    updateTime();
    pauseInternal(correctAnimationDuration);
  };

  function updateTime() {
    if (lastRemainingSecs != manager.time.remainingSecs) {
      manager.dispatchEvent(remainingSecsChangedEv);
      lastRemainingSecs = manager.time.remainingSecs;
    }
  }

  const remainingSecsChangedEv = {type: GameStateManagerEvent.remainingSecsChanged, time: manager.time};
  let lastRemainingSecs = -1;

  world.addEventListener(WorldEvent.update, (event) => {
    if (state.phase !== GamePhase.running)
      return;

    // NOTE: can't use event.dt here, need to use absolute time
    const now = performance.now();
    const delta = (now - manager.time.lastUpdateTime) / 1000.0;
    manager.time.lastUpdateTime = now;
    manager.time.timeRemaining = Math.max(0, manager.time.timeRemaining - delta);
    manager.time.remainingSecs = Math.max(0, Math.ceil(manager.time.timeRemaining));

    if (isPaused && (performance.now() >= (pauseTimestamp + pauseDurationMs))) {
      isPaused = false;
    }

    if (isPaused)
      return;

    updateTime();

    if (options.players.role === PlayerRole.picker && manager.time.remainingSecs <= 0) {
        pushStateAction({type: GameAction.EndGame, reason: GameEndedReason.timeExpired});
    }
  });

  // DEBUG:
  window.gsm = manager;
  window.state = state;

  return manager;
}
