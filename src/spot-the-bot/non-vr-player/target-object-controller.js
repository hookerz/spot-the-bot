import { Vector2, Math as MathExt } from 'three';
import { WorldEvent } from '../../core/world';
import is from 'is_js';

/**
 * Create a rotation controller for the target objects. It modifies the target
 * rotation directly instead of orbiting a camera. By default, a drag across
 * the full length of the smaller dimension of the canvas will rotate the object
 * 180 degrees.
 *
 * @constructor
 *
 * @param {Object} options
 *
 * @param {World} options.world - The world object.

 * @param {Object3D} [options.target]
 *
 * @param {Boolean} [options.enableMouse] - If true, respond to mouse events.
 * @param {Boolean} [options.enableTouch] - If true, respond to touch events.
 *
 * @param {Number} [options.yawMultiplier] - A multiplier for the yaw (horizontal) sensitivity.
 * @param {Number} [options.pitchMultiplier] - A multiplier for the pitch (vertical) sensitivity.
 *
 * @param {Number} [options.draggingInterpolation] - An interpolation factor while dragging, between 0 and 1. A higher
 *   number will make dragging more "responsive" while decreasing the amount of drift.
 *
 * @param {Number} [options.driftingInterpolation] - An interpolation factor while drifting (after the user has released
 *   the drag), between 0 and 1. A higher number will make the object come to rest faster after a fast swipe.
 *
 * @return {TargetObjectController}
 */
