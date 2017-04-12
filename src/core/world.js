import { EventDispatcher, WebGLRenderer, PerspectiveCamera, Scene, Vector2, Vector3, Matrix4, Quaternion} from 'three';
import { PromisedCoroutine } from '../util/promised-coroutine';
import Debug from 'debug';
import config from './config';

const debug = Debug('app:world');


export const WorldEvent = Object.freeze({
  resize:  'WorldEvent.resize',
  enterVR: 'WorldEvent.enterVR',
  exitVR:  'WorldEvent.exitVR',
  start:   'WorldEvent.start',
  update:  'WorldEvent.update',
  stop:    'WorldEvent.stop',
  afterCameraPoseUpdate: 'WorldEvent.afterCameraPoseUpdate',
});

const DEG2RAD = Math.PI / 180.0;

export function fovToNDCScaleOffset(fov) {
  const pxscale = 2.0 / ( fov.leftTan + fov.rightTan );
  const pxoffset = ( fov.leftTan - fov.rightTan ) * pxscale * 0.5;
  const pyscale = 2.0 / ( fov.upTan + fov.downTan );
  const pyoffset = ( fov.upTan - fov.downTan ) * pyscale * 0.5;
  return {scale: [pxscale, pyscale], offset: [pxoffset, pyoffset]};
}

export function fovPortToProjection(fov, rightHanded, zNear, zFar) {
  rightHanded = rightHanded === undefined ? true : rightHanded;
  zNear = zNear === undefined ? 0.01 : zNear;
  zFar = zFar === undefined ? 10000.0 : zFar;

  let handednessScale = rightHanded ? -1.0 : 1.0;

  // start with an identity matrix
  let mobj = new Matrix4();
  let m = mobj.elements;

  // and with scale/offset info for normalized device coords
  let scaleAndOffset = fovToNDCScaleOffset(fov);

  // X result, map clip edges to [-w,+w]
  m[0 * 4 + 0] = scaleAndOffset.scale[0];
  m[0 * 4 + 1] = 0.0;
  m[0 * 4 + 2] = scaleAndOffset.offset[0] * handednessScale;
  m[0 * 4 + 3] = 0.0;

  // Y result, map clip edges to [-w,+w]
  // Y offset is negated because this proj matrix transforms from world coords with Y=up,
  // but the NDC scaling has Y=down (thanks D3D?)
  m[1 * 4 + 0] = 0.0;
  m[1 * 4 + 1] = scaleAndOffset.scale[1];
  m[1 * 4 + 2] = -scaleAndOffset.offset[1] * handednessScale;
  m[1 * 4 + 3] = 0.0;

  // Z result (up to the app)
  m[2 * 4 + 0] = 0.0;
  m[2 * 4 + 1] = 0.0;
  m[2 * 4 + 2] = zFar / ( zNear - zFar ) * -handednessScale;
  m[2 * 4 + 3] = ( zFar * zNear ) / ( zNear - zFar );

  // W result (= Z in)
  m[3 * 4 + 0] = 0.0;
  m[3 * 4 + 1] = 0.0;
  m[3 * 4 + 2] = handednessScale;
  m[3 * 4 + 3] = 0.0;

  mobj.transpose();
  return mobj;
}


export function fovToProjection(fov, rightHanded, zNear, zFar) {
  let fovPort = {
    upTan: Math.tan(fov.upDegrees * DEG2RAD),
    downTan: Math.tan(fov.downDegrees * DEG2RAD),
    leftTan: Math.tan(fov.leftDegrees * DEG2RAD),
    rightTan: Math.tan(fov.rightDegrees * DEG2RAD)
  };
  return fovPortToProjection(fovPort, rightHanded, zNear, zFar);
}

export const sharedUniforms = {
  time: {value: 0.0},
  timeDelta: {value: 0.016},
  resolution: { value: new Vector2() },
  eyeResolution: { value: new Vector2() },
  eyeOffset: { value: new Vector2() },
};

