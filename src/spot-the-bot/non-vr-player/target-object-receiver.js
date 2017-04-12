import Debug from 'debug';
import { Object3D, Vector3, Math as MathExt } from 'three';
import { ProceduralObject } from '../../core/robot-generator';
import { TargetObjectController } from './target-object-controller';
import { GameStateManagerEvent } from '../../core/game-state-manager';
import idle01Anim from '../../animation/idles/idle-01';
import idle02Anim from '../../animation/idles/idle-02';
import idle03Anim from '../../animation/idles/idle-03';
import idle04Anim from '../../animation/idles/idle-04';
import { playAnimationNow, playRandomAdditiveAnimation } from '../../animation/utils';
import { sadAnimations } from '../../animation/lamentations';
import { celebrationAnimationHelper } from '../../animation/celebrations';
import { movePosition } from '../../animation/move-position';
import config from '../../core/config';
import { WorldEvent } from '../../core/world';

const debug = Debug('app:target-object-receiver');
const idleAnims = [idle01Anim, idle02Anim, idle03Anim, idle04Anim];

export function TargetObjectReceiver(options) {
  if (options.world === undefined) throw new Error('The TargetObjectReceiver requires options.world');
  if (options.gsm === undefined) throw new Error('The TargetObjectReceiver requires options.gsm');

  options = Object.assign({
    idleAnimationInitialDelay: 2,
    idleAnimationTimeout: 10,
  }, options);

  const {world, gsm} = options;
  const levelContext = gsm.levelContext;
  const entity = new Object3D();
  const controller = TargetObjectController({world});
  entity.targetController = controller;

  // the current target as a procedural object
  let target = null;

  /**
   * Transition from the old target object to a new one.
   *
   * @param {Object} description - The description of the new target object.
   * @param {Number} duration - The duration of the transition, in seconds.
   */
  function* transitionTargetObjects(description, duration) {
    controller.disable();

    const oldTarget = target;
    const newTarget = target = ProceduralObject({description, levelContext});

    newTarget.name = "Target";
    entity.add(newTarget);

    const exitPosition = new Vector3(-4, 0, 0);
    const middPosition = new Vector3(0, 0, 0);
    const entrPosition = new Vector3(4, 0, 0);

    let progress = 0, dt = 0;

    while (progress < duration) {
      progress = progress + dt;
      const exitPercent = Cubic.easeOut.getRatio(progress / duration);

      if (oldTarget) {
        oldTarget.position.lerpVectors(middPosition, exitPosition, exitPercent);
        const scale = Math.max(1 - exitPercent, 0.01);
        oldTarget.scale.setScalar(scale);
      }

      const enterPercent = Cubic.easeOut.getRatio(progress / duration);
      if (newTarget) {
        newTarget.position.lerpVectors(entrPosition, middPosition, enterPercent);
        const scale = Math.max(enterPercent, 0.01);
        newTarget.scale.setScalar(scale);
      }

      dt = yield null;
    }

    if (newTarget) {
      newTarget.position.set(middPosition.x, middPosition.y, middPosition.z);
      newTarget.scale.setScalar(1);
    }

    if (oldTarget) {
      entity.remove(oldTarget);
    }

    controller.target = newTarget;
    controller.enable();
  }

  const idleAnimationTimeout = options.idleAnimationTimeout;
  let nextIdle = performance.now() + options.idleAnimationInitialDelay * 1000;
  let fitCamera = true;

  world.addEventListener(WorldEvent.update, (event) => {
    if (target) {
      if (fitCamera) {
        zoomCameraToFitObject(target, world.camera, 1.5, 0.1, controller.zoom);
      }

      const now = performance.now();
      if (now > nextIdle) {
        playRandomAdditiveAnimation(idleAnims, target);
        nextIdle = now + idleAnimationTimeout * 1000;
      } else {
        const inputIdle = controller.lastInteractionTime + options.idleAnimationInitialDelay * 1000;
        if (nextIdle < inputIdle)
          nextIdle = inputIdle;
      }
    }
  });

  const cameraOffset = new Vector3(0, 0, 5);
  gsm.addEventListener(GameStateManagerEvent.correct, (event) => {
    fitCamera = false;
    const cameraStartPosition = new Vector3();
    const cameraFinalPosition = new Vector3();
    cameraStartPosition.set(options.world.camera.position.x, options.world.camera.position.y, options.world.camera.position.z);
    cameraFinalPosition.set(options.world.camera.position.x, options.world.camera.position.y, options.world.camera.position.z);
    cameraFinalPosition.add(cameraOffset);
    movePosition(options.world, options.world.camera, cameraFinalPosition, 1.0);
    playAnimationNow(celebrationAnimationHelper, target, true, undefined, ()=> {
      movePosition(options.world, options.world.camera, cameraStartPosition, 0.001, () => {
        const {state} = gsm;
        const iterator = transitionTargetObjects(state.targetDescription, 0.5);
        world.coroutine(iterator);
        fitCamera = true;
      });
    });
  });

  gsm.addEventListener(GameStateManagerEvent.incorrect, (event) => {
    if (target) {
      playRandomAdditiveAnimation(sadAnimations, target);
    }
  });

  gsm.addEventListener(GameStateManagerEvent.pass, (event) => {
    loadOnNewTargetEvent = true;
  });

  gsm.addEventListener(GameStateManagerEvent.gameEnded, (event) => {
    if (target) {
      entity.remove(target);
    }
    target = null;
    loadOnNewTargetEvent = true;
  });

  let loadOnNewTargetEvent = true;
  gsm.addEventListener(GameStateManagerEvent.newTargetDescription, (event) => {
    const {state} = gsm;
    if (state && state.targetDescription) {
      if (loadOnNewTargetEvent) {
        const iterator = transitionTargetObjects(state.targetDescription, 1.0);
        world.coroutine(iterator);
        loadOnNewTargetEvent = false;
      }
    }
  });

  if (gsm.state && gsm.state.targetDescription) {
    // the current game state already has a target description (we missed the state-set event)
    if (config.log) debug('missed gsm event, using existing game state');

    target = gsm.state.targetDescription;
    controller.target = gsm.state.targetDescription;
    controller.enable();
  }

  return entity;
}

/**
 * Fit an object to the camera's field of view by setting the camera's position.
 *
 * @param object - The object to fit.
 * @param camera - The camera to fit by.
 * @param padding - A padding factor; 1 will fit exactly, 2 will fit the
 *   object in half of the screen width.
 * @param interpolation - An interpolation factor between the exact position
 *   and the camera's current z position.
 * @param zoom - the zoom factor 0-1
 */
function zoomCameraToFitObject(object, camera, padding = 1.5, interpolation = 0.1, zoom = 1.0) {
  const geo = object.geometry;
  if (geo.boundingSphere === null) {
    if (config.log) debug('computing bounding sphere for object', object.name);

    geo.computeBoundingSphere();
  }

  const radius = geo.boundingSphere.radius * padding;
  const theta = MathExt.degToRad(camera.fov * 0.5);
  const z = radius / Math.tan(theta);
  const adjustedZ = z * zoom;

  camera.position.z = MathExt.lerp(camera.position.z, adjustedZ, interpolation);
}
