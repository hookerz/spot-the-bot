import { Vector3, Quaternion } from 'three';

export function HeadTracker(object, camera, options) {

  options = Object.assign({
    lerpFactor: 10,
    snapping: true,
    preventPingPongAngleThreshold: 0.25,
    segments: 5.0
  }, options);

  let lastRoundedAngle = 0;
  let lastAngle = 0;

  const update = function (event) {

    const targetForward = new Vector3(0, 0, 1);
    targetForward.applyQuaternion(camera.quaternion);
    targetForward.y = 0;

    const forward = new Vector3(0, 0, 1);
    const angle = targetForward.angleTo(forward);
    let finalAngle = angle;

    if(options.snapping) {

      const target = angle / (2 * Math.PI / options.segments);
      const finalTarget = Math.round(target);
      finalAngle = finalTarget * 2 * Math.PI / options.segments;
      if(finalAngle != lastRoundedAngle){
        if(Math.abs(lastAngle - angle) < options.preventPingPongAngleThreshold){
          return;
        }
      }
      lastRoundedAngle = finalAngle;

    }

    lastAngle = angle;

    const t = options.lerpFactor * event.dt;
    const newQ = new Quaternion();

    if(!Number.isNaN(finalAngle)) {
      if (camera.rotation.y < 0)
        finalAngle *= -1;

      newQ.setFromAxisAngle(object.up, finalAngle);
      object.quaternion.slerp(newQ, t);
    }

  };

  return { update };
}


