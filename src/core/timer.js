import { Object3D, Mesh, GeometryUtils, MeshBasicMaterial, TextGeometry, Box3, BufferGeometry } from 'three';
import { GameStateManagerEvent } from './game-state-manager';
import { GeoText } from './geo-text';

export function createDigitGeometries(font, options) {

  options = Object.assign({
    size: 3,
    height: 0,
    curveSegments: 4,
    bevelThickness: .000002,
    bevelSize: 0.000005,
    bevelEnabled: true,
    useBufferGeometry: true,
  }, options);

  let geometries = [];

  function createDigitGeometry(font, digit) {
    if (!font)
      return;

    let textGeo = new TextGeometry('' + digit, {
      font: font,

      size: options.size,
      height: options.height,
      curveSegments: options.curveSegments,

      bevelThickness: options.bevelThickness,
      bevelSize: options.bevelSize,
      bevelEnabled: options.bevelEnabled,

      material: 0,
      extrudeMaterial: 1

    });

    textGeo.computeVertexNormals();

    // "fix" side normals by removing z-component of normals for side faces
    // (this doesn't work well for beveled geometry as then we lose nice curvature around z-axis)

    if (!options.bevelEnabled) {
      let triangleAreaHeuristics = 0.1 * ( height * size );
      for (let i = 0; i < textGeo.faces.length; i++) {
        let face = textGeo.faces[i];
        if (face.materialIndex == 1) {
          for (let j = 0; j < face.vertexNormals.length; j++) {
            face.vertexNormals[j].z = 0;
            face.vertexNormals[j].normalize();
          }
          let va = textGeo.vertices[face.a];
          let vb = textGeo.vertices[face.b];
          let vc = textGeo.vertices[face.c];
          let s = GeometryUtils.triangleArea(va, vb, vc);
          if (s > triangleAreaHeuristics) {
            for (let j = 0; j < face.vertexNormals.length; j++) {
              face.vertexNormals[j].copy(face.normal);
            }
          }
        }
      }
    }

    if (options.useBufferGeometry)
      textGeo = new BufferGeometry().fromGeometry(textGeo);
    textGeo.computeBoundingBox();

    return textGeo;
  }

  for (let i = 0; i <= 9; i++) {
    geometries[i] = createDigitGeometry(font, i);
  }

  return geometries;
}

export function NumberDisplay(font, digitsGeometry, options) {

  options = Object.assign({
    number: 0,
    color: 0x0078e7,
    pad: true,
    places: 3,
    digitsGeometryOptions: {},
  }, options);

  digitsGeometry = digitsGeometry || createDigitGeometries(font, options.digitsGeometryOptions);

  const numberObj = new Object3D();
  numberObj.name = "Number Display";
  const placementObj = new Object3D(); // offset for all the meshes so we can control layout a bit more...
  placementObj.name = "Number Placement Offset";
  numberObj.add(placementObj);

  const mat = options.material || new MeshBasicMaterial({color: options.color});
  const dim = digitsGeometry[0].boundingBox.max.x - digitsGeometry[0].boundingBox.min.x;
  const padding = 0.25 * dim;
  const totalWdith = dim * options.places + padding * (Math.max(0, options.places - 1));
  const meshes = [];

  for (let i = 0; i <= 9; i++) {
    meshes[i] = [];

    for (let j = 0; j < options.places; j++) {
      meshes[i][j] = new Mesh(digitsGeometry[i], mat);
      meshes[i][j].name = "Digit " + (i) + "-" + (j + 1);
      meshes[i][j].visible = false;
      meshes[i][j].position.x = dim * j + padding * j;
      placementObj.add(meshes[i][j]);
    }
  }

  const box3 = new Box3();

  // HACK: lame way to expose this off an Object3D without subclassing...
  numberObj.userData.setNumber = (number) => {
    let timeStr = number.toString().slice(0, options.places);

    // front pad some zeros so it looks aligned
    // always front pad with zeros, but control the display of the leading zeros
    while (timeStr.length !== options.places) {
      timeStr = "0" + timeStr;
    }

    // turn them all off
    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j < options.places; j++) {
        meshes[i][j].visible = false;
      }
    }

    // turn on each places digit
    let digitCount = 0;
    for (let d = 0; d < options.places; d++) {
      let number = parseInt(timeStr.charAt(d));
      let place = d; // assumes we pre-padded the up to options.places
       // don't show leading zeros
      if (options.pad === false && number === 0 && place !== options.places-1)
        continue;
      meshes[number][place].visible = true;
      digitCount += 1;
    }

    // can't really recompute this because its axis-aligned...in world space and we need object space...
    //box3.setFromObject(numberObj);
    const w = dim * digitCount + padding * (Math.max(0, digitCount - 1));
    const offset = -(totalWdith - w/2.0);
    placementObj.position.set(offset, 0, 0);
  };

  numberObj.userData.setNumber(options.number);

  return numberObj;
}

