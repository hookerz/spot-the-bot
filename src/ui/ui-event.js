/**
 * @typedef {Object} UIEvent
 *
 * Events used by the UI to communicate with the game across the event bus.
 *
 * @enum {String}
 * @readonly
 */
export const UIEvent = Object.freeze({
  start:   'UIEvent.start',
  action:  'UIEvent.action',
  enterVR: 'UIEvent.enterVR',
  exitVR:  'UIEvent.exitVR',
  unmute:  'UIEvent.unmute',
  mute:    'UIEvent.mute',
});
