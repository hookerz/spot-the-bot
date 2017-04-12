import { Object3D, Math as MathExt, Geometry, Vector3, LineBasicMaterial, Line } from 'three';
import { generateObjects } from '../../core/robot-generator';
import { GameStateManagerEvent } from '../../core/game-state-manager';
import { SplineMover } from '../../core/spline-mover';
import { WorldEvent } from '../../core/world';
import { cleanUpShadowObjects, ShadowObject, pausePortalShadowUpdating, resumePortalShadowUpdating} from '../../core/portal';
import { finalSplineData } from '../../core/splines-data';
import { createSplinesFromJsonData } from '../../core/spline-utils';
import { danceAnimation } from '../../animation/dances';
import { playAnimationNow, killRobotTimelines } from '../../animation/utils';
import { hideAnimation } from '../../animation/hide';
import { showAnimation } from '../../animation/show';


function removeFromSelectable(gazeSelector, objectsRoot) {
  if (!gazeSelector || !objectsRoot)
    return;

  for (let i=0; i < objectsRoot.children.length; i++) {
    const index = gazeSelector.selectableObjects.indexOf(objectsRoot.children[i]);
    if (index >= 0) {
      gazeSelector.selectableObjects.splice(index, 1);
    }
  }
}

export function SplineManager(gameStateManager, world, options = {}) {
  const gazeSelector = options.gazeSelector;
  const entity = new Object3D();
  entity.name = "Procedural Spline Object Manager";

  if (gazeSelector && !gazeSelector.selectableObjects) {
    gazeSelector.selectableObjects = [];
  }

  let objectsRoot = null;
  let splineMover = null;

  function cleanUpObjects() {
    removeFromSelectable(gazeSelector, objectsRoot);
    for (let i=0; i < entity.children.length; i++) {
      killRobotTimelines(entity.children[i]);
    }
    entity.remove(...entity.children);
    cleanUpShadowObjects();
  }

  gameStateManager.addEventListener(GameStateManagerEvent.gameStarted, (event) => {
    if(splineMover)
      splineMover.play();
  });

  let justPassed = false;
  gameStateManager.addEventListener(GameStateManagerEvent.newTargetDescription, (event) => {

    let cleanup = undefined;
    if(justPassed) {
      cleanup = objectsRoot ? cleanupPreviousWave(1.0, true, 0.0, true) : Promise.resolve();
      justPassed = false;
    } else {
      cleanup = objectsRoot ? cleanupPreviousWave(2.0, true, 3.0 - 2.0, false) : Promise.resolve();
    }

    return cleanup.then(() => {
      return createNextWave(event.state.targetDescription);
    });
  });

  let lastPauseTime = Date.now();
  let isPlayPending = false;
  const pauseDuration = gameStateManager.levelContext.difficulty.pauseDuration * 1000;

  gameStateManager.addEventListener(GameStateManagerEvent.pauseTrack, (event) => {
    if(!splineMover)
      return;

    splineMover.pause();
    lastPauseTime = Date.now();
    isPlayPending = true;
  });

  gameStateManager.addEventListener(GameStateManagerEvent.pass, (event) => {
    justPassed = true;
  });

  gameStateManager.addEventListener(GameStateManagerEvent.gameEnded, (event) => {
    if (objectsRoot)
      cleanupPreviousWave(1.0, true, 0.0, true);
  });

  function cleanupPreviousWave(duration = 0.5, backwards = true, waitAtEnd = 0.0, scaleTargetOut = false) {
    for (let i = 0; i < objectsRoot.children.length; i++) {
      objectsRoot.children[i].userData.selectable = false;
    }

    if (splineMover) {
      splineMover.pause();
      isPlayPending = false;
    }

    const iterator = transition(objectsRoot.children, {
      duration: duration,
      backwards: backwards,
      waitAtEnd: waitAtEnd,
      scaleTargetOut: scaleTargetOut,
      world: world,
    });

    return world.coroutine(iterator).then(cleanUpObjects);
  }

  let {curves, curveUs, orientations} = createSplinesFromJsonData(finalSplineData());
  entity.userData.splines = curves;
  entity.userData.splineUs = curveUs;
  entity.userData.splineOrientations = orientations;

  function createNextWave(nextTargetDescription) {

    // Splines Manager
    objectsRoot = generateObjects(gameStateManager.levelContext, nextTargetDescription);
    objectsRoot.name = "Objects Root";
    entity.add(objectsRoot);
    window.robots = objectsRoot.children;

    for (let i=0; i < objectsRoot.children.length; i++) {
      const robot = objectsRoot.children[i];
      const animationBones = robot.userData.animationBones;
      ShadowObject(world, robot, undefined, animationBones.centerBone); // attach to center so the shadow fallows the main body animation if any
      playAnimationNow(danceAnimation, robot, false);
    }

    if (gazeSelector)
      gazeSelector.selectableObjects.push(...objectsRoot.children);

    let delays = [];
    let forward = [];
    for(let i = 0; i < curves.length; i++) {
      delays.push(0);
      forward.push(1);
    }

    splineMover = new SplineMover(curves, objectsRoot, delays, forward, gameStateManager, {
      orientations: orientations,
      curveUs: curveUs
    });

    entity.targetDescription = nextTargetDescription;

    const iterator = transition(objectsRoot.children, {
      duration: 0.2,
      backwards: false,
      world: world,
    });

    return world.coroutine(iterator);
  }

  world.addEventListener(WorldEvent.update, (event) => {

    if(splineMover)
      splineMover.update(event);

    if(splineMover && isPlayPending && Date.now() >= (lastPauseTime + pauseDuration))
    {
      splineMover.play();
      isPlayPending = false;
    }
  });

  entity.position.set(0,0,0);
  return entity;
}

/**
 * Transition procedural objects in or out of the scene.
 *
 * @param {Object3D[]} objects - The objects to transition.
 *
 * @param {Object}     options
 * @param {Number}     options.duration - The duration of the transition in seconds.
 * @param {Boolean}    options.backwards - If true, scale down instead of up.
 */
function* transition(objects, options) {

  const { backwards, duration, world } = options;
  const waitAtEnd = options.waitAtEnd || 0;
  const scaleTargetOut = options.scaleTargetOut || false;

  let progress = 0, dt = 0;

  const animFunc = backwards ? hideAnimation : showAnimation;
  const nextFunc = backwards ? undefined : danceAnimation;

  // prevent clobbering of scale
  pausePortalShadowUpdating(world);

  // hide animations trigger
  for (let i = 0, n = objects.length; i < n; i++) {
    if (!objects[i].userData.isTarget || scaleTargetOut) { // don't scale the target object down
      playAnimationNow(animFunc, objects[i], true, nextFunc, () => objects[i].visible = (backwards === false));
    }
  }

  while (progress < duration) {
    progress = progress + dt;
    dt = yield null;
  }

  // waiting period?
  progress = 0;
  while (progress < waitAtEnd) {
    progress = progress + dt;
    dt = yield null;
  }

  for (let i = 0, n = objects.length; i < n; i++) {
    objects[i].visible = (backwards === false);
  }

  // prevent clobbering of scale
  resumePortalShadowUpdating(world);
}
