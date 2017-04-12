import { PlayerRole } from '../player-manager';
import { GameStateManagerEvent, GameEndedReason } from '../game-state-manager';

/**
 * @typedef {Object} GamemodeServiceMap
 *
 * A map of common services the game mode might need.
 *
 * @property {NetworkInterface} network
 * @property {GameStateManager} gsm
 * @property {PlayerManager} players
 */

/**
 * @typedef {Object} GameAction
 *
 * A game state action.
 *
 * @property {String} type
 */

export const GameAction = {

  StartGame:      'StartGame',
  CorrectGuess:   'CorrectGuess',
  IncorrectGuess: 'IncorrectGuess',
  NextTarget:     'NexTarget',
  PauseTrack:     'PauseTrack',
  Pass:           'Pass',
  EndGame:        'EndGame',

};

/**
 * @typedef {Object} GamePhase
 *
 * The game phase, which helps enforce transitions and manage the UI.
 *
 * @enum {Symbol}
 * @readonly
 */
export const GamePhase = Object.freeze({

  idle:     'idle',
  ready:    'ready',
  running:  'running',
  finished: 'finished',

});

export default {

  /**
   * Initialize the game state for this game mode.
   *
   * @return {Object}
   */
  initialize() {
    return {
      mode: 'Rush',
      phase: GamePhase.ready,
    }
  },

  /**
   * Start the game.
   *
   * @param {Object} state
   * @param {GameAction} action
   * @param {GamemodeServiceMap} services
   *
   * @return {GameAction|undefined} A new game action, triggered by this game action.
   */
  [GameAction.StartGame]: function (state, action, services) {

    const { gsm, players } = services;

    Object.assign(state, {
      phase: GamePhase.running,

      roundStart: performance.now(),
      roundDuration: gsm.levelContext.difficulty.gameStartingTime,

      targetDescription: null,

      pauseCooldown: gsm.levelContext.difficulty.pauseCooldown,
      pauseTimestamp: null,

      passCooldown: gsm.levelContext.difficulty.passCooldown,
      passTimestamp: null,

      pauseCount: 0,
      passCount: 0,

      catchCount: 0,
      wrongCount: 0,

      gameCount: 0,
    });

    state.gameCount += 1;

    gsm.levelContext.resetDifficulty();
    gsm.time.timeRemaining = state.roundDuration;
    gsm.time.lastUpdateTime = performance.now();
    gsm.dispatchEvent({ type: GameStateManagerEvent.gameStarted, state });
    gsm.dispatchEvent({ type: GameStateManagerEvent.changed, state });

    if (players.role === PlayerRole.picker) {

      const target = gsm.levelContext.randomObjectDescription();
      return { type: GameAction.NextTarget, target };
    }
  },

  /**
   * Register a correct guess in the game state.
   *
   * @param {Object} state
   * @param {GameAction} action
   * @param {GamemodeServiceMap} services
   *
   * @return {GameAction} A new game action, triggered by this game action.
   */
  [GameAction.CorrectGuess]: function (state, action, services) {
    const { gsm, players } = services;
    const bonus = gsm.levelContext.difficulty.correctGuessBonus;

    if (state.phase !== GamePhase.running) {
      throw new Error('invalid game state: ' + state.phase.toString());
    }

    state.catchCount += 1;
    gsm.levelContext.nextRound(); // need to happen on both sides of the fence
    gsm.correctGuess();
    gsm.dispatchEvent({ type: GameStateManagerEvent.correct, bonus, state });
    gsm.dispatchEvent({ type: GameStateManagerEvent.changed, state });

    if (players.role === PlayerRole.picker) {
      return { type: GameAction.NextTarget, target: gsm.levelContext.randomObjectDescription() };
    }
  },

  /**
   * Register an incorrect guess in the game state.
   *
   * @param {Object} state
   * @param {GameAction} action
   * @param {GamemodeServiceMap} services
   *
   * @return {GameAction|undefined} A new game action, triggered by this game action.
   */
  [GameAction.IncorrectGuess]: function (state, action, services) {

    if (state.phase !== GamePhase.running) {
      throw new Error('invalid game state: ' + state.phase.toString());
    }

    const { gsm, players } = services;
    const penalty = gsm.levelContext.difficulty.incorrectGuessPenalty;

    state.wrongCount += 1;
    gsm.incorrectGuess();
    gsm.dispatchEvent({ type: GameStateManagerEvent.incorrect, penalty, state });
    gsm.dispatchEvent({ type: GameStateManagerEvent.changed, state });
  },

  /**
   * Store a new target description on the game state.
   *
   * @param {Object} state
   * @param {GameAction} action
   * @param {GamemodeServiceMap} services
   *
   * @return {GameAction|undefined} A new game action, triggered by this game action.
   */
  [GameAction.NextTarget]: function (state, action, services) {

    if (state.phase !== GamePhase.running) {
      throw new Error('invalid game state: ' + state.phase.toString());
    } else if (action.target === undefined) {
      throw new Error('action.target is missing')
    }

    state.targetDescription = action.target;

    const { gsm } = services;

    gsm.dispatchEvent({ type: GameStateManagerEvent.newTargetDescription, state });
    gsm.dispatchEvent({ type: GameStateManagerEvent.changed, state });
  },

  /**
   * Pause the game track.
   *
   * @param {Object} state
   * @param {GameAction} action
   * @param {GamemodeServiceMap} services
   *
   * @return {GameAction|undefined} A new game action, triggered by this game action.
   */
  [GameAction.PauseTrack]: function (state, action, services) {

    if (state.phase !== GamePhase.running) {
      throw new Error('invalid game state: ' + state.phase.toString());
    }

    const { gsm } = services;

    state.pauseTimestamp = performance.now();
    state.pauseCount += 1;

    gsm.pause();
    gsm.dispatchEvent({ type: GameStateManagerEvent.pauseTrack, state });
    gsm.dispatchEvent({ type: GameStateManagerEvent.changed, state });
  },

  /**
   * Pass the current target.
   *
   * @param {Object} state
   * @param {GameAction} action
   * @param {GamemodeServiceMap} services
   *
   * @return {GameAction|undefined} A new game action, triggered by this game action.
   */
  [GameAction.Pass]: function (state, action, services) {

    if (state.phase !== GamePhase.running) {
      throw new Error('invalid game state: ' + state.phase.toString());
    }

    const { gsm, players } = services;

    state.passTimestamp = performance.now();
    state.passCount += 1;

    gsm.dispatchEvent({ type: GameStateManagerEvent.pass, state });
    gsm.dispatchEvent({ type: GameStateManagerEvent.changed, state });

    if (players.role === PlayerRole.picker) {
      const target = gsm.levelContext.randomObjectDescription();
      return { type: GameAction.NextTarget, target };
    }
  },

  /**
   * Start the game.
   *
   * @param {Object} state
   * @param {GameAction} action
   * @param {GamemodeServiceMap} services
   *
   * @return {GameAction|undefined} A new game action, triggered by this game action.
   */
  [GameAction.EndGame]: function (state, action, services) {

    if (state.phase !== GamePhase.running) {
      throw new Error('invalid game state: ' + state.phase.toString());
    } else {
      state.phase = GamePhase.finished;
    }

    if (action.reason === undefined) {
      console.error('unknown game ended reason');
    }

    const { gsm } = services;

    gsm.dispatchEvent({ type: GameStateManagerEvent.gameEnded, state, reason: action.reason });
    gsm.dispatchEvent({ type: GameStateManagerEvent.changed, state });
  },
};
