import { BoxBufferGeometry, CylinderBufferGeometry, MeshLambertMaterial, Mesh, Object3D, Matrix4, Euler} from 'three';

const ease_out = Elastic.easeOut.config ( 1.1, 0.6 );

export let defaultButtonColor = 0x0078e7;


export function CircleButtonMesh(radius=1, depth=0.5, material=undefined) {
  const geo = new CylinderBufferGeometry(radius, radius, depth, 24, 1, false);
  const m = new Matrix4();
  m.makeRotationFromEuler(new Euler(Math.PI / 2.0, 0, 0));
  geo.applyMatrix(m);
  const mat = material || new MeshLambertMaterial({color: defaultButtonColor});
  const mesh = new Mesh(geo, mat);
  mesh.name = "Circle Button Mesh";
  mesh.castShadow = true;
  return mesh;
}

export function VRButton(gazeSelector, clickedCallback, options={}) {

  options = Object.assign({
    width: 1,
    height: 1,
    textOffset: 0.26,
    overScale: 1.08,
    downScale: 0.95,
    createRoot: true,
  }, options);

  let buttonMesh = options.buttonMesh;
  let textMesh = options.textMesh;

  if (!buttonMesh) {
    const buttonGeo = new BoxBufferGeometry(options.width, options.height, 0.5, 1, 1, 1);
    const buttonMat = new MeshLambertMaterial({color: 0x0078e7});
    buttonMesh = new Mesh(buttonGeo, buttonMat);
    buttonMesh.name = "Square Button Mesh";
    buttonMesh.castShadow = true;
  }

  buttonMesh.userData.clickedCallback = clickedCallback || ((event) => console.error("VRButton clicked, but no handler was provided!"));

  if (!gazeSelector.selectableObjects)
    gazeSelector.selectableObjects = [];

  // make this object ray-cast selectable by putting the object in the ray-cast list
  // TODO: support removing this if we decide to drop/delete/hide the button...
  gazeSelector.selectableObjects.push(buttonMesh);

  buttonMesh.userData.selectable = true;
  buttonMesh.userData.over = false;
  buttonMesh.userData.down = false;

  buttonMesh.userData.onGazeOver = function (event) {
    //buttonMesh.scale.set(options.overScale, options.overScale, options.overScale);
    TweenMax.to ( buttonMesh.scale, 0.4, { x: options.overScale, y: options.overScale, z: 1.0, ease: Expo.easeOut, ovewrite: 1 } );
    buttonMesh.userData.over = true;
  };

  buttonMesh.userData.onGazeOut = function (event) {
    //buttonMesh.scale.set(1, 1, 1);
    TweenMax.to ( buttonMesh.scale, 0.6, { x: 1.0, y: 1.0, z: 1.0, ease: ease_out, ovewrite: 1 } );
    buttonMesh.userData.over = false;
    buttonMesh.userData.down = false;
  };

  buttonMesh.userData.onTriggerDown = function (event) {
    //buttonMesh.scale.set(options.downScale, options.downScale, options.downScale);
    TweenMax.fromTo ( buttonMesh.scale, 0.6, { x: 1.02, y: 1.02 }, { x: options.downScale, y: options.downScale, z: 1.0, ease: Expo.easeOut, ovewrite: 1 } );
    buttonMesh.userData.down = true;
  };

  buttonMesh.userData.onTriggerUp = function (event) {
    let scale = 1.0;
    if (buttonMesh.userData.over) {
      scale = options.overScale;
    }
    TweenMax.to ( buttonMesh.scale, 0.6, { x: scale, y: scale, z: 1.0, ease: ease_out, ovewrite: 1 } );
    buttonMesh.userData.down = false;
  };

  buttonMesh.userData.onClicked = function (event) {
    TweenMax.to ( buttonMesh.scale, 0.6, { x: 1.0, y: 1.0, z: 1.0, ease: ease_out, ovewrite: 1 } );
    buttonMesh.userData.clickedCallback(event);
  };

  if (textMesh) {
    textMesh.position.set(0.0, 0.0, options.textOffset);
    buttonMesh.add(textMesh);
  }

  if (options.createRoot) {
    const buttonRoot = new Object3D();
    buttonRoot.name = "VR-Button";
    buttonRoot.userData.buttonMesh = buttonMesh;
    buttonRoot.userData.textMesh = textMesh;
    buttonRoot.add(buttonMesh);
    return buttonRoot;
  }

  return buttonMesh;
}
