import { Vector3, ShaderMaterial, Color, Mesh, CylinderBufferGeometry, Matrix4, Object3D, MeshStandardMaterial, MeshPhongMaterial} from 'three';
import assets from './assets';
import config from './config';

import vertexShader from './shaders/laser-vert.glsl';
import fragmentShader from './shaders/laser-frag.glsl';

const laserMeshDefaultLength = 5.0;

const laserUniforms = {
  innerColor: { value: new Color(0xffffff) },
  outerColor: { value: new Color(0xff9090) },
  alphaPower: { value: 1.0 },
  colorPower: { value: 15.0 },
};

export const laserMaterial = new ShaderMaterial({
  fog: false,
  transparent: true,
  uniforms: laserUniforms,
  vertexShader,
  fragmentShader,
});

// DEBUG
window.laserMaterial = laserMaterial;
window.createDummyController = function () {
  const handler = VRPlayerControllerHandler({index: 10});
  const root = handler.root;
  root.position.set(0, -0.08, -0.2);
  root.rotation.set(Math.PI * 0.5, 0, 0);
  window.scene.add(root);
  return root;
};

export function VRPlayerControllerHandler(gamepad) {
  const root = new Object3D();
  root.name = "Gamepad[" + gamepad.index + "] Root: " + gamepad.id;
  root.userData.gamepad = gamepad;

  // wand / controller
  let wandMat = null;
  if (config.pbr) {
    wandMat = new MeshStandardMaterial({color: 0xffffff, roughness: 0.6, metalness: 0.9})
  } else {
    wandMat = new MeshPhongMaterial({color: 0x303030, specular: 0x909090, shininess: 20.0})
  }

  const wandMesh = assets.get("wand").children[0].clone();
  wandMesh.scale.set(2.0, 2.0, 2.0);
  wandMesh.material = wandMat;
  root.add(wandMesh);

  // laser pointer
  const laserMat = laserMaterial.clone();
  const laserGeo = new CylinderBufferGeometry(0.005, 0.005, 1, 12, 1, true);
  const move = new Matrix4();
  move.makeRotationX(-Math.PI/2);
  laserGeo.applyMatrix(move); //  offset so the pivot is at the z-bottom
  move.makeTranslation(0, 0, -0.5);
  laserGeo.applyMatrix(move); // offset so the pivot is at the z-bottom
  const laserMesh = new Mesh(laserGeo, laserMat); // start off as a unit-cube so we scale
  laserMesh.scale.set(1, 1, laserMeshDefaultLength);
  root.userData.laserMesh = laserMesh;
  root.userData.laserMaterial = laserMat;
  root.userData.wandMaterial = wandMat;
  root.add(laserMesh);

  const dist = new Vector3();
  const wp = new Vector3();
  const scaleLaser = function (sourcePos, destPos, laser) {
    dist.subVectors(destPos, sourcePos);
    laser.scale.set(1, 1, dist.length());
  };

  const onGamePadHold = function (gamePadState, hitObject) {
    const root = gamePadState.root;
    const laserMesh = root.userData.laserMesh;
    if (!laserMesh)
      return;
    // we assume root has no parent, and no scale, this .position == world position
    // for hitObject, can't assume that
    hitObject.getWorldPosition(wp);
    scaleLaser(root.position, wp, laserMesh);
    laserMat.uniforms.alphaPower.value = 0.5;
    laserMat.uniforms.colorPower.value = 20.0;
    laserMat.uniforms.outerColor.value.setHex(0xff0000);
  };

  const onGamePadOut = function (gamePadState, hitObject) {
    const root = gamePadState.root;
    const laserMesh = root.userData.laserMesh;
    if (!laserMesh)
      return;
    laserMesh.scale.set(1, 1, laserMeshDefaultLength);
    laserMat.uniforms.alphaPower.value = 1.0;
    laserMat.uniforms.colorPower.value = 15.0;
    laserMat.uniforms.outerColor.value.setHex(0xff9090);
  };

  return {
    onOver: onGamePadHold, // intentionally the same as onHold
    onHold: onGamePadHold,
    onOut: onGamePadOut,
    root,
  };
}


