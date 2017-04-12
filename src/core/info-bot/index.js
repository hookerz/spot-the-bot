import { Vector3, Math as TMath, Object3D, Color, MeshBasicMaterial, SphereBufferGeometry, Mesh} from 'three';
import { OBJLoader } from '../../util/three-ext/obj-loader';
import { WorldEvent } from '../world';
import { GameStateManagerEvent } from '../game-state-manager';
import { GameEndedReason } from '../game-state-manager';
import { innerPoints, outerPoints, pathToGoal, rings, pathDistance, applyRadius} from './pathfinding';
import geo from './geo';
import ambientStartAnim from '../../animation/infoBot/ambient-start';
import correctAnim1 from '../../animation/infoBot/correct-01';
import wrongAnim from '../../animation/infoBot/wrong-01';
import { playPartsAnimation } from '../../animation/utils';
import { createWaitingForPlayersScreen } from './screens/waiting-for-player-screen';
import { createStartGameScreen } from './screens/start-game-screen';
import { createGameRunningScreen } from './screens/game-running-screen';
import { createGameOverScreen } from './screens/game-over-screen';
import { createPlayerLeftScreen } from './screens/player-left-screen';
import { createGenericErrorScreen } from './screens/generic-error-screen';
import { showScreen } from './screens'
import { addMuteButton } from './screens/mute-button';
import { createBonusPenaltyPopup } from './screens/bonus-penalty';
import { query } from '../../util/querystring';
import config, { DefaultMaterial } from '../../core/config';


function buildPartAssetDescription(name, key) {
  key = key || name;
  return {
    key: key,
    url: `geo/infobot/${ name }.obj`,
    loader: OBJLoader,
  };
}

export const manifest = [
  // info bot geometry
  buildPartAssetDescription('body'),
  //buildPartAssetDescription('head'),
  //buildPartAssetDescription('head-shell'),
  //buildPartAssetDescription('head-inner'),
  //buildPartAssetDescription('light-casing'),
  buildPartAssetDescription('light-emissive'),
  //buildPartAssetDescription('eye-base'),
  //buildPartAssetDescription('eye-emissive'),
  //buildPartAssetDescription('speaker-base'),
  buildPartAssetDescription('speaker-inner'),

  buildPartAssetDescription('light-casing_lo'),
  buildPartAssetDescription('speaker-base_lo'),
  buildPartAssetDescription('head_w-eyes_lo'),
  buildPartAssetDescription('body_lo'),
  buildPartAssetDescription('eyes-emissive_combined'),

  // panels stuff
  {key:'panel-a-front',  url: 'geo/infobot/panel-a_bevelled_front_tailed.obj', loader: OBJLoader},
  {key:'panel-a-back',   url: 'geo/infobot/panel-a_bevelled_back.obj',         loader: OBJLoader},
  {key:'panel-b-front',  url: 'geo/infobot/panel-b_front_tailed.obj',          loader: OBJLoader},
  {key:'panel-b-back',   url: 'geo/infobot/panel-b_back.obj',                  loader: OBJLoader},
  {key:'panel-button',   url: 'geo/infobot/button_a.obj',                      loader: OBJLoader},

  // icons
  {key:'score-combined',  url: 'geo/infobot/score-combined-hourglass.obj', loader: OBJLoader},
  {key:'score-hourglass', url: 'geo/infobot/icon_hourglass_solid.obj',     loader: OBJLoader},
  {key:'score-nut',       url: 'geo/infobot/nut-hi.obj',                   loader: OBJLoader},
  {key:'sound-on',        url: 'geo/infobot/sound-on-hi.obj',              loader: OBJLoader},
  {key:'sound-off',       url: 'geo/infobot/sound-off.obj',                loader: OBJLoader},

  // bonus/penalty
  {key:'icon-bonus',   url: 'geo/infobot/icon_hourglass_plus_2.obj',  loader: OBJLoader},
  {key:'icon-penalty', url: 'geo/infobot/icon_hourglass_minus_2.obj', loader: OBJLoader},
  {key:'panel-c',      url: 'geo/infobot/panel_time.obj',             loader: OBJLoader},
];

