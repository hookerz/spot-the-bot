import { Vector3, Euler, Quaternion } from 'three';

export function eulerDegToQuaternion(eulers) {
  let quaternions = [];
  for (let j = 0; j < eulers.length; j++) {
    let euler = eulers[j];
    euler.multiplyScalar(Math.PI / 180.0);
    euler = new Euler(euler.x, euler.y, euler.z);
    const q = new Quaternion();
    q.setFromEuler(euler);
    quaternions[j] = q;
  }
  return quaternions;
}

export function arrayToVector3(arr) {
  return new Vector3(arr[0], arr[1], arr[2]);
}

export function arrayOfArrayToArrayOfVector3(arr) {
  let res = [];
  for(let i=0; i<arr.length; i++)
    res[i] = arrayToVector3(arr[i]);
  return res;
}