export function TargetObjectController(options) {

  if (options.world === undefined) throw new Error('options.world is required');

  options = Object.assign({
    enableMouse: true,
    enableTouch: true,

    yawMultiplier: is.desktop() ? 3.0 : 1.0,
    pitchMultiplier: is.desktop() ? 9.0 : 3.0,

    draggingInterpolation: 0.5,
    driftingInterpolation: 0.1,

    timeoutForAutoRotate: 15000, // 15 seconds

    autoRotationSpeed: 1.0,
    autoRotationMaxAngle: Math.PI / 4.0,

    stiffness: 1000,
    damping: 30,
    yDampen: 6,

    zoomEnabled: true,
    zoomSpeed: 0.5,
    zoomOutMin: 0.5,
    zoomOutMax: 1.5,
  }, options);

  // the object modified by the controller
  let { target, world } = options;

  // true while the controller is enabled
  let enabled = true;
  let touchEnabled = true;
  let dragging = false;
  let pinchZooming = false;
  let touchIdentifier = null; // used to match touch start and touch end events to the same touch

  // constrain rotation to the x/y axis so the model doesn't get sideways
  let xRot = 0;
  let yRot = 0;
  let xVel = 0;
  let yVel = 0;
  // prevent flipping over
  const xMax =  Math.PI * 0.5 * 0.75;
  const xMin = -Math.PI * 0.5 * 0.75;
  // DEBUG for tweaking spring and yDampen
  window.rotationOptions = options;

  const initialMouse = new Vector2();
  const currentMouse = new Vector2();
  const previousMouse = new Vector2();

  // keep track of the user touching the screen, if they don't do anything for 15 seconds, auto-rotate the bot
  let lastInteractionTime = performance.now();
  let autoRotating = null; // null: haven't rotated, true: rotating, false: rotated once and not rotating anymore
  let autoRotationStart = null; // the time the auto rotation was started from performance.now()
  let autoRotateStartYRot = 0.0;
  let capturedElement = null;

  let zoom = 1.0;

  function setCapture(elm) {
    capturedElement = elm;
  }

  function isEventForUs(event, elm) {
    return event.target === elm || event.target === capturedElement;
  }

  function trackInteraction() {
    if (autoRotating) {
      autoRotating = false; // will never auto-rotate again
    }
    lastInteractionTime = performance.now();
  }

  function attachListeners() {

    if (options.enableMouse) {
      world.canvas.addEventListener('mousedown', onMouseDown, false);
      // use window for these to we fake a mouse capture...ugh
      window.addEventListener('mousemove', onMouseMove, false);
      window.addEventListener('mouseup', onMouseUp, false);
    }

    if (options.enableTouch) {
      world.canvas.addEventListener('touchstart', onTouchStart, false);
      world.canvas.addEventListener('touchmove', onTouchMove, false);
      world.canvas.addEventListener('touchend', onTouchEnd, false);
    }

    if (options.zoomEnabled)
      window.addEventListener('wheel', onMouseWheel, false);

    window.addEventListener('mouseout', onMouseOut, false);

    world.addEventListener(WorldEvent.update, update);
  }

  function detachListeners() {

    world.canvas.removeEventListener('mousedown', onMouseDown, false);
    window.removeEventListener('mousemove', onMouseMove, false);
    window.removeEventListener('mouseup', onMouseUp, false);

    world.canvas.removeEventListener('touchstart', onTouchStart, false);
    world.canvas.removeEventListener('touchmove', onTouchMove, false);
    world.canvas.removeEventListener('touchend', onTouchEnd, false);

    window.removeEventListener('wheel', onMouseWheel, false);

    window.removeEventListener('mouseout', onMouseOut, false);

    world.removeEventListener(WorldEvent.update, update);
  }

  function onMouseWheel(event) {
    if(!options.zoomEnabled)
      return;

    trackInteraction();

    event.preventDefault();
    event.stopPropagation();

    const delta = event.deltaY;
    zoom = Math.min(options.zoomOutMax, Math.max(options.zoomOutMin, zoom - delta * options.zoomSpeed));
  }

  function onMouseDown(event) {
    event.preventDefault();
    setCapture(world.canvas);
    onDragStart(event.clientX, event.clientY);
  }

  function onMouseMove(event) {
    // this is global so we have check if its our event
    if (dragging || isEventForUs(event, world.canvas)) {
      event.preventDefault();
      onDragMove(event.clientX, event.clientY);
    }
  }

  function onMouseUp(event) {
    // this is global so we have check if its our event
    if (dragging || isEventForUs(event, world.canvas)) {
      event.preventDefault();
      onDragStop(event.clientX, event.clientY);
      capturedElement = null;
    }
  }

  function onTouchStart(event) {
    if(!touchEnabled)
      return;

    event.preventDefault();

    if (event.touches.length === 1) {
      // drag start if have only 1 touch event
      const touch = event.changedTouches[0];
      touchIdentifier = touch.identifier;
      onDragStart(touch.clientX, touch.clientY);
    } else if (event.touches.length > 1) {
      // 2+ touches is a pinch zoom operation
      pinchZooming = true;
      dragging = false;
      trackInteraction();
    }
  }

  let previousTouchDist = null;
  function onTouchMove(event) {
    if(!touchEnabled)
      return;

    event.preventDefault();

    if (dragging) {
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        if (touch.identifier === touchIdentifier) {
          return onDragMove(touch.clientX, touch.clientY);
        }
      }
    }

    if (pinchZooming) {
      trackInteraction();
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if(previousTouchDist === null) {
        previousTouchDist = dist;
      } else {
        const delta = dist - previousTouchDist;
        if(Math.abs(delta) > 5) {
          const sign = Math.sign(delta);
          previousTouchDist = dist;
          zoom = Math.min(options.zoomOutMax, Math.max(options.zoomOutMin, zoom + 0.1 * -sign * options.zoomSpeed));
        }
      }
    }
  }

  function onTouchEnd(event) {
    if(!touchEnabled)
      return;

    event.preventDefault();
    onTouchEndInternal(event);
  }

  function onTouchEndInternal(event) {
    if (dragging) {
      // if we were dragging and lost of a touch, we must be done dragging (zero touches)
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        if (touch.identifier === touchIdentifier) {
          return onDragStop(touch.clientX, touch.clientY);
        }
      }
      touchIdentifier = null;
      dragging = false;
    }

    if (pinchZooming) {
      // if are pinch zooming and we loose a touch...
      if (event === undefined || event.touches.length === 0) {
        // manual call or no touches left, kill all interactions
        pinchZooming = false;
        dragging = false;
        previousTouchDist = null;
        touchIdentifier = null;
      } else if (event.touches.length === 1) {
        // revert to dragging by starting a new drag
        pinchZooming = false;
        previousTouchDist = null;
        // start a new drag
        const touch = event.touches[0];
        touchIdentifier = touch.identifier;
        onDragStart(touch.clientX, touch.clientY);
      } else {
        // no change, still at least 2 touch points left
      }
    }
    trackInteraction();
  }

  function onMouseOut(event) {
    if (event.clientX <= 0 || event.clientX >= world.canvas.width ||
        event.clientY <= 0 || event.clientY >= world.canvas.height) {
      if (dragging) {
        onDragStop();
        capturedElement = null;
      }
    }
  }

  /**
   * Normalize a canvas mouse/touch event client coordinates. The smaller canvas
   * dimension will be used to normalize the coordinates, so the coordinates are
   * [-1,+1] in the minor axis and [-aspect,+aspect] in the major axis. The
   * coordinates are either written them to an existing or a new Vector2.
   *
   * @param {Number} clientX - The event's clientX property.
   * @param {Number} clientY - The event's clientY property.
   * @param {Vector2} [out] - The vector to write the coordinates to.
   *
   * @return {Vector2} The out vector if provided, or a new vector.
   */
  function normalizeClientCoordinates(clientX, clientY, out) {
    const { canvas } = options.world;
    const size = Math.min(canvas.width, canvas.height) * 0.5;
    const mouseX = (clientX - size) / size;
    const mouseY = (clientY - size) / size;
    return out ? out.set(mouseX, mouseY) : new Vector2(mouseX, mouseY);
  }

  function onDragStart(clientX, clientY) {
    trackInteraction();

    if (dragging === true)
      return;

    normalizeClientCoordinates(clientX, clientY, initialMouse);

    // start the drag with zero mouse movement
    currentMouse.copy(initialMouse);
    previousMouse.copy(initialMouse);

    dragging = true;
  }

  function onDragMove(clientX, clientY) {
    trackInteraction();

    if (dragging === false)
      return;

    previousMouse.copy(currentMouse);
    normalizeClientCoordinates(clientX, clientY, currentMouse);
  }

  function onDragStop() {
    trackInteraction();

    if (dragging === false)
      return;

    touchIdentifier = null;
    dragging = false;
  }

  function update() {
    if (!target)
      return;
    if (dragging) {

      let xRotDelta = (currentMouse.y - previousMouse.y) * Math.PI * options.pitchMultiplier;
      let yRotDelta = (currentMouse.x - previousMouse.x) * Math.PI * options.yawMultiplier;

      // scale the xRotDelta by the current value of xRot to make hard to move the closer to the target angle we are (fake resistance)
      const xP = Math.abs(xRot) / xMax;
      if ((xRot > 0 && xRotDelta > 0) || (xRot < 0 && xRotDelta < 0))
       xRotDelta = xRotDelta * (1 - xP) * (1 - xP) * (1 - xP);

      xRot += xRotDelta;
      yRot += yRotDelta;
      xVel = 0.0;
      yVel = yRotDelta / world.currentTimeEvent.dt;

      // clamp range on xRot
      if (xRot > xMax) xRot = xMax;
      if (xRot < xMin) xRot = xMin;

      target.rotation.set(xRot, yRot, 0, 'XYZ');

      // required because if the mouse or touch point don't move we would still have a delta here...
      previousMouse.copy(currentMouse);

    } else {
      // check for auto-rotation first:
      const now = performance.now();
      const timeSinceLastInteraction = now - lastInteractionTime;
      if (autoRotating == null && timeSinceLastInteraction > options.timeoutForAutoRotate) {
        autoRotating = true;
        autoRotationStart = now;
        autoRotateStartYRot = yRot;
      }

      if (autoRotating) {
        const autoRotationElapsed = now - autoRotationStart;
        yRot = Math.sin(autoRotationElapsed * options.autoRotationSpeed / 1000.0) * options.autoRotationMaxAngle + autoRotateStartYRot;
        xRot = 0; // it should already have spung back to zero if the auto-rotation is going...
        xVel = 0;
        yVel = 0;

      } else {
        // spring xRot back to zero
        const F = springForce(xRot, xVel, options.stiffness, options.damping);
        xVel += F * world.currentTimeEvent.dt;
        xRot = xRot + xVel * world.currentTimeEvent.dt;
        // continue yRot by yVel with some dampening
        yRot += yVel * world.currentTimeEvent.dt;
        yVel -= yVel * world.currentTimeEvent.dt * options.yDampen;
      }

      target.rotation.set(xRot, yRot, 0, 'XYZ');
    }
  }

  const controller = {

    get enabled() { return enabled; },
    set enabled(value) { value ? controller.enable() : controller.disable(); },

    get touchEnabled() { return touchEnabled; },
    set touchEnabled(value) {
      touchEnabled = value;
      if(!value) {
        onTouchEndInternal();
      }
    },

    get target() {return target;},
    set target(value) {
      if (value.isObject3D !== true) {
        window.target = null;
        throw new Error('The controller target must be an Object3D');
      } else if (dragging) {
        console.warn('Changing the target while the controller is enabled can lead to unexpected snapping.')
      }

      target = value;
      xRot = 0;
      yRot = 0;

      // DEBUG
      window.target = target;
    },
    enable() {
      if (enabled === true) return;

      enabled = true;

      attachListeners();
    },
    disable() {
      if (enabled === false) return;

      enabled = false;
      dragging = false;

      detachListeners();
    },
    get zoom() { return zoom; },
    get lastInteractionTime() { return lastInteractionTime; },
  };

  if (target) {
    enabled = true;
    attachListeners(); // start attached
  }

  // DEBUG
  //window.targetObjectController = controller;
  //window.targetObjectControllerOptions = options;

  return controller;
}

function springForce(offset, speed, stiffness, damping) {
  const force = -stiffness * offset;
  return force - (damping * speed); // dampen force
}