export function createInfoBot() {
  // NOTE: the metalness on the pbr shader means we need to tweak the color darker for the phong shader
  let matOptions = null;
  let feedbackOptions = {color: 0x000000, transparent: true, opacity: 0.1, };
  if (config.pbr) {
    matOptions = {color: 0xddcefb, roughness: 0.5, metalness: 0.5};
    feedbackOptions.roughness = 0.1;
    feedbackOptions.metalness = 0.5;
  } else {
    matOptions = {color: 0x776B7F, shininess: 10, specular: 0xffffff};
    feedbackOptions.shininess = 500;
  }

  const material = new DefaultMaterial(matOptions);
  const eyeMat = new MeshBasicMaterial({color:0xffffff});
  const feedbackMat = new DefaultMaterial(feedbackOptions);

  let {root, parts} = geo(material, feedbackMat, eyeMat);
  const mesh = root;
  mesh.userData.parts = parts;
  mesh.name = "Info-Bot Geometry";
  // cheating here and making lots of assumptions about the world setup...
  mesh.position.set(0, -1.0, 0);

  // root transform always face player camera point at 0,0,0
  root = new Object3D();
  root.name = "Info-Bot Root";

  // rotation point is used to flip the bot around without affecting the core player facing orientation
  const rotRoot = new Object3D();
  rotRoot.name = "Info-Bot Rotation Root";
  rotRoot.add(mesh);
  rotRoot.position.set(0, -1.5, 0);
  root.add(rotRoot);

  root.userData.rotRoot = rotRoot;
  root.userData.material = material;
  root.userData.eyeMat = eyeMat;
  root.userData.feedbackMat = feedbackMat;
  root.userData.screens = {};
  root.userData.parts = parts;

  playPartsAnimation(ambientStartAnim, parts);

  return root;
}

export function closestPointIndex(angle, points, currentIndex, requireTransition=false) {
  let bestIndex = -1;
  let bestDiff = 999999999999.0;
  const currentBonus = 5 * Math.PI / 180.0;
  for (let i=0; i < points.length; i++ ){
    const pt = points[i];
    if (requireTransition && pt.connections.length === 3)
      continue; // skip this point if it can't transition and we need it to
    const b = pt.angle;
    let diff = Math.abs(angle - b);
    if (i === 0) { // check for wrap-around...
      diff = Math.min(diff, Math.abs(angle - b - Math.PI * 2.0));
    }
    if (currentIndex === i) // give the current target a little bonus to give it a stickyness
      diff -= currentBonus;
    if (diff < bestDiff) {
      bestIndex = i;
      bestDiff = diff;
    }
  }
  return bestIndex;
}

export const cameraToTargetPosition = function () {
  const projectedForwardOntoXZ = new Vector3(0, 0, -1);
  const up = new Vector3(0, 1, 0);

  return function (camera, infoBot, outputPosition) {
    // we need to take the current camera direction and compute the bot's target position
    projectedForwardOntoXZ.set(0, 0, -1);
    projectedForwardOntoXZ.applyQuaternion(camera.quaternion);
    projectedForwardOntoXZ.projectOnPlane(up);
    // looking almost straight up or down
    if (projectedForwardOntoXZ.lengthSq() < 0.001) {
      // No-op, don't change outputPosition
      return false;
    }
    projectedForwardOntoXZ.normalize();

    let angle = Math.atan2(projectedForwardOntoXZ.x, -projectedForwardOntoXZ.z);
    if (angle < 0.0) {
      // keep all angles positive and increasing
      angle = angle + Math.PI * 2.0;
    }

    const pf = infoBot.userData.pathFinding;

    // first find the closet goal point and see if its a new goal or an old goal
    const ringPts = rings[pf.targetRing];
    const idx = pf.targetRing === pf.lastStablePoint.ring ? pf.lastStablePoint.index : -1; // only consider stickyness on last stable point
    const newGoalIndex = closestPointIndex(angle, ringPts, idx, false);
    const newGoalPt = ringPts[newGoalIndex];

    // we should be somewhere between the current and next point
    if (newGoalPt !== pf.goalPoint) {
      // we need to calculate a new goal path
      // this should be semi-rare, defiantly not every frame, so it should be ok if its a tiny bit heavy
      const lastPath = pathToGoal(pf.lastPoint, newGoalPt, infoBot.position).slice(0);
      const nextPath = pathToGoal(pf.nextPoint, newGoalPt, infoBot.position).slice(0);

      const lastDist = pathDistance(infoBot.position, lastPath);
      const nextDist = pathDistance(infoBot.position, nextPath);

      pf.goalPath = lastDist < nextDist ? lastPath : nextPath;
      pf.goalPoint = newGoalPt;
      pf.nextPoint = pf.goalPath[0];
    }

    // so now we have a valid path
    // but we need to know where we are when we arrived at a goal point
    const distNext = infoBot.position.distanceTo(pf.nextPoint.position);
    const distLast = infoBot.position.distanceTo(pf.lastPoint.position);

    if (distNext < distLast && pf.closestPoint !== pf.nextPoint) {
      pf.closestPoint = pf.nextPoint;
    }

    if (distNext < 0.1) {
      // lets say we have arrive at the point if we get close enough
      if (pf.goalPath.length > 1) {
        pf.goalPath.shift();
      } else {
        // we have reached the goal
        pf.lastStablePoint = pf.goalPath[0];
      }
      pf.lastPoint = pf.nextPoint;
      pf.nextPoint = pf.goalPath[0];
    }

    outputPosition.copy(pf.nextPoint.position);

    return true;
  }
}();


