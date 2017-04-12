import { Vector3,  HemisphereLight, DirectionalLight, Object3D, Math as TMath, AxisHelper } from 'three';
import { WorldEvent } from './world';
import config from './config';

const xzPlane = new Vector3(0, 1, 0);
const tempForward = new Vector3();
const refForward = new Vector3(0, 0, -1);
const tempCross = new Vector3();

export function matchOrientationXZOnly(src, dest) {
  tempForward.set(0, 0, -1);
  tempForward.applyQuaternion(src.quaternion);
  tempForward.projectOnPlane(xzPlane);

  if (tempForward.lengthSq() < 0.001) {
    // the project forward is too small, don't change until it gets bigger
    return;
  }
  tempForward.normalize(); // new forward vector;
  let angle = tempForward.angleTo(refForward);
  // we need to determine the sign...
  //tempCross.crossVectors(refForward, tempForward);
  tempCross.crossVectors(tempForward, refForward);
  if (tempCross.y > 0) {
    angle = -angle;
  }

  dest.rotation.set(0, angle, 0);
}




export function createLightRig(shadows=false, skyColor=0x0077ff, groundColor=0x5c6fb1, horizonColor=0x8c4122, addLightHelpers=false) {

  const lightRigHead = new Object3D();
  lightRigHead.name = "Light Rig Head";

  const lightRigStatic = new Object3D();
  lightRigStatic.name = "Light Rig Static";

  const fillLight = new DirectionalLight ( 0xbeb691, 0.23 );
  fillLight.rotation.set ( -0.2930002641491836, -0.3696461525494881, 0.06829124539563611 );
  fillLight.position.set ( 3.416243169978211, -2.6993925914903807, 5 );
  fillLight.name = 'Fill Light';

  const keyLight = new DirectionalLight ( 0xffffff, 0.4 );
  keyLight.position.set ( -0.68, 2.14, 4.56 );
  keyLight.rotation.set ( -0.32, 0.02, 0.00 );
  keyLight.name = 'Key Light';

  //const rimLight = new DirectionalLight ( horizonColor, 0.0 );
  //rimLight.position.set ( 4.57, 4.39, -16 );
  //rimLight.rotation.set ( -3.2, -8.38, -3.13 );
  //rimLight.name = 'Rim Light';

  //const hemiLight = new HemisphereLight ( skyColor, groundColor, 0.5 ); // originally brad called for a 0.8 intensity here but I backed it off a bit
  const hemiLight = new HemisphereLight ( 0xc5b89a, 0xb8a7c0, 0.8 );
  hemiLight.name = "Hemisphere Light";

  lightRigHead.add(keyLight);

  if (!config.singleLight) {
    lightRigHead.add(fillLight);
    //lightRigHead.add(rimLight);
  }

  lightRigStatic.add(hemiLight);

  if (!config.pbr) {
    keyLight.intensity = 0.25;
    hemiLight.intensity = 1.0;
  }

  if (addLightHelpers) {
    fillLight.add(new AxisHelper(1));
    keyLight.add(new AxisHelper(1));
    //rimLight.add(new AxisHelper(1));
    hemiLight.add(new AxisHelper(1));
  }

  //debug
  window.fillLight = fillLight;
  window.keyLight = keyLight;
  //window.rimLight = rimLight;
  window.hemiLight = hemiLight;

  if (shadows) {
    const size = 25.0;
    const shadowLight = new DirectionalLight ( 0xffffff, 0.0 );
    shadowLight.name = 'Shadow Light';
    shadowLight.castShadow = true;
    shadowLight.position.set (0, 15, 0);
    shadowLight.rotation.set(0, 0, 0);
    shadowLight.shadow.camera.near = 0.1;
    shadowLight.shadow.camera.far = 30;
    shadowLight.shadow.camera.right = size;
    shadowLight.shadow.camera.left = -size;
    shadowLight.shadow.camera.top	= size;
    shadowLight.shadow.camera.bottom = -size;
    shadowLight.shadow.mapSize.width = config.shadowMapSize;
    shadowLight.shadow.mapSize.height = config.shadowMapSize;
    shadowLight.shadow.radius = 1.5;

    lightRigStatic.add(shadowLight);
    if (addLightHelpers) {
      shadowLight.add(new AxisHelper(1));
    }

    window.shadowLight = shadowLight;
  }

  return {lightRigHead, lightRigStatic};
}

export function addLightRigToWorld(world, shadows=false, camFollowObject=undefined, skyColor=0x0077ff, groundColor=0x5c6fb1, horizonColor=0x8c4122, addLightHelpers=false) {
  const rig = createLightRig(shadows, skyColor, groundColor, horizonColor, addLightHelpers);
  world.scene.add(rig.lightRigStatic);

  if (!camFollowObject) {
    camFollowObject = new Object3D();
    camFollowObject.name = "Camera Yaw Follow";
    world.scene.add(camFollowObject);
    /*
    // DEBUG
    window.camFollowObject = camFollowObject;
    // TEMP
    const m = new Mesh(new SphereGeometry(0.1, 10, 10), new MeshBasicMaterial({color:0x0000FF}));
    m.position.set(0, 0, -20);
    camFollowObject.add(m);
    */

    world.addEventListener(WorldEvent.afterCameraPoseUpdate, () => {
      matchOrientationXZOnly(world.camera, camFollowObject);
    });
  }

  camFollowObject.add(rig.lightRigHead);

  return camFollowObject;
}


