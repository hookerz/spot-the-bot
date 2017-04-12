import { World, WorldEvent} from '../../core/world';
import { FogExp2, AudioListener } from 'three';
import { GameStateManager, GameStateManagerEvent} from '../../core/game-state-manager';
import { TargetObjectReceiver } from './target-object-receiver';
import { addLightRigToWorld } from '../../core/shared-lighting';
import { SoundManager } from '../../core/sound-manager';
import { GameAction } from '../../core/gamemodes/gamemode-rush';
import { levelContextFromConfig } from '../../core/robot-generator';
import { addDustToWorld } from '../../core/dust-particles';
import { UIEvent } from '../../ui/ui-event';
import { SkyDome } from '../../core/sky-dome';
import { duration as correctAnimationDuration } from '../../animation/celebrations';
import config from '../../core/config';
import { Tracking } from '../../core/tracking';

export function NonVRPlayer(options) {

  if (options.network === undefined) throw new Error('The helper player requires a network interface.');
  if (options.players === undefined) throw new Error('The helper player requires a player manager.');
  if (options.ui === undefined) throw new Error('The helper player requires options.ui');

  const world = World();
  const {renderer, camera, scene} = world;

  // Renderer
  renderer.setClearColor(0x505050);

  // Camera
  camera.fov = 40;
  camera.position.set(0, 0, 0);
  camera.updateProjectionMatrix();

  const skyColor       = 0x429cf0;
  const horizonColor   = 0x98ffff;
  const groundColorFar = 0xe1f9ff;
  const groundColor    = 0xe6f6fc;
  const skyDome = SkyDome(100, -3.5, skyColor, horizonColor, groundColor, groundColorFar);
  scene.add(skyDome);
  scene.fog = new FogExp2(horizonColor, 0.013); // fade the ground plane to the horizon color..

  const levelContext = levelContextFromConfig(config);
  const gsm = GameStateManager({
    world: world,
    network: options.network,
    players: options.players,
    isPicker: false,
    levelContext: levelContext,
  });

  const tracking = Tracking(gsm);
  const receiver = TargetObjectReceiver({world, gsm});
  receiver.name = "Target Obj Receiver";
  scene.add(receiver);
  addLightRigToWorld(world, false, receiver, skyColor, groundColor, horizonColor, false); // add static and camera following lights to the world

  if (config.dustParticles) {
    addDustToWorld(world);
  }

  // Sounds
  const listener = new AudioListener();
  camera.add(listener);

  const sounds = SoundManager({ gsm, listener });
  camera.add(sounds);

  let isPassAndPauseEnabled = true;
  const correctAnimationDurationMs = correctAnimationDuration * 1000;

  let isCorrectTimestamp;
  gsm.addEventListener(GameStateManagerEvent.correct, (event) => {
    isCorrectTimestamp = Date.now();
    isPassAndPauseEnabled = false;
  });

  world.addEventListener(WorldEvent.update, (event) => {
    if(!isPassAndPauseEnabled && (Date.now() >= (isCorrectTimestamp + correctAnimationDurationMs)))
      isPassAndPauseEnabled = true;
  });

  const pauseCooldown = levelContext.difficulty.pauseCooldown * 1000;
  let lastPauseTime = -pauseCooldown;
  const pauseTrack = function (event) {
    if(!isPassAndPauseEnabled)
      return;

    if (Date.now() >= (lastPauseTime + pauseCooldown)) {
      gsm.pushStateAction({type: GameAction.PauseTrack});
      lastPauseTime = Date.now();
    }
  };

  const passCooldown = levelContext.difficulty.passCooldown * 1000;
  let lastPassTime = -passCooldown;
  const pass = function (event) {
    if(!isPassAndPauseEnabled)
      return;

    if (Date.now() >= (lastPassTime + passCooldown)) {
      gsm.pushStateAction({type: GameAction.Pass});
      lastPassTime = Date.now();
    }
  };

  gsm.addEventListener(GameStateManagerEvent.gameStarted, (event) => {
    lastPauseTime = Date.now() - pauseCooldown;
    lastPassTime = Date.now() - passCooldown;
  });

  Object.keys(GameStateManagerEvent).forEach(type => {
    gsm.addEventListener(type, (event) => options.ui.dispatchEvent(event));
  });

  window.state = gsm.state;

  options.ui.addEventListener(UIEvent.action, (event) => {
    if (event.action === GameAction.Pass)
      pass(event);
    else if (event.action === GameAction.PauseTrack)
      pauseTrack(event);
    else
      gsm.pushStateAction({ type: event.action });
  });

  options.ui.addEventListener(UIEvent.mute, sounds.mute);
  options.ui.addEventListener(UIEvent.unmute, sounds.unmute);

  window.addEventListener('keypress', (event) => {

    let code = event.which || event.keyCode;
    if (code === 32) // space bar pauses
      pauseTrack();
    else if (code === 13) // enter passes
      pass();
    else if (code === 80 || code === 112) { // 'P' or 'F1' mutes/un-mutes

      if (sounds.isMuted)
        sounds.unmute();
      else
        sounds.mute();
    }
  });

  // DEBUG
  window.scene = scene;
  window.camera = camera;
  window.renderer = renderer;

  world.start();

  return world;

}