export const updateInfoBot = function () {

  // avoid allocations with these temp variables...
  const newTargetPosition = new Vector3();
  const origin = new Vector3(0, 0, 0);
  const offColor = new Color(0x000000);
  const correctColor = new Color(0x00ff00);
  const wrongColor = new Color(0xff0000);
  const dir = new Vector3();

  return function (timeEvent, camera, infoBot) {
    const {lastGuess, lastGuessTime, feedbackMat } = infoBot.userData;
    const updated = cameraToTargetPosition(camera, infoBot, newTargetPosition);

    // acceleration-based model for position movement, doesn't look great, but it is better than the purse lerp
    const pf = infoBot.userData.pathFinding;
    dir.subVectors(newTargetPosition, infoBot.position);
    const dist = dir.length();
    let t = 0.1;
    if (pf.goalPoint === pf.nextPoint && dist < 1.0) {
      pf.speed = t * dist;
    } else {
      // keep speeding up till we hit max velocity
      pf.speed = Math.min(timeEvent.dt * pf.acceleration + pf.speed, pf.maxSpeed);
      t = Math.min(1.0, pf.speed * timeEvent.dt / dist);
    }

    infoBot.position.lerp(newTargetPosition, t);
    infoBot.lookAt(origin);

    // feedback light
    if (lastGuess !== null) {
      const rampUpTime = lastGuess ? 0.4 : 0.2;
      const fadeTime = 1.5;
      const maxEmissive = 0.5;
      let elapsed = timeEvent.time - lastGuessTime;
      let t = elapsed / rampUpTime;
      let targetColor = lastGuess ? correctColor : wrongColor;
      feedbackMat.emissive = targetColor;
      feedbackMat.emissiveIntensity = t * maxEmissive;
      feedbackMat.opacity = t * 0.7 + 0.1;

      if (t > 1.0) {
        // we are done ramping in and now we need to ramp out
        targetColor = offColor;
        t = (elapsed - rampUpTime) / fadeTime;
        feedbackMat.emissiveIntensity = (1-t) * maxEmissive;
        feedbackMat.opacity = (1-t) * 0.7 + 0.1;
        if (t > 1.0) {
          t = 1.0; // clamp
          infoBot.userData.lastGuess = null; // stop updating after this time until the next guess
        }
      }

      t = TMath.smootherstep(t, 0, 1);
      feedbackMat.color.lerp(targetColor, t);
    }
  }
}();


function vizPoint(parent, pos, color, radius) {
  const mesh = new Mesh(
    new SphereBufferGeometry(radius, 5, 5),
    new MeshBasicMaterial({color: color})
  );
  mesh.position.copy(pos);
  mesh.position.y -= 3.5;
  parent.add(mesh);
}

function vizPoints(scene, innerPoints, outerPoints)
{
  const root = new Object3D();
  for (let i=0; i < innerPoints.length; i++) {
    vizPoint(root, innerPoints[i].position, 0x00ff00, 0.1);
  }

  for (let i=0; i < outerPoints.length; i++) {
    vizPoint(root, outerPoints[i].position, 0x0000ff, 0.5);
  }
  scene.add(root);
}


