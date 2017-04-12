import { Vector3, Raycaster, EventDispatcher, Quaternion } from 'three';
import { WorldEvent } from './world';
import Debug from 'debug';
import OrientationArmModel from './orientation-arm-model';
import config from './config';
import is from 'is_js';

const debug = Debug('app:gazeSelector');

export const GazeSelectorEvent = Object.freeze({
  selected:         'GazeSelectorEvent.selected',
  deselected:       'GazeSelectorEvent.deselected',
  selectionChanged: 'GazeSelectorEvent.selectionChanged',
  triggerDown:      'GazeSelectorEvent.triggerDown',
  triggerUp:        'GazeSelectorEvent.triggerUp',
  triggerPulled:    'GazeSelectorEvent.triggerPulled',
  gazeBegin:        'GazeSelectorEvent.gazeBegin',
  gazeEnd:          'GazeSelectorEvent.gazeEnd',
  gazeChanged:      'GazeSelectorEvent.gazeChanged',
  gazeContinue:     'GazeSelectorEvent.gazeContinue',
  gazeTrackingOff:  'GazeSelectorEvent.gazeTrackingOff',
  gazeTrackingOn:   'GazeSelectorEvent.gazeTrackingOn',
});


function isVisible(obj) {
  let cur = obj;
  while (cur) {
    if (cur.visible === false) {
      return false;
    }
    cur = cur.parent;
  }
  return true;
}

