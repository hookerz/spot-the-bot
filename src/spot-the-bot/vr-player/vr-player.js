import { World, WorldEvent } from '../../core/world';
import { GameStateManager, GameStateManagerEvent } from '../../core/game-state-manager';
import { SplineManager } from './spline-manager';
import { GazeSelector, GazeSelectorEvent } from '../../core/gaze-selector';
import { ReticleRing } from '../../core/reticle-ring';
import { addLightRigToWorld } from '../../core/shared-lighting';
import { createDigitGeometries } from '../../core/timer';
import { setRobotMaterialsCubemap, levelContextFromConfig } from '../../core/robot-generator';
import { portalsFromSplines} from '../../core/portal';
import { FogExp2, PCFSoftShadowMap, BasicShadowMap, AudioListener, MeshBasicMaterial} from 'three';
import { createTrackGeometryWithShadowTracks } from '../../core/track-geometry';
import { addDustToWorld } from '../../core/dust-particles';
import { SkyDome, addEnvMapCamera } from '../../core/sky-dome';
import { SoundManager, SoundManagerEvent } from '../../core/sound-manager';
import { addVignetteMeshToWorld } from '../../core/vignette';
import { addInfoBotToWorld } from '../../core/info-bot/index';
import { playAnimationNow, playRandomAdditiveAnimation, playAdditiveAnimation} from '../../animation/utils';
import sadAnimations from '../../animation/lamentations';
import { gazeOverAnimation, gazeOutAnimation } from '../../animation/highlights';
import { celebrationAnimationVR } from '../../animation/celebrations';
import { moveToFrontOfCamera } from '../../animation/move-to-front-of-camera';
import { UIEvent } from '../../ui/ui-event';
import assets from '../../core/assets';
import config from '../../core/config';
import { RendererStats } from '../../util/three-ext/renderstats'
import { VRPlayerControllerHandler } from '../../core/player-controller-handler';
import { Tracking } from '../../core/tracking';
import is from 'is_js';

function attachStats() {
  let script = document.createElement('script');
  script.onload = function () {
    let stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    requestAnimationFrame(function loop() {
      stats.update();
      requestAnimationFrame(loop)
    });
  };
  script.src = '//rawgit.com/mrdoob/stats.js/master/build/stats.min.js';
  document.head.appendChild(script);
}

export function attachRenderStats(world) {
  const rendererStats = new RendererStats();
  rendererStats.domElement.style.position = 'absolute';
  rendererStats.domElement.style.right = '0px';
  rendererStats.domElement.style.bottom  = '0px';
  document.body.appendChild( rendererStats.domElement );


  world.addEventListener(WorldEvent.update, () => rendererStats.update(world.renderer));

  return rendererStats;
}

