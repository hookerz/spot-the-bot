// Patch on/off/emit into the three.js EventDispatcher.

import { EventDispatcher } from 'three';

EventDispatcher.prototype.on = function (type, listener) {

  this.addEventListener(type, listener);

};

EventDispatcher.prototype.off = function (type, listener) {

  this.removeEventListener(type, listener);

};

EventDispatcher.prototype.once = function (type, listener) {

  const closure = (event) => {

    this.removeEventListener(type, closure);
    listener.call(this, event);

  };

  this.addEventListener(type, closure);

};

EventDispatcher.prototype.emit = function (event, data = {}) {

  data.type = event;
  this.dispatchEvent(data)

};

// Add vector constants.

import { Vector3, Vector2 } from 'three';

Vector2.ZERO  = new Vector2(0, 0);
Vector2.POS_X = new Vector3(+1, 0);
Vector2.NEG_X = new Vector3(-1, 0);
Vector2.POS_Y = new Vector3(0, +1);
Vector2.NEG_Y = new Vector3(0, -1);

Vector3.ZERO  = new Vector3(0, 0, 0);
Vector3.POS_X = new Vector3(+1, 0, 0);
Vector3.NEG_X = new Vector3(-1, 0, 0);
Vector3.POS_Y = new Vector3(0, +1, 0);
Vector3.NEG_Y = new Vector3(0, -1, 0);
Vector3.POS_Z = new Vector3(0, 0, +1);
Vector3.NEG_Z = new Vector3(0, 0, -1);