export function GazeSelector(world, options={}) {
  // option defaults
  options = Object.assign({
    maxTriggerTimeDelta: 1000,
    maxDistMove: 10,
    requireUserDataSelectable: false, // when true only consider objects with object.userData.selectable === true for selection
    keepSelection: true,
    checkUserData: true,
    recursiveHitTesting: true,
    enableKeypressTrigger: false,
    controllerHandler: null,
  }, options);

  const {camera, canvas, scene} = world;
  const raycaster = new Raycaster();
  const castVector = new Vector3(0,0,0);
  const touchTimes = {};
  const controllerHandler = options.controllerHandler;
  const isMobile = is.mobile();


  let gs = Object.create(EventDispatcher.prototype, {});
  gs.gazeTracking = true;
  // these are for head tracking only, the  games store their own state...
  gs.gazeObject = null;
  gs.selectedObject = null;
  gs.prevGazeObject = null;

  const gamePadState = {};
  const maxButtonDepth = 3; // how deep into the button list to check on the game pads for trigger pulls

  window.gamePadState = gamePadState;

  gs.selectableObjects = undefined; // sub-set of objects to ray-cast for selection...

  // re-usable event objects to avoid re-creating them over and over
  const triggerDownEvent = {type: GazeSelectorEvent.triggerDown, gazeTracker: gs, gamepad: null};
  const triggerUpEvent = {type: GazeSelectorEvent.triggerUp, gazeTracker: gs, gamepad: null};


  const isLaserPointerGamePad = gamepad => gamepad && gamepad.pose !== null && gamepad.pose !== undefined && gamepad.pose.hasOrientation;
  const isArmModelGamePad = gamepad => isLaserPointerGamePad(gamepad) && gamepad.pose.hasPosition === false;

  function triggerDown(gamepad, object) {
    if (!object) {
      const intersection = isLaserPointerGamePad(gamepad) ? closestLaserPtrHit(undefined, gamepad) : closestGazeHit();
      object = intersection ? intersection.object : null;
    }
    triggerDownEvent.gamepad = gamepad || null;
    gs.dispatchEvent( triggerDownEvent );
    if (object && object.userData.onTriggerDown)
      object.userData.onTriggerDown(triggerDownEvent);
  }

  function triggerUp(gamepad, object) {
    if (!object) {
      const intersection = isLaserPointerGamePad(gamepad) ? closestLaserPtrHit(undefined, gamepad) : closestGazeHit();
      object = intersection ? intersection.object : null;
    }
    triggerUpEvent.gamepad = gamepad || null;
    gs.dispatchEvent( triggerUpEvent );
    if (object && object.userData.onTriggerUp)
      object.userData.onTriggerUp(triggerUpEvent);
  }

  function triggerPulled(gamepad) {
    const intersection = isLaserPointerGamePad(gamepad) ? closestLaserPtrHit(undefined, gamepad) : closestGazeHit();
    const hitObject = intersection ? intersection.object : null;
    const prevSelected = gs.selectedObject;

    if (hitObject !== prevSelected) {
      gs.selectedObject = hitObject;

      if (prevSelected) {
        prevSelected.dispatchEvent({type: GazeSelectorEvent.deselected, object: prevSelected});
      }

      gs.dispatchEvent({type: GazeSelectorEvent.selectionChanged, object: gs.selectedObject, gazeSelector: gs, prevObject: prevSelected, intersection: intersection});

      if (gs.selectedObject) {
        const event = {type: GazeSelectorEvent.selected, object: gs.selectedObject, intersection: intersection};
        gs.selectedObject.dispatchEvent(event);

        if (gs.selectedObject.userData.onClicked) {
          gs.selectedObject.userData.onClicked(event);
        }
      }
    }

    gs.dispatchEvent({type: GazeSelectorEvent.triggerPulled});

    if (options.keepSelection === false) {
      gs.selectedObject = null;
    }

    return hitObject; // so the up event can re-use this...
  }

  canvas.addEventListener('touchstart', (event) => {
    const now = Date.now();
    for (let i=0; i < event.changedTouches.length; i++) {
      touchTimes[event.changedTouches[i].identifier] = now;
    }
    // setup case ray for center of the screen
    castVector.set(0,0,0);
    triggerDown();
  });

  canvas.addEventListener('touchend', (event) => {
    const now = Date.now();
    let hitObject = null;
    for (let i=0; i < event.changedTouches.length; i++) {
      const diff = now - touchTimes[event.changedTouches[i].identifier];
      if (diff < options.maxTriggerTimeDelta) {
        // setup case ray for center of the screen
        castVector.set(0,0,0);
        hitObject = triggerPulled()
      }
    }
    triggerUp(hitObject);
  });

  if(options.enableKeypressTrigger) {
    window.addEventListener('keypress', (event) => {
      let code = event.which || event.keyCode;
      if (code === 32)
        triggerPulled();
    });
  }

  canvas.addEventListener('click', (event) => {
    if (isMobile) {
      // touch events don't happen when the native cardboard ui is being used, WTF
      // instead you get a simulated click when the trigger first touches (a down followed by an immediate up)
      castVector.set(0,0,0);
      triggerPulled();
    } else {
      // mouse click
      const x = ( event.clientX / window.innerWidth ) * 2 - 1;
      const y = -( event.clientY / window.innerHeight ) * 2 + 1;
      castVector.set(x, y, 0);
      triggerPulled();
    }
  });

  function checkIntersection(intersected)
  {
    // no intersections
    if (intersected.length === 0) {
      return null;
    }

    // take the first one if any object3d is selectable
    if (options.checkUserData === false) {
      return intersected[0];
    }

    // else we have to look for the first object that has obj.userData.selectable = true
    for (let i=0; i < intersected.length; i++) {
      const obj = intersected[i].object;
      if (obj.userData.selectable === true && isVisible(obj)) {
        if (obj.userData.selectableParent) {
          return obj.userData.selectableParent; // allow a sub-object to defer to the parent
        }
        return intersected[i];
      }
    }
  }

  const tempPos = new Vector3();
  const orientation = new Quaternion(0, 0, 0, 1);
  const forward = new Vector3(0,0,-1);
  function closestLaserPtrHit(objects, gamepad) {
    if (!gamepad || !gamepad.pose || gamepad.pose.hasOrientation === false || gamepad.pose.orientation === null)
      return;

    const pose = gamepad.pose;
    const root = gamePadState[gamepad.index].root;
    objects = objects || gs.selectableObjects || scene.children; // scene.children is BAD idea

    // position tracking won't be available for the daydream tracker...there might be a better default position, could pull from the reference controller model...
    const pos = pose.hasPosition ? tempPos.fromArray(pose.position) : root.position;
    orientation.fromArray(pose.orientation);
    forward.set(0, 0, -1);
    forward.applyQuaternion(orientation);
    raycaster.set(pos, forward);
    const intersected = raycaster.intersectObjects(objects, options.recursiveHitTesting);
    return checkIntersection(intersected);
  }

  function closestGazeHit(objects) {
    objects = objects || gs.selectableObjects || scene.children; // scene.children is BAD idea
    // we assume the callee has set castVector before calling... which is lame...
    raycaster.setFromCamera(castVector, camera);
    const intersected = raycaster.intersectObjects(objects, options.recursiveHitTesting);
    return checkIntersection(intersected);
  }

  const tempQ = new Quaternion();
  const updateGamepad = function (gamepad) {
    const state = gamePadState[gamepad.index];
    if (!state || !state.root)
      return;

    const root = state.root;
    // we have to update this every frame because firefox starts with gamepad pose.hasOrientation === false no matter what
    root.visible = isLaserPointerGamePad(gamepad);
    if (!root.visible || !gamepad.pose) {
      return;
    }

    const armModel = state.armModel;
    const pose = gamepad.pose;
    if (armModel) {
      if (pose.hasOrientation && pose.orientation) {
        tempQ.set(pose.orientation[0], pose.orientation[1], pose.orientation[2], pose.orientation[3]);
        armModel.setControllerOrientation(tempQ);
        armModel.setHeadOrientation(world.camera.quaternion);
        armModel.setHeadPosition(world.camera.position);
        armModel.update();
        root.position.copy(armModel.pose.position);
        root.quaternion.copy(armModel.pose.orientation);
      }
    } else {
      if (pose.hasPosition && pose.position) {
        root.position.set(pose.position[0], pose.position[1], pose.position[2]);
      } else {
        root.position.set(0.2, -0.75, -0.5);
      }
      if (pose.hasOrientation && pose.orientation) {
        root.quaternion.set(pose.orientation[0], pose.orientation[1], pose.orientation[2], pose.orientation[3]);
      }
    }
  };

  const createGamePadState = function(gamepad) {
    const isLaserPointer = isLaserPointerGamePad(gamepad);
    const isArmModel = isArmModelGamePad(gamepad);

    if (config.log) debug("NEW game pad found: " + gamepad.id + ", index:" + gamepad.index + " isLaserPointerGamePad: " + isLaserPointer);

    const state = {
      gamepadIndex: gamepad.index,
      gazeObject: null,
      selectedObject: null,
      prevDownState: {},
      prevGaze: null,
      onOver: null,
      onHold: null,
      onOut: null,
      isPointer: isLaserPointer,
      armModel: isArmModel ? new OrientationArmModel() : null,
      root: null,
    };

    let root = null;
    if (controllerHandler) {
      const handler = controllerHandler(gamepad);
      root = handler.root;
      state.root = root;
      state.onOver = handler.onOver;
      state.onHold = handler.onHold;
      state.onOut = handler.onOut;
      scene.add(state.root);
    }

    gamePadState[gamepad.index] = state;
    updateGamepad(gamepad);

    return state;
  };

  const deleteGamepadRoot = function (index) {
    const state = gamePadState[index];
    if (state && state.root) {
      const root = state.root;
      // fire event here...
      if (root) {
        if (config.log) debug("Game pad was removed: " + index);
        root.userData.gamepad = null;
        scene.remove(root);
      }
    }

    delete gamePadState[index];
  };

  // reused event object to avoid re-creating ever frame during gaze over...
  const gazeContinueEvent = {
    type: GazeSelectorEvent.gazeContinue,
    object: null,
    gazeSelector: gs,
    intersection: null
  };

  // these only work on firefox (or chrome for android now...), use this to prevent calling navigator.getGamepads() every frame since it generates a new array each time
  let cachedGamePads = null;
  window.addEventListener("gamepadconnected", function(e) {

    if (config.log) debug("gamepadconnected fired");

    cachedGamePads = navigator.getGamepads();

    if (!gamePadState[e.gamepad.index]) {
      createGamePadState(e.gamepad);
    }
  });

  window.addEventListener("gamepaddisconnected", function(e) {

    if (config.log) debug("gamepaddisconnected fired");

    if (gamePadState[e.gamepad.index]) {
      deleteGamepadRoot(e.gamepad.index);
    }

    // NOTE: the game page will still be in the list, so we need to manually remove it from our cached list
    // if you call cachedGamePads = navigator.getGamepads(), it will still be in the list there too!
    cachedGamePads.splice(e.gamepad.index);
  });

  function handleIntersection(tracker, intersection) {
    let hitObject = intersection ? intersection.object : null;

    if (tracker.prevGaze !== hitObject) {
      tracker.gazeObject = hitObject;

      if (tracker.prevGaze) {
        const event = {type: GazeSelectorEvent.gazeEnd, object: tracker.prevGaze};
        tracker.prevGaze.dispatchEvent(event);

        if (tracker.prevGaze.userData.onGazeOut) {
          tracker.prevGaze.userData.onGazeOut(event);
        }

        if (tracker.onOut){
          tracker.onOut(tracker, tracker.prevGaze)
        }

      }

      gs.dispatchEvent({type: GazeSelectorEvent.gazeChanged, object: tracker.gazeObject, gazeSelector: gs, prevObject: tracker.prevGaze, intersection: intersection });

      if (hitObject) {
        const event = {type: GazeSelectorEvent.gazeBegin, object: hitObject, intersection: intersection};
        hitObject.dispatchEvent(event);

        if (hitObject.userData.onGazeOver) {
          hitObject.userData.onGazeOver(event);
        }

        if (tracker.onOver){
          tracker.onOver(tracker, hitObject);
        }

      }
    } else if (hitObject) {
      // gaze is still over the same object, but we might need to update the position of the gaze cursor over time if the object is moving
      gazeContinueEvent.object = hitObject;
      gazeContinueEvent.intersection = intersection;
      gs.dispatchEvent(gazeContinueEvent);

      if (hitObject.userData.onGazeContinue) {
        hitObject.userData.onGazeContinue(gazeContinueEvent);
      }

      if (tracker.onHold){
        tracker.onHold(tracker, hitObject);
      }
    }

    tracker.prevGaze = hitObject;
  }

  // NOTE: oculus will return 3-4 controllers

  let useCachedGamepads = null;
  let pointerGamePadCount = 0;
  world.addEventListener(WorldEvent.update, () => {

    pointerGamePadCount = 0;

    if (navigator.getGamepads) {
      // NOTE: chrome returns the same array each time that is statically sized to 4, but the game pad instances are temporary snapshots
      // firefox on the other, returns a different array each time, but the gamepad instances are the same... wtf

      // HACK: this is a pretty big hack here to handle the case were we are getting the connect disconnect events but also getting temp array objects
      // this happens on android chrome/daydream ONLY, otherwise we only see those events in firefox... wtf
      if (useCachedGamepads === null) {
        const gp = navigator.getGamepads();
        if (gp.length === 4 && gp[3] === null) { // this will fail if the player actually have 4 gamepads...(i.e. oculus with remote+xbox)
          useCachedGamepads = false;
        } else {
          useCachedGamepads = true;
        }
      }
      let pads = useCachedGamepads ? cachedGamePads : navigator.getGamepads();
      if (pads) { // this can be null if we are in firefox and no controller buttons have been pressed yet
        for (let i = 0; i < pads.length; i++) {
          const pad = pads[i];
          // chromes leave the array the same size even if game pads go away so we have to check for null to find out if a gamepad disconnected
          if (pad === null || pad === undefined) {
            // this assume pad.index === i, which it should based on the spec...
            deleteGamepadRoot(i);
            continue;
          }
          let state = gamePadState[pad.index];
          let triggerPulledThisFrame = false; // tracked per-gamepad
          // at this point we have a controller, but we are not sure if its been seen before...
          // use state/state.prevDownState tracking to check
          // lets get weird and support a press of ANY button up to a certain priority depth
          const depth = Math.min(maxButtonDepth, pad.buttons.length); // maxButtonDepth is very app specific, need to factor out
          for (let j = 0; j < depth; j++) {
            const button = pad.buttons[j];
            //if (state && state.prevDownState[j] !== undefined && state.prevDownState[j] !== null) {
            if (state) {
              const prevState = state.prevDownState[j];
              // we have seen this controller before...
              if (prevState === true && button.pressed === false) {
                // button is released
                if (triggerPulledThisFrame === false) { // prevent multiple trigger pulls on single frame from the same controller
                  if (config.log) debug("Game pad button UP: " + pad.id + " button:" + j);
                  triggerPulledThisFrame = true;
                  updateGamepad(pad);
                  triggerPulled(pad);
                  triggerUp(pad);
                }
              }

              if (prevState === false && button.pressed === true) {
                // button is pressed down
                if (config.log) debug("Game pad button DOWN: " + pad.id + " button:" + j);
                triggerDown(pad);
              }
            } else {
              // first time have seen this controller...or its reappearing
              state = createGamePadState(pad);
              if (button.pressed === true) {
                // button is pressed down
                if (config.log) debug("Game pad button DOWN: " + pad.id + " button:" + j);
                triggerDown(pad);
              }
            }
            state.prevDownState[j] = button.pressed;
          }

          updateGamepad(pad);
          if (isLaserPointerGamePad(pad)) {
            pointerGamePadCount += 1;
            if (!triggerPulledThisFrame)
              handleIntersection(gamePadState[pad.index], closestLaserPtrHit(undefined, pad));
          } else {
            if (!triggerPulledThisFrame)
              handleIntersection(gamePadState[pad.index], closestGazeHit());
          }
        }
      }
    }

    // turn gaze tracking on or off based on number of active controllers
    if (pointerGamePadCount === 0 && !gs.gazeTracking) {
      gs.gazeTracking = true;
      gs.dispatchEvent( {type: GazeSelectorEvent.gazeTrackingOn, gazeTracker: gs});
    } else if (pointerGamePadCount > 0 && gs.gazeTracking) {
      gs.gazeTracking = false;
      gs.dispatchEvent({type: GazeSelectorEvent.gazeTrackingOff, gazeTracker: gs});
    }

    if (gs.gazeTracking && pointerGamePadCount === 0) {
      // head-gaze intersection handling
      // cast from the center of the screen
      castVector.set(0, 0, 0);
      handleIntersection(gs, closestGazeHit());
    }
  });

  return gs;
}