export function VRPlayer(options) {
  if (options.network === undefined) throw new Error('The helper player requires a network interface.');
  if (options.players === undefined) throw new Error('The helper player requires a player manager.');

  const world = World({ vr: true });
  const {camera, renderer, scene, canvas} = world;

  if (config.showFPS) {
    attachStats();
  }

  if (config.renderStats) {
    attachRenderStats(world);
  }

  camera.fov = 70;
  camera.updateProjectionMatrix();

  renderer.setClearColor(0x505050);
  renderer.sortObjects = true; // required for portal stuff to work!
  renderer.shadowMap.enabled = config.shadows;
  renderer.shadowMap.type = config.softShadows ? PCFSoftShadowMap : BasicShadowMap;

  scene.name = "Spot-a-bot";
  scene.userData.room = options.network.room;

  const levelContext = levelContextFromConfig(config);
  const gsm = GameStateManager({
    world: world,
    network: options.network,
    players: options.players,
    isPicker: true,
    levelContext: levelContext,
  });

  const tracking = Tracking(gsm);
  const gazeSelector = GazeSelector(world, {requireUserDataSelectable: true, keepSelection: false, enableKeypressTrigger: true, controllerHandler: VRPlayerControllerHandler});
  const reticleRing = ReticleRing(gazeSelector, world); // added as a child of camera automatically

  gazeSelector.addEventListener(GazeSelectorEvent.selectionChanged, (event) => {
    const object = event.object;
    if (object) {
      // selected object
      // check if its the target
      if (object.userData.description || object.description) {
        const correct = gsm.checkDescription(event.object);
        if (correct) {
          moveToFrontOfCamera(world, camera, object, 1.5);
          playAnimationNow(celebrationAnimationVR, object, true);
        } else {
          playRandomAdditiveAnimation(sadAnimations, object);
        }
      }
    }
  });

  gazeSelector.addEventListener(GazeSelectorEvent.gazeChanged, (event) => {
    const newObject = event.object;
    const prevObject = event.prevObject;

    if (newObject && newObject.userData.isTarget !== undefined) {
      playAdditiveAnimation(gazeOverAnimation, newObject);
    }
    if (prevObject && prevObject.userData.isTarget !== undefined) {
      playAdditiveAnimation(gazeOutAnimation, prevObject);
    }
  });

  // POGO the events out to the 2-d ui so they swap out text for gaze vs controller inputs
  gazeSelector.addEventListener(GazeSelectorEvent.gazeTrackingOn , (event) => options.ui.dispatchEvent(event));
  gazeSelector.addEventListener(GazeSelectorEvent.gazeTrackingOff, (event) => options.ui.dispatchEvent(event));


  // Sounds
  const listener = new AudioListener();
  camera.add(listener);

  const soundManager = SoundManager({ gsm, listener, gaze: gazeSelector });
  camera.add(soundManager);

  // connects the VR mute button control the menu music
  soundManager.addEventListener(SoundManagerEvent.muted, (event) => options.ui.dispatchEvent(event));
  soundManager.addEventListener(SoundManagerEvent.unmuted, (event) => options.ui.dispatchEvent(event));

  const skyColor       = 0x429cf0;
  const horizonColor   = 0x98ffff;
  const groundColorFar = 0xe1f9ff;
  const groundColor    = 0xe6f6fc;
  const skyDome = SkyDome(100, -3.5, skyColor, horizonColor, groundColor, groundColorFar);
  scene.add(skyDome);
  scene.fog = new FogExp2(0x98ffff, 0.013); // fade the ground plane to the horizon color..
  if (!config.shadows)
    skyDome.userData.setBakedShadowMap(assets.get("trackshadow"));

  // Lighting setup
  addLightRigToWorld(world, config.shadows, undefined, skyColor, groundColor, horizonColor, false); // add static and camera following lights to the world

  if (config.envMap) {
    // by rendering here we are explicitly excluding the track... might change this later...
    const cubeCamera = addEnvMapCamera(world, true);
    setRobotMaterialsCubemap(cubeCamera.renderTarget.texture);
  }

  if (config.vignette) {
    addVignetteMeshToWorld(world);
  }

  if (config.dustParticles) {
    addDustToWorld(world);
  }

  // Spline object manager
  const proceduralObjectManager = SplineManager(gsm, world, {objectCount: 10, gazeSelector});
  proceduralObjectManager.position.set(0, -1.0, 0);
  scene.add(proceduralObjectManager);

  // Portals
  const portalMaster = portalsFromSplines(proceduralObjectManager.userData.splines, 1.25);
  portalMaster.position.set(0, -0.75, 0);
  portalMaster.updateMatrixWorld(true); // required so the shadow setup will work
  scene.add(portalMaster);

  // Track Geometry
  // geometry override for the linear track segment
  const lineTrackMesh = assets.get("lineTrack").children[0];
  const trackGeoParent = createTrackGeometryWithShadowTracks(proceduralObjectManager.userData.splines, portalMaster.userData.portalsBySpline, [100 , 100, 100], [null, null, lineTrackMesh]);
  trackGeoParent.position.set(0, 0, 0);
  trackGeoParent.updateMatrixWorld(true);
  scene.add(trackGeoParent);

  // Track Geometry Shadow casting mesh
  //const lineTrackShadowMesh = assets.get("lineTrackShadow").children[0];
  //const shadowMapMesh = createShadowMapCasterMesh(proceduralObjectManager.userData.splines, portalMaster.userData.portalsBySpline, [null, null, lineTrackShadowMesh]);
  //scene.add(shadowMapMesh);

  // this mesh just casts shadows, doesn't write to z or depth...
  const allTracksShadowMesh = assets.get("allTracksShadowMesh").children[0];
  allTracksShadowMesh.material = new MeshBasicMaterial({ color: 0xFF0000, depthWrite: false, colorWrite: false});
  allTracksShadowMesh.castShadow = true;
  scene.add(allTracksShadowMesh);

  // Info-Bot
  const font = assets.get('main-font');
  const digitsGeometry = createDigitGeometries(font, {size: 0.75});
  const infoBot = addInfoBotToWorld(world, gsm, gazeSelector, font, digitsGeometry, 22, 5, soundManager);

  // Connect the 2d ui to the vr world
  const ui = options.ui;
  gsm.addEventListener(GameStateManagerEvent.changed, (event) => ui.dispatchEvent(event));
  ui.dispatchEvent({ type: GameStateManagerEvent.changed, state: gsm.state });

  ui.addEventListener(UIEvent.action, (event) => {
    gsm.pushStateAction({ type: event.action });
  });

  // entering vr always comes the UI
  ui.addEventListener(UIEvent.enterVR, (event) => {
    // HACK: chrome M57 requires the canvas have no styling in pixel coordinates due to devicePixelRatio getting reset to 1 during presenting
    if (is.mobile() && is.chrome() && is.android()) {
      world.rendererUpdateStyle = false; // asks threejs not to update the canvas style when changing size
      canvas.style = ""; // kill any canvas styling previously set by threejs
    }

    world.requestPresent().then(() => console.log("World.requestPresent() finished with no errors")).catch(e => console.error(e));
  });

  // exiting vr only comes from the UI on desktop
  ui.addEventListener(UIEvent.exitVR, (event) => {
    camera.quaternion.set(0, 0, 0, 1);
    camera.position.set(0, 0, 0);

    world.exitPresent().then(()=> console.log("World.exitPresent() finished without error")).catch(e => console.error(e));
  });

  // no matter how VR was exited, this should fire
  world.addEventListener(WorldEvent.exitVR, (event) => {
    // HACK: undoes the chrome M57 hack which removed sizing of the canvas
    // this ensures no scrolling is possible on the vr enter/exit page
    if (world.rendererUpdateStyle === false) {
      world.rendererUpdateStyle = true; // ask threejs to update canvas style when changing size again
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }
  });

  ui.addEventListener(UIEvent.mute, soundManager.mute);
  ui.addEventListener(UIEvent.unmute, soundManager.unmute);

  // DEBUG
  window.config = config;
  window.gsm = gsm;
  window.world = world;
  window.scene = scene;
  window.renderer = renderer;
  window.camera = camera;
  window.canvas = canvas;
  window.portalMaster = portalMaster;
  window.gazeSelector = gazeSelector;
  window.infoBot = infoBot;
  window.soundManager = soundManager;

  // DEBUG fake an automatic correct selection so we test the difficulty advancing
  // relies on window.robots...
  window.guessRight = function () {
    for (let i=0; i < window.robots.length; i++) {
      const bot = window.robots[i];
      if (bot.userData.isTarget) {
        gsm.checkDescription(bot);
        playAnimationNow(celebrationAnimationVR, bot, true);
      }
    }
  };

  world.start();
  return world;
}
