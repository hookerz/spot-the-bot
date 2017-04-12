import { RingGeometry, Mesh, MeshBasicMaterial } from 'three';
import { WorldEvent } from './world';
import { GazeSelectorEvent } from './gaze-selector';

export function ReticleRing(gazeSelector, world, options={}) {
  // default options
  options = Object.assign({
    dotInnerRadius : 0.00001,
    dotOuterRadius : 0.003,
    ringInnerRadius: 0.017,
    ringOuterRadius: 0.025,
    transitionTime : 150,
    backOffPercent : 0.5,
    color : 0xed475c,
  }, options);

  const {camera} = world;

  let morphSetTime = -options.transitionTime;
  let morphSetValue = 0;
  let morphTargetValue = 0;
  let trackingOn = gazeSelector.gazeTracking;

  let dotGeometry = new RingGeometry( options.dotInnerRadius, options.dotOuterRadius, 30, 1);
  let ringGeometry = new RingGeometry( options.ringInnerRadius, options.ringOuterRadius, 30, 1);

  dotGeometry.morphTargets.push({ name: "ring", vertices: ringGeometry.vertices});

  const ringMesh = new Mesh(
    dotGeometry,
    new MeshBasicMaterial({
      color: options.color,
      morphTargets: true,
      fog: false
    })
  );

  ringMesh.name = "GazeRing";
  ringMesh.scale.set(1, 1, 1);
  ringMesh.position.set(0,0, -1);
  camera.add(ringMesh);

  function updateDistanceAndScale(intersection) {
    const d = intersection.distance * options.backOffPercent;
    ringMesh.position.set(ringMesh.position.x, ringMesh.position.y, -d);
    ringMesh.scale.set(d, d, d);
  }

  function onGazeChanged(event) {
    if (!trackingOn)
      return false;

    if (event.object) {
      morphTargetValue = 1.0;
      morphSetValue = ringMesh.morphTargetInfluences[0];
      morphSetTime = Date.now();
      updateDistanceAndScale(event.intersection);
    } else {
      morphTargetValue = 0.0;
      morphSetValue = ringMesh.morphTargetInfluences[0];
      morphSetTime = Date.now();
      ringMesh.position.set(ringMesh.position.x, ringMesh.position.y, -1);
      ringMesh.scale.set(1, 1, 1);
    }
  }

  function onGazeContinue(event) {
    if (event.object) {
      updateDistanceAndScale(event.intersection);
    }
  }

  function gazeTrackingOn(event) {
    trackingOn = true;
    ringMesh.visible = true;
  }

  function gazeTrackingOff(event) {
    trackingOn = false;
    ringMesh.visible = false;
    // contract mesh
    morphTargetValue = 0.0;
    morphSetValue = ringMesh.morphTargetInfluences[0];
    morphSetTime = Date.now() - options.transitionTime;
    ringMesh.position.set(0,0, -1);
  }

  gazeSelector.addEventListener( GazeSelectorEvent.gazeChanged, onGazeChanged);
  gazeSelector.addEventListener( GazeSelectorEvent.gazeContinue, onGazeContinue);
  gazeSelector.addEventListener( GazeSelectorEvent.gazeTrackingOn, gazeTrackingOn);
  gazeSelector.addEventListener( GazeSelectorEvent.gazeTrackingOff, gazeTrackingOff);

  const smoothstep = function(min, max, value) {
    const x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return x*x*(3 - 2*x);
  };

  world.addEventListener(WorldEvent.update, () => {
    if (!trackingOn)
      return;

    if (ringMesh.morphTargetInfluences[0] != morphTargetValue) {
      let p = (Date.now() - morphSetTime) / options.transitionTime;
      if (p > 1)
        p = 1;

      ringMesh.morphTargetInfluences[0] = smoothstep(morphSetValue, morphTargetValue, p);
    }
  });

  return {
    mesh: ringMesh
  };
}
