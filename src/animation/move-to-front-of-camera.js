import { Math as MathExt, Vector3, Quaternion } from 'three';

export function moveToFrontOfCamera(world, camera, obj, duration) {

  const newPosition = new Vector3(0, 0, -5);
  newPosition.applyQuaternion(camera.quaternion);
  newPosition.add(camera.position);

  const temp = new Vector3(0, 0, 1);
  temp.applyQuaternion(camera.quaternion);
  temp.y *= -1;
  const forward = new Vector3(0, 0, 1);
  const angle = temp.angleTo(forward);
  const q = new Quaternion();
  let finalAngle = angle;
  if (camera.rotation.y < 0)
    finalAngle *= -1;
  q.setFromAxisAngle(obj.up, finalAngle);

  const iterator = moveToFrontOfCameraIterator(obj, newPosition, q, duration);
  world.coroutine(iterator).then(() => { });

}

function* moveToFrontOfCameraIterator(obj, position, quaternion, duration) {

  let progress = 0, dt = 0;
  const v = new Vector3();
  v.set(obj.position.x, obj.position.y, obj.position.z);

  while (progress < duration) {

    progress = progress + dt;

    let t = (progress / duration);
    t = MathExt.clamp(t, 0.01, 1);

    v.lerp(position, t);

    obj.position.set(v.x, v.y, v.z);
    obj.quaternion.slerp(quaternion, t);

    dt = yield null;

  }

}
