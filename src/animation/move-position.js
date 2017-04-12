import { Math as MathExt, Vector3 } from 'three';

export function movePosition(world, obj, position, duration, onComplete) {

  const iterator = movePositionIterator(obj, position, duration);
  world.coroutine(iterator).then(onComplete);

}

function* movePositionIterator(obj, position, duration) {

  let progress = 0, dt = 0;
  const v = new Vector3();
  v.set(obj.position.x, obj.position.y, obj.position.z);

  while (progress < duration) {

    progress = progress + dt;

    let t = (progress / duration);
    t = MathExt.clamp(t, 0.01, 1);

    v.lerp(position, t);

    obj.position.set(v.x, v.y, v.z);

    dt = yield null;

  }

}