export function Timer(world, gameStateManager, font, digitsGeometry, options) {

  options = Object.assign({
    digitsGeometryOptions: {},
  }, options);

  digitsGeometry = digitsGeometry || createDigitGeometries(font, options.digitsGeometryOptions);

  const timer = new Object3D();
  timer.name = "Timer Parent";

  const mat = options.material || new MeshBasicMaterial({color: 0x0078e7});

  function createDigitMesh(digit) {
    return new Mesh(digitsGeometry[digit], mat);
  }

  function refreshMeshes(time) {

    if (!font)
      return;

    let timeStr = Math.ceil(Math.max(0, time)).toString();
    // front pad some zeros so it looks aligned
    while (timeStr.length !== 3) {
      timeStr = "0" + timeStr;
    }

    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j < 3; j++) {
        meshes[i][j].visible = false;
      }
    }

    for (let d = 0; d < timeStr.length; d++) {
      meshes[parseInt(timeStr.charAt(d))][(3 - timeStr.length) + d].visible = true;
    }
  }

  let meshes = [];
  for (let i = 0; i <= 9; i++) {

    meshes[i] = [];

    for (let j = 0; j < 3; j++) {

      meshes[i][j] = createDigitMesh(i);
      meshes[i][j].name = "Digit " + (i) + "-" + (j + 1);
      meshes[i][j].visible = false;
      timer.add(meshes[i][j]);
    }

    const dim = 1.25 * ( digitsGeometry[0].boundingBox.max.x - digitsGeometry[0].boundingBox.min.x );
    const offset = -dim / 2;
    meshes[i][0].position.x = -dim + offset;
    meshes[i][1].position.x =        offset;
    meshes[i][2].position.x =  dim + offset;
  }

  let gameStarted = false;

  gameStateManager.addEventListener(GameStateManagerEvent.newTargetDescription, (event) => {
    gameStarted = true;
    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j < 3; j++) {
        meshes[i][j].visible = false;
      }
    }
    refreshMeshes(gameStateManager.time.remainingSecs);
  });

  gameStateManager.addEventListener(GameStateManagerEvent.incorrect, (event) => {
    refreshMeshes(gameStateManager.time.remainingSecs);
  });

  gameStateManager.addEventListener(GameStateManagerEvent.remainingSecsChanged, (event) => {
    refreshMeshes(gameStateManager.time.remainingSecs);
  });

  return timer;
}


export function TimeDisplay(font, digitsGeometry, options) {

  // we will make a bunch of assumptions here:
  // 1) we have 0-padded seconds
  // 2) we have non-padded minutes
  // 3) we have a colon text in the middle

  options = Object.assign({
    number: 0,
    color: 0x0078e7,
    pad: true,
    places: 2,
    digitsGeometryOptions: {},
  }, options);

  const root = new Object3D();
  root.name = "TimeDisplay root";

  const colonText = new GeoText(":", font, options);
  options.pad = true;
  const secondsDisplay = new NumberDisplay(font, digitsGeometry, options);
  options.pad = false;
  const minutesDisplay = new NumberDisplay(font, digitsGeometry, options);

  // position them...
  const colonMesh = colonText.userData.textMesh;
  const halfSize = colonMesh.geometry.boundingBox.getSize().multiplyScalar(0.5);
  const digit0Width = digitsGeometry[0].boundingBox.max.x - digitsGeometry[0].boundingBox.min.x;
  minutesDisplay.position.set(-digit0Width * 1.5 + halfSize.x, 0, 0);
  secondsDisplay.position.set( digit0Width * 1.5 + halfSize.x, 0, 0);
  // number displays are y-top, text is y-centered so offset to line up...
  colonMesh.position.set(-0.16, 0, 0);
  colonMesh.scale.set(0.9,0.9,0.9);

  root.add(minutesDisplay);
  root.add(colonText);
  root.add(secondsDisplay);

  const td = {
    object: root,
    secondsDisplay,
    minutesDisplay,
    colonText,
  };

  td.setTime = function (totalSeconds) {
    if (totalSeconds < 0)
      totalSeconds = 0; // clamp this out just in case we get a negative time

    totalSeconds = Math.round(totalSeconds);
    const seconds = totalSeconds % 60;
    const minutes = (totalSeconds - seconds) / 60;

    minutesDisplay.userData.setNumber(minutes);
    secondsDisplay.userData.setNumber(seconds);
  };

  td.setTime(0);

  return td;
}