export function addInfoBotToWorld(world, gsm, gazeSelector, font, digitsGeometry, outerRadius=22, innerRadius=5, soundManager) {
  const infoBot = createInfoBot();

  // points were defined in unit-circle, need to apply the radius
  applyRadius(innerPoints, innerRadius);
  applyRadius(outerPoints, outerRadius);

  if (query.showPoints)
    vizPoints(world.scene, innerPoints, outerPoints);

  const pathFinding = {
    goalPoint: innerPoints[0],
    goalPath: [innerPoints[0]],
    nextPoint: innerPoints[0],
    closestPoint: innerPoints[0],
    lastPoint: innerPoints[0],
    lastStablePoint: innerPoints[0],
    targetRing: 'inner',
    speed: 0.0,
    maxSpeed: 40,
    acceleration: 100,
  };

  infoBot.userData = Object.assign({
    innerRadius,
    outerRadius,
    radiusSpan: outerRadius - innerRadius,
    pathFinding,
    lastGuess: null,
    lastGuessTime: 0,
    currentScreen: null,
    targetScreen: null,
  }, infoBot.userData);

  infoBot.position.set(0, 0, -innerRadius);
  infoBot.lookAt(new Vector3(0,0,0));

  addMuteButton(infoBot, soundManager, gazeSelector);

  let networkErrorOccurred = false;

  const waitingScreen      = createWaitingForPlayersScreen(infoBot, gsm, font);
  const startGameScreen    = createStartGameScreen(infoBot, gsm, font, gazeSelector);
  const gameRunningScreen  = createGameRunningScreen(infoBot, gsm, font, digitsGeometry);
  const gameOverScreen     = createGameOverScreen(infoBot, gsm, font, digitsGeometry, gazeSelector);
  const playerLeftScreen   = createPlayerLeftScreen(infoBot, gsm, font, gazeSelector);
  const genericErrorScreen = createGenericErrorScreen(infoBot, gsm, font, gazeSelector);

  const bonusPanel = createBonusPenaltyPopup(30, font, digitsGeometry);
  const penaltyPanel = createBonusPenaltyPopup(-30, font, digitsGeometry);

  bonusPanel.position.set(0, 0, -5.0);
  penaltyPanel.position.set(0, 0, -5.0);

  // DEBUG
  window.bonusPanel = bonusPanel;
  window.penaltyPanel = penaltyPanel;
  // added these at the root so we can use lookAt, they are hidden by default...
  world.scene.add(bonusPanel);
  world.scene.add(penaltyPanel);

  world.scene.add(infoBot);

  world.addEventListener(WorldEvent.afterCameraPoseUpdate, (event) => updateInfoBot(event, world.camera, infoBot));

  gsm.addEventListener(GameStateManagerEvent.remainingSecsChanged, (event) => {
    // update the timer count down display
    gameRunningScreen.userData.timeDisplay.setTime(gsm.time.remainingSecs);
  });

  gsm.addEventListener(GameStateManagerEvent.roomFull, (event) => {
    pathFinding.targetRing = "inner";
    showScreen(infoBot, startGameScreen, world);
  });

  gsm.addEventListener(GameStateManagerEvent.roomNotFull, (event) => {
    if (!networkErrorOccurred) { // don't show this if we have already displayed a network error screen
      pathFinding.targetRing = "inner";
      showScreen(infoBot, playerLeftScreen, world);
    }
  });

  gsm.addEventListener(GameStateManagerEvent.networkError, (event) => {
    networkErrorOccurred = true;
    pathFinding.targetRing = "inner";
    showScreen(infoBot, genericErrorScreen, world);
  });

  gsm.addEventListener(GameStateManagerEvent.gameStarted, (event) => {
    pathFinding.targetRing = "outer";
    // make sure to update the bot count in case there was a previous game
    infoBot.userData.botCountDisplay.userData.setNumber(event.state.catchCount);
    showScreen(infoBot, gameRunningScreen, world);
  });

  gsm.addEventListener(GameStateManagerEvent.gameEnded, (event) => {
    // we need to process the game ending reason
    gameRunningScreen.userData.timeDisplay.setTime(0);

    switch (event.reason) {
      case GameEndedReason.playerDisconnected:
        // let the GameStateManagerEvent.roomNotFull deal with it
        break;
      case GameEndedReason.timeExpired:
        pathFinding.targetRing = "inner";
        gameOverScreen.userData.setCatchCount(event.state.catchCount);
        showScreen(infoBot, gameOverScreen, world);
        break;
      default:
        pathFinding.targetRing = "inner";
        showScreen(infoBot, genericErrorScreen, world);
        break;
    }
  });

  gsm.addEventListener(GameStateManagerEvent.incorrect, (event) => {
    infoBot.userData.lastGuessTime = world.currentTimeEvent.time;
    infoBot.userData.lastGuess = false;
    const object = event.state.lastCheckedObj;
    playPartsAnimation(wrongAnim, infoBot.userData.parts);
    world.coroutine(rewardIterator(gsm.levelContext.difficulty.incorrectGuessPenalty, object, {color: 0xcc0000}));
  });

  gsm.addEventListener(GameStateManagerEvent.correct, (event) => {
    const object = event.state.lastCheckedObj;
    infoBot.userData.lastGuessTime = world.currentTimeEvent.time;
    infoBot.userData.lastGuess = true;

    playPartsAnimation(correctAnim1, infoBot.userData.parts);

    // HACK: this is a pretty lame way to update
    if (infoBot.userData.botCountDisplay) {
      infoBot.userData.botCountDisplay.userData.setNumber(event.state.catchCount);
    }

    world.coroutine(rewardIterator(gsm.levelContext.difficulty.correctGuessBonus, object, {color: 0x00cc00}));
  });

  const zero = new Vector3();

  function* rewardIterator(amount, root, options) {
    const wp = new Vector3();

    options = Object.assign({
      color: 1,
      size: .4,
      maxHeight: 2,
      startingHeight: 2.0,
    }, options);

    const duration = 1.25;
    let progress = 0, dt = 0;
    root.getWorldPosition(wp);
    wp.set(wp.x, wp.y + options.startingHeight, wp.z);

    const popUp = amount > 0 ? bonusPanel : penaltyPanel;
    popUp.visible = true;
    popUp.userData.setAmount(Math.abs(amount)); // don't want to show the sign in the text..
    popUp.position.copy(wp);

    const inTime = 0.15;
    const outTime = 0.1;
    const outStart = 1.0 - outTime;

    while (true) {
      progress = progress + dt;
      const t = TMath.clamp(progress / duration, 0, 1);
      const inT = TMath.clamp(progress / inTime, 0, 1);
      const outT = TMath.clamp((progress - outStart) / outTime, 0, 1);

      if (t < outStart) {
        const ts = TMath.smootherstep(inT, 0, 1);
        const scale = TMath.mapLinear(ts, 0, 1, 0.001, 1.0);
        popUp.scale.set(scale, scale, scale);
      } else {
        const ts = TMath.smootherstep(outT, 0, 1);
        const scale = TMath.mapLinear(ts, 0, 1, 1.0, 0.001);
        popUp.scale.set(scale, scale, scale);
      }

      popUp.position.set(wp.x, wp.y + t * options.maxHeight, wp.z);
      popUp.lookAt(zero);

      if (t === 1.0)
        break;
      dt = yield null;
    }

    popUp.visible = false;
  }

  if (gsm.playerManager.full) {
    // helper player joined first, show start game button
    // NOTE: we don't support this anymore...
    pathFinding.targetRing = "inner";
    showScreen(infoBot, startGameScreen, world);
  } else {
    // waiting for full room...
    pathFinding.targetRing = "inner";
    showScreen(infoBot, waitingScreen, world);
  }

  // DEBUG testing
  window.infoBotWrong = function () {
    infoBot.userData.lastGuessTime = world.currentTimeEvent.time;
    infoBot.userData.lastGuess = false;
    playPartsAnimation(wrongAnim, infoBot.userData.parts);
  };

  window.infoBotCorrect = function () {
    infoBot.userData.lastGuessTime = world.currentTimeEvent.time;
    infoBot.userData.lastGuess = true;

    playPartsAnimation(correctAnim1, infoBot.userData.parts);
  };

  return infoBot;
}