export function World(options = {}) {

  // Initialize some three.js objects.
  const renderer = new WebGLRenderer({
    alpha: false,
    stencil: false,
    antialias: !config.mobile,
    preserveDrawingBuffer: false,
    depth: true,
  });

  const canvas  = renderer.domElement;
  const scene   = new Scene();
  const camera  = new PerspectiveCamera(45, 1, 0.05, 200);
  const cameraL = new PerspectiveCamera(45, 1, 0.05, 200);
  const cameraR = new PerspectiveCamera(45, 1, 0.05, 200);

  camera.name = "World Camera";
  cameraL.name = "Left Eye Camera";
  cameraR.name = "Right Eye Camera";
  cameraL.layers.enable(1);
  cameraR.layers.enable(2);

  scene.add(camera);
  // make the left/right camera's children of the main camera for easy eye offset updating...
  camera.add(cameraL);
  camera.add(cameraR);

  let time = 0;
  let presentingVR = false;
  let vrDisplay = null;
  let vrDisplays = null;
  let vrLayers = [];
  let vrLayer = null;
  let frameData = null;
  let rendererUpdateStyle = true;
  let eyeWidth = 1;
  let eyeHeight = 1;
  let lastRAF = 0;
  let requestAnimationFrame = window.requestAnimationFrame.bind(window);
  let cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  let timeScale = 1.0;
  let firstCameraPosition = null;
  let firstCameraRotation = null;

  const eyeStrings = ['left', 'right'];
  const defaultLeftBounds = [0.0, 0.0, 0.5, 1.0];  // x, y, width, height as 0-1
  const defaultRightBounds = [0.5, 0.0, 0.5, 1.0]; // x, y, width, height as 0-1
  const cameras = [cameraL, cameraR];
  const eyeParams = [null, null];
  const eyeBounds = [defaultLeftBounds, defaultRightBounds]; // 0-1 bounds in the shared render target
  const renderRects = [
    {x: 0, y: 0, width: 0, height: 0},
    {x: 0, y: 0, width: 0, height: 0}
  ]; // 0-w, 0-h bounds in the shared render target

  if (window.VRFrameData) {
    frameData = new window.VRFrameData();
  }

  const world = Object.create(EventDispatcher.prototype, {

    renderer:    {value: renderer,    writable: false},
    canvas:      {value: canvas,      writable: false},
    scene:       {value: scene,       writable: false},
    camera:      {value: camera,      writable: false},
    vrCameras:   {value: cameras,     writable: false},
    eyeParams:   {value: eyeParams,   writable: false},
    eyeBounds:   {value: eyeBounds,   writable: false},
    renderRects: {value: renderRects, writable: false},
    frameData:   {value: frameData,   writable: false},

    pixelRatio:   {get: () => window.devicePixelRatio || 1},
    eyeHeight:    {get: () => eyeHeight},
    eyeWidth:     {get: () => eyeWidth},
    renderWidth:  {get: () => presentingVR ? eyeWidth * 2 : window.innerWidth * (window.devicePixelRatio || 1)},
    renderHeight: {get: () => presentingVR ? eyeHeight : window.innerHeight * (window.devicePixelRatio || 1)},
    presentingVR: {get: () => presentingVR},
    vrDisplay:    {get: () => vrDisplay, set: setVRDisplay},
    vrDisplays:   {get: () => vrDisplays},
    vrLayer:      {get: () => vrLayer},
    vrLayers:     {get: () => vrLayers},
    time:         {get: () => time},
    timeScale:    {get: () => timeScale, set: (v) => timeScale = v},
    firstCameraPosition: {get: () => firstCameraPosition},
    firstCameraRotation: {get: () => firstCameraRotation},
    rendererUpdateStyle: {get: () => rendererUpdateStyle, set: (value)=> rendererUpdateStyle = value},
  });

  // query for vr display info and save for later...
  if (options.vr && navigator.getVRDisplays) {
    navigator.getVRDisplays().then((displays) => {
      vrDisplays = displays;
      if (displays && displays.length > 0) {
        // NOTE: we always take the first vrDisplay to avoid having to prompt the user...
        vrDisplay = displays[0];
        if (config.log) debug(vrDisplay.displayName);
      }
    }).catch ((error) => console.warn('getVRDisplays() failed: ' + error));
	}

  function setVRDisplay(vrDisplay) {
    world.setVRDisplay(vrDisplay);
  }

  const setRenderSize = (pixelRatio, width, height, setCanvasStyle=false) => {
    // update the shared uniforms for shaders that need the resolution
    sharedUniforms.resolution.value.set(width * pixelRatio, height * pixelRatio);

    // update the canvas size
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, setCanvasStyle);
  };

  world.updateEyeOffsetsOnly = () => {
    // lets assume both eyes are the same to try to be more efficient
    const offset = vrDisplay.getEyeParameters(eyeStrings[0]).offset;
    cameras[0].position.set( offset[0],  offset[1],  offset[2]);
    cameras[1].position.set(-offset[0], -offset[1], -offset[2]);
  };

  world.updateEyesAndProjectionMatrices = (display, frameData) => {
    // in theory eye distance could change on the fly if the player adjusts IPD
    let params = null;
    let cam = null;
    for (let i = 0; i < 2; i++) {
      cam = cameras[i];
      params = display.getEyeParameters(eyeStrings[i]); // yuck, is ths creating objects? don't seem to have a choice...
      eyeParams[i] = params;
      // local offset from master camera
      cam.position.set(params.offset[0], params.offset[1], params.offset[2]);
      if (!frameData) {
        // fallback for pre-1.1 webvr (i.e. no frameData)
        cam.projectionMatrix = fovToProjection(params.fieldOfView, true, camera.near, camera.far);
      }
    }

    // assume each eye render size is the same for now...
    const eye = eyeParams[0];
    eyeWidth = eye.renderWidth;
    eyeHeight = eye.renderHeight;
    sharedUniforms.eyeResolution.value.set(eyeWidth, eyeHeight);

    if (frameData) {
      cameraL.projectionMatrix.elements = frameData.leftProjectionMatrix;
      cameraR.projectionMatrix.elements = frameData.rightProjectionMatrix;
    }
  };

  world.updateRenderRects = (vrLayer, renderWidth, renderHeight) => {
    // depends on eye bounds
    renderWidth = renderWidth || eyeWidth * 2.0;
    renderHeight = renderHeight || eyeHeight;

    eyeBounds[0] = (vrLayer && vrLayer.leftBounds !== null && vrLayer.leftBounds.length === 4) ? vrLayer.leftBounds : defaultLeftBounds;
    eyeBounds[1] = (vrLayer && vrLayer.rightBounds !== null && vrLayer.rightBounds.length === 4) ? vrLayer.rightBounds : defaultRightBounds;

    for (let i = 0; i < 2; i++) {
      renderRects[i].x = Math.round(renderWidth * eyeBounds[i][0]);
      renderRects[i].y = Math.round(renderHeight * eyeBounds[i][1]);
      renderRects[i].width = Math.round(renderWidth * eyeBounds[i][2]);
      renderRects[i].height = Math.round(renderHeight * eyeBounds[i][3]);
    }
  };

  world.setVRDisplay = (display) => {
    vrDisplay = display;

    vrLayers = vrDisplay.getLayers();
    if (vrLayers.length > 0)
      vrLayer = vrLayers[0]; // only support a single layer for now...

    if (vrDisplay.getFrameData) {
      // near/far need to be set so the projection matrices are correct
      vrDisplay.depthNear = camera.near;
      vrDisplay.depthFar = camera.far;
      vrDisplay.getFrameData(frameData);
    }

    // updates eyeHeight/eyeWidth, eyeParams, and projection matrices
    world.updateEyesAndProjectionMatrices(display, frameData);
    // renderRects depend on eyeWidth/eyeHeight
    world.updateRenderRects(vrLayer, eyeWidth * 2, eyeHeight);

    if (vrDisplay.isPresenting) {
      // only setup the render size if we are presenting
      setRenderSize(1, eyeWidth * 2, eyeHeight, false);
    }
  };

  // reuse this object for resize events so we don't keep allocating objects..
  const resizeEvent = {
    type: 'resize',
    world: world,
    width: 0,
    height: 0,
    vr: false,
  };

  const dispatchResize = () => {
    resizeEvent.width = world.renderWidth;
    resizeEvent.height = world.renderHeight;
    resizeEvent.vr = presentingVR;

    world.dispatchEvent(resizeEvent);
  };

  const swapRequestAnimationFrame = (vrDisplay) => {
    if (lastRAF !== 0)
      cancelAnimationFrame(lastRAF);

    if (vrDisplay) {
      requestAnimationFrame = vrDisplay.requestAnimationFrame.bind(vrDisplay);
      cancelAnimationFrame = vrDisplay.cancelAnimationFrame.bind(vrDisplay);
    } else {
      requestAnimationFrame = window.requestAnimationFrame.bind(window);
      cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
    }

    requestAnimationFrame(renderLoop);
  };

  const onVRDisplayPresentChange = (event) => {
    // not all browsers follow the spec, so we have to get tricky
    let display = world.vrDisplay;
    if (event.display)
      display = event.display;
    if (event.detail)
      display = event.detail.display;

    const wasPresenting = presentingVR;
    presentingVR = (display !== undefined) && display.isPresenting;

    if (presentingVR) {
      // updates bounds, rects, eyes, renderSize
      setVRDisplay(display);
      swapRequestAnimationFrame(display);
      world.dispatchEvent({type: WorldEvent.enterVR, world});
      dispatchResize();
    } else if (wasPresenting) {
      swapRequestAnimationFrame(null);
      world.dispatchEvent({type: WorldEvent.exitVR, world});
      onResize(); // dispatches resize
    }
  };

  function onResize() {
    if (!presentingVR) {
      setRenderSize(window.devicePixelRatio || 1, window.innerWidth, window.innerHeight, rendererUpdateStyle);

      sharedUniforms.eyeResolution.value.set(world.renderWidth, world.renderHeight);
      sharedUniforms.eyeOffset.value.set(0, 0);

      camera.aspect = world.renderWidth / world.renderHeight;
      camera.updateProjectionMatrix();
    }

    dispatchResize();
  }

  world.requestPresent = function () {
    if (vrDisplay === undefined) {
      return Promise.reject(new Error('No VR hardware found.'));
    }

    if (presentingVR) {
      return Promise.resolve();
    }

    return vrDisplay.requestPresent([{source: canvas}]);
  };

  world.exitPresent = function () {
    if (vrDisplay === undefined) {
      return Promise.reject(new Error('No VR hardware found.'));
    }

    if (!presentingVR) {
      return Promise.resolve();
    }

    return vrDisplay.exitPresent();
  };

  world.updateObjectFromPose = (obj, pose) => {
    if (pose)
    {
      if (pose.orientation && !isNaN(pose.orientation[0])) { // sometimes the polyfill gives NaNs for the orientation... wtf
        obj.quaternion.fromArray(pose.orientation);
        if (firstCameraRotation === null)
          firstCameraRotation = new Quaternion().fromArray(pose.orientation);
      }

      if (pose.position) {
        obj.position.fromArray(pose.position);
        if (firstCameraPosition === null)
          firstCameraPosition = new Vector3().fromArray(pose.position);
      }
      else
        obj.position.set(0, 0, 0);
    }
    else
    {
      obj.position.set(0,0,0);
    }
    // TODO: support standing transform and 'stage' parameters...
    // this will update the children eye cameras as well
    obj.updateMatrixWorld(true);
  };

  let pose = null;
  world.render = (scene, camera, renderTarget, forceClear) => {

    // Update the camera pose if we have a VR device, even if we are not presenting yet
    // This allows the WebVR polyfill to let the desktop user pan around
    if (vrDisplay) {
      if (vrDisplay.getFrameData) {
        vrDisplay.depthNear = camera.near;
        vrDisplay.depthFar = camera.far;
        vrDisplay.getFrameData(frameData);

        cameraL.projectionMatrix.elements = frameData.leftProjectionMatrix;
        cameraR.projectionMatrix.elements = frameData.rightProjectionMatrix;

        // NOTE: purposefully not using frameData.leftViewMatrix/rightViewMatrix
        // Three.js won't use camera.matrixWorldInverse directly, it will recompute each render call (per-eye) from matrixWorld
        // lets pull the hmd position/orientation from frameData directly
        pose = frameData.pose;
      }

      if (!pose) // frameData.pos is null or we don't have frameData, so fallback to getPose()
          pose = vrDisplay.getPose();

      world.updateObjectFromPose(camera, pose); // this updates both eye cameras because they are children
      world.dispatchEvent(afterCameraPoseUpdateEvent);
    }
    else
    {
      // first this event for consistency event though we didn't update the camera pose
      world.dispatchEvent(afterCameraPoseUpdateEvent);
    }

    // Regular render mode if we don't have a VR display or we are not presenting yet
    if (!vrDisplay || !presentingVR) {
      renderer.render(scene, camera, renderTarget, forceClear);
      return;
    }

    // stereo VR render only stuff

    // prevent renderer from calling scene.updateMatrixWorld() for each eye
    const autoUpdate = scene.autoUpdate;
    if (autoUpdate) {
      scene.updateMatrixWorld();
      scene.autoUpdate = false;
    }

    if (renderTarget) {
      renderer.setRenderTarget(renderTarget);
      renderTarget.scissorTest = true;
    } else {
      renderer.setRenderTarget(null);
      renderer.setScissorTest(true);
    }

    if (renderer.autoClear || forceClear) renderer.clear();

    world.updateEyeOffsetsOnly();

    // render both eyes
    for (let i = 0; i < 2; i++) {
      const rect = renderRects[i];
      if (renderTarget) {
        renderTarget.viewport.set(rect.x, rect.y, rect.width, rect.height);
        renderTarget.scissor.set(rect.x, rect.y, rect.width, rect.height);
      } else {
        renderer.setViewport(rect.x, rect.y, rect.width, rect.height);
        renderer.setScissor(rect.x, rect.y, rect.width, rect.height);
      }

      sharedUniforms.eyeOffset.value.set(eyeWidth*i, 0);
      renderer.render(scene, cameras[i], renderTarget, forceClear);
    }

    // TODO: possibly move this to when we transition off VR instead
    // restore the previous renderer/renderTarget state in case we exit VR
    if (renderTarget) {

      renderTarget.viewport.set(0, 0, world.renderWidth, world.renderHeight);
      renderTarget.scissor.set(0, 0, world.renderWidth, world.renderHeight);
      renderTarget.scissorTest = false;
      renderer.setRenderTarget(null);

    } else {

      renderer.setViewport(0, 0, world.renderWidth, world.renderHeight);
      renderer.setScissorTest(false);
    }

    // restore the previous autoUpdate state for regular rendering in case we exit VR
    if (autoUpdate) {
      scene.autoUpdate = true;
    }

    vrDisplay.submitFrame();
  };

  // re-used update event
  const updateEvent = {
    type: WorldEvent.update,
    world: world,
    unscaledDt: 0.016,
    unscaledTime: 0.0,
    timeScale: 1.0,
    dt: 0.016,
    time: 0.0,
  };
  // uses updateEvent as the prototype so we get update values of the time stuff, just override the type property
  const afterCameraPoseUpdateEvent = Object.create(updateEvent,
    {
      type: { get: () => WorldEvent.afterCameraPoseUpdate, set: () => {}},
    }
  );

  world.currentTimeEvent = updateEvent;

  let startTime = null;
  const renderLoop = function (currentMillis) {
    world.currentMillis = currentMillis;
    let currentSeconds = currentMillis / 1000.0;

    updateEvent.timeScale = timeScale;
    if (!startTime) {
      // first frame, capture start time from RAF
      startTime = currentSeconds;
      updateEvent.dt = 0.016;
      updateEvent.time = 0.0;
      updateEvent.unscaledDt = 0.016;
      updateEvent.unscaledTime = 0.0;
    } else {
      let newTime = (currentSeconds - startTime);
      updateEvent.unscaledDt = newTime - updateEvent.unscaledTime;
      updateEvent.unscaledTime = newTime;
      updateEvent.dt = updateEvent.unscaledDt * timeScale;
      updateEvent.time += updateEvent.dt;
    }

    // update shared uniforms for with the new time
    sharedUniforms.time.value = updateEvent.time;
    sharedUniforms.timeDelta.value = updateEvent.dt;

    world.dispatchEvent(updateEvent);
    world.render(scene, camera);
    lastRAF = requestAnimationFrame(renderLoop);
  };

  let running = false; // prevent multiple start calls
  world.start = function () {

    if (running) {
      throw new Error("The world is already running.");
    }

    sharedUniforms.eyeResolution.value.set(world.renderWidth, world.renderWidth);
    sharedUniforms.eyeOffset.value.set(0, 0);

    running = true;

    window.addEventListener('vrdisplaypresentchange', onVRDisplayPresentChange);
    window.addEventListener('resize', onResize);

    onResize();
    world.dispatchEvent({type: WorldEvent.start, world});
    lastRAF = requestAnimationFrame(renderLoop);
  };

  world.stop = function () {
    if (lastRAF !== 0)
      cancelAnimationFrame(lastRAF);

    lastRAF = 0;
    running = false;

    window.removeEventListener('resize', onResize);
    window.removeEventListener('vrdisplaypresentchange', onVRDisplayPresentChange);

    world.dispatchEvent({type: WorldEvent.stop, world});
  };

  world.coroutine = function(iterator) {
    return PromisedCoroutine(world, iterator, WorldEvent.update);
  };

  return world;
}
