import { MeshBasicMaterial, Vector3, Euler, Geometry } from 'three';
import { OBJLoader } from '../util/three-ext/obj-loader';
import { query } from '../util/querystring';
import assets from '../core/assets';

const halfPi = Math.PI / 2.0;
const deg2Rad = Math.PI / 180.0;

export const AttachmentType = {
  face: 0x1,
  back: 0x2,
  left: 0x4,
  right: 0x8,
  top: 0x10,
  bottom: 0x20,
  anyButFace: 0xFE,
};

export const AttachmentTypeNames = {};
AttachmentTypeNames[AttachmentType.face]   = "face";
AttachmentTypeNames[AttachmentType.back]   = "back";
AttachmentTypeNames[AttachmentType.left]   = "left";
AttachmentTypeNames[AttachmentType.right]  = "right";
AttachmentTypeNames[AttachmentType.top]    = "top";
AttachmentTypeNames[AttachmentType.bottom] = "bottom";


export const allAttachmentTypes = [
  AttachmentType.face,
  AttachmentType.back,
  AttachmentType.left,
  AttachmentType.right,
  AttachmentType.top,
  AttachmentType.bottom,
];


function convertGeo(obj3D) {
  const geo = new Geometry();
  // convert to buffer geometry for performance
  geo.fromBufferGeometry(obj3D.children[0].geometry);
  geo.mergeVertices();
  return geo;
}




// left vs. right specific (i.e. arms)
export const leftOnly = [];
export const rightOnly = [];

// generic attachments
export const cone        = {name: 'cone'       , type: AttachmentType.anyButFace};
export const cube        = {name: 'cube'       , type: AttachmentType.anyButFace};
export const cylinder    = {name: 'cylinder'   , type: AttachmentType.anyButFace};
export const pyramid     = {name: 'pyramid'    , type: AttachmentType.anyButFace};
export const hemisphere  = {name: 'hemisphere' , type: AttachmentType.anyButFace};

// mechanical
export const bolt     = {name: 'bolt'    , type: AttachmentType.anyButFace};
export const button   = {name: 'button'  , type: AttachmentType.anyButFace};
export const crank    = {name: 'crank'   , type: AttachmentType.anyButFace};
export const dpad     = {name: 'dpad'    , type: AttachmentType.anyButFace};
export const handle   = {name: 'handle'  , type: AttachmentType.anyButFace};
export const helix    = {name: 'helix'   , type: AttachmentType.anyButFace};
export const hex      = {name: 'hex'     , type: AttachmentType.anyButFace};
export const phillips = {name: 'phillips', type: AttachmentType.anyButFace};
export const screw    = {name: 'screw'   , type: AttachmentType.anyButFace};
export const spring   = {name: 'spring'  , type: AttachmentType.anyButFace};

// novelty
export const dial    = {name: 'dial'     , type: AttachmentType.anyButFace};
export const gear    = {name: 'gear'     , type: AttachmentType.anyButFace};
//export const key     = {name: 'key'      , type: AttachmentType.anyButFace};
export const outlet  = {name: 'outlet'   , type: AttachmentType.anyButFace};
export const switch1 = {name: 'switch'   , type: AttachmentType.anyButFace};

export const genericAttachments = [
  cone, cube, cylinder, pyramid, hemisphere,
  bolt, button, crank, dpad, handle, helix, hex, phillips, screw, spring, //key,
  dial, gear, outlet, switch1
];

// hats
export const antenna = {name: 'antenna', type: AttachmentType.top};
export const spinny  = {name: 'spinny', type: AttachmentType.top};

export const headOnlyAttachments = [antenna, spinny];


// eyes
//* brads original eyes
export let eyes1 = {name: 'eyes_00'  , type: AttachmentType.face, emissiveMesh: "eyes_00_emissive"};
export let eyes2 = {name: 'eyes_01'  , type: AttachmentType.face, emissiveMesh: "eyes_01_emissive"}; // waiting on brad to fix this one...
export let eyes3 = {name: 'eyes_02'  , type: AttachmentType.face, emissiveMesh: "eyes_02_emissive"};
export let eyes4 = {name: 'eyes_03'  , type: AttachmentType.face, emissiveMesh: "eyes_03_emissive"};
export let eyes5 = {name: 'eyes_04'  , type: AttachmentType.face, emissiveMesh: "eyes_04_emissive"};
//*/

// eye alternates, remove before production
if (query.eyes == "ryan")
{
  //* ryan's first pass eyes
  eyes1 = {name: 'normal'  , type: AttachmentType.face, emissiveMesh: "normal_emissive"};
  eyes2 = {name: 'angry'   , type: AttachmentType.face, emissiveMesh: "angry_emissive"};
  eyes3 = {name: 'sad'     , type: AttachmentType.face, emissiveMesh: "sad_emissive"};
  eyes4 = {name: 'confused', type: AttachmentType.face, emissiveMesh: "confused_emissive"};
  eyes5 = {name: 'wink'    , type: AttachmentType.face, emissiveMesh: "wink_emissive"};
}

export const faceOnlyAttachments = [eyes1, eyes2, eyes3, eyes4, eyes5];

export const allAttachments = leftOnly.concat(rightOnly).concat(genericAttachments).concat(faceOnlyAttachments).concat(headOnlyAttachments);

// Bases

const boxAndCylinderSlots = [
  {type: AttachmentType.face  , pos: new Vector3( 0.0, -0.1, 0.52), rot: new Euler(   90.0 * deg2Rad,     0.0 * deg2Rad,     0.0 * deg2Rad )},
  {type: AttachmentType.back  , pos: new Vector3( 0.0, 0.0,-0.52),  rot: new Euler(   90.0 * deg2Rad,     0.0 * deg2Rad,  -180.0 * deg2Rad )},
  {type: AttachmentType.top   , pos: new Vector3( 0.0, 0.52, 0.0),  rot: new Euler(  180.0 * deg2Rad,   -40.0 * deg2Rad,   180.0 * deg2Rad )},
  {type: AttachmentType.bottom, pos: new Vector3( 0.0,-0.52, 0.0),  rot: new Euler(  180.0 * deg2Rad,   -60.0 * deg2Rad,     0.0 * deg2Rad )},
  {type: AttachmentType.left  , pos: new Vector3( 0.5, 0.0, 0.0),   rot: new Euler(  145.0 * deg2Rad,     0.0 * deg2Rad,   -90.0 * deg2Rad )},
  {type: AttachmentType.right , pos: new Vector3(-0.52, 0.0, 0.0),  rot: new Euler(   30.0 * deg2Rad,     0.0 * deg2Rad,    90.0 * deg2Rad )},
];

const rotOrder = "XYZ";

export const boxBase = {
  name: 'box',
  slots: boxAndCylinderSlots,
  rootBonePivotPosition: new Vector3(0, -0.5, 0.0),
};

export const cylinderBase = {
  name: 'cylinder',
  slots: boxAndCylinderSlots,
  rootBonePivotPosition: new Vector3(0, -0.5, 0.0),
};

export const tetraBase = {
  name: 'tetra',
  slots: [
    // in the order brad put them in trello
    {type: AttachmentType.face  , pos: new Vector3( 0.00, -0.23,  0.35 ), rot: new Euler(   68.0 * deg2Rad,     0.0 * deg2Rad,    0.0 * deg2Rad )},
    {type: AttachmentType.left  , pos: new Vector3( 0.25, -0.15, -0.07 ), rot: new Euler( -160.9 * deg2Rad,   -34.7 * deg2Rad,  -98.0 * deg2Rad )},
    {type: AttachmentType.right , pos: new Vector3(-0.25, -0.15, -0.07 ), rot: new Euler(  123.2 * deg2Rad,    -3.3 * deg2Rad,  128.0 * deg2Rad )},
    {type: AttachmentType.bottom, pos: new Vector3( 0.00, -0.53 , 0.00 ), rot: new Euler(  180.0 * deg2Rad,    55.5 * deg2Rad,    0.0 * deg2Rad )},
  ],
  rootBonePivotPosition: new Vector3(0, -0.5, 0.0),
};

export const hemisphereBase = {
  name: 'hemisphere',
  slots: [
    {type: AttachmentType.face  , pos: new Vector3(  0.00, -0.07 ,  0.62 ), rot: new Euler(  68.8 * deg2Rad,   0.0 * deg2Rad,   0.0 * deg2Rad )},
    {type: AttachmentType.back  , pos: new Vector3(  0.00, -0.03 , -0.63 ), rot: new Euler( -58.6 * deg2Rad, -46.1 * deg2Rad,   6.4 * deg2Rad )},
    {type: AttachmentType.left  , pos: new Vector3(  0.60,  0.02 ,  0.00 ), rot: new Euler( 146.5 * deg2Rad,  17.3 * deg2Rad, -114.9 * deg2Rad )},
    {type: AttachmentType.right , pos: new Vector3( -0.60,  0.02 ,  0.00 ), rot: new Euler(  35.4 * deg2Rad, -20.3 * deg2Rad,   64.0 * deg2Rad )},
    {type: AttachmentType.top   , pos: new Vector3(  0.00,  0.35,   0.00 ), rot: new Euler(   0.0 * deg2Rad, -23.8 * deg2Rad,    0.0 * deg2Rad )},
    {type: AttachmentType.bottom, pos: new Vector3(  0.00, -0.36,   0.00 ), rot: new Euler(   0.0 * deg2Rad, -26.9 * deg2Rad, -180.0 * deg2Rad )},
  ],
  rootBonePivotPosition: new Vector3(0, -0.5, 0.0),
};

export const trilinderBase = {
  name: 'trilinder',
  slots: [

    {type: AttachmentType.face  , pos: new Vector3(  0.00, -0.10,  0.53 ), rot: new Euler(   90.0 * deg2Rad,     0.0 * deg2Rad,    0.0 * deg2Rad )},
    {type: AttachmentType.left  , pos: new Vector3(  0.33, -0.04, -0.06 ), rot: new Euler( -142.5 * deg2Rad,   -24.6 * deg2Rad,  -72.2 * deg2Rad )},
    {type: AttachmentType.right , pos: new Vector3( -0.33, -0.04,  0.06 ), rot: new Euler(  1220 * deg2Rad,     17.0 * deg2Rad,  115.0 * deg2Rad )},
    {type: AttachmentType.top   , pos: new Vector3(  0.00,  0.52,  0.15 ), rot: new Euler(    0.0 * deg2Rad,    26.2 * deg2Rad,    0.0 * deg2Rad )},
    {type: AttachmentType.bottom, pos: new Vector3(  0.00, -0.55,  0.15 ), rot: new Euler(    0.0 * deg2Rad,   -41.6 * deg2Rad, -180.0 * deg2Rad )},

  ],
  rootBonePivotPosition: new Vector3(0, -0.5, 0.0),
};

export const allBases = [ boxBase, cylinderBase, tetraBase, trilinderBase, hemisphereBase];

function buildAttachmentDescription(name) {
  return {
    key: name,
    url: `geo/attachments/${ name }.obj`,
    loader: OBJLoader,
  };
}

function buildBaseDescription(name) {
  return {
    key: name,
    url: `geo/base/${ name }.obj`,
    loader: OBJLoader,
  };
}

export function getPartsManifest() {
  const manifest = [];

  for (let part of allAttachments) {
    manifest.push(buildAttachmentDescription(part.name));
    if (part.emissiveMesh)
      manifest.push(buildAttachmentDescription(part.emissiveMesh));
  }

  for (let base of allBases) {
    if (base.geometry)
      continue;
    manifest.push(buildBaseDescription(base.name));
  }

  return manifest;
}

let processedGeometry = false;

export function processLoadedGeometry() {
  if (processedGeometry)
    return;

  // NOTE: some base names collide with attachment names so we have to use URL keys
  for (let part of allAttachments) {
    const geo = assets.get(`geo/attachments/${ part.name }.obj`);
    part.geometry = convertGeo(geo);

    if (part.emissiveMesh) {
      const geo = assets.get(`geo/attachments/${ part.emissiveMesh }.obj`);
      part.emissiveGeometry = convertGeo(geo);
    }
  }

  for (let part of allBases) {
    if (part.geometry)
      continue;

    const geo = assets.get(`geo/base/${ part.name }.obj`);
    part.geometry = convertGeo(geo);
  }

  processedGeometry = true;
}

export const punkinPalette =  {
  name: 'punkin',
  base: new MeshBasicMaterial({ color: 0xf7ae29 }),
  attachments: [
    new MeshBasicMaterial({ color: 0x305c8e }),
    new MeshBasicMaterial({ color: 0x702b87 }),
    new MeshBasicMaterial({ color: 0xc53737 }),
    new MeshBasicMaterial({ color: 0xffe62f }),
    new MeshBasicMaterial({ color: 0x09c8c8 }),
    new MeshBasicMaterial({ color: 0xe153a6 }),
  ]
};

export const seaSicklyPalette = {
  name: 'sea-sickly',
  base: new MeshBasicMaterial({ color: 0x39ff8a }),
  attachments: [
    new MeshBasicMaterial({ color: 0x702b87 }),
    new MeshBasicMaterial({ color: 0xa448a4 }),
    new MeshBasicMaterial({ color: 0xc82957 }),
    new MeshBasicMaterial({ color: 0xebdf22 }),
    new MeshBasicMaterial({ color: 0x31b8c0 }),
    new MeshBasicMaterial({ color: 0x6a4484 }),
  ]
};

export const sharksFinPalette = {
  name: 'sharks-fin',
  base: new MeshBasicMaterial({ color: 0x305c8e }),
  attachments: [
    new MeshBasicMaterial({ color: 0xc53737 }),
    new MeshBasicMaterial({ color: 0x8dde1a }),
    new MeshBasicMaterial({ color: 0xf7ae29 }),
    new MeshBasicMaterial({ color: 0xffe62f }),
    new MeshBasicMaterial({ color: 0x28bae8 }),
    new MeshBasicMaterial({ color: 0x323d61 }),
  ]
};

export const punkyBrewserPalette = {
  name: 'punky-brewster',
  base: new MeshBasicMaterial({ color: 0xc82957 }),
  attachments: [
    new MeshBasicMaterial({ color: 0x4f79c5 }),
    new MeshBasicMaterial({ color: 0x8dde1a }),
    new MeshBasicMaterial({ color: 0xff8b25 }),
    new MeshBasicMaterial({ color: 0xebdf22 }),
    new MeshBasicMaterial({ color: 0x31b8c0 }),
    new MeshBasicMaterial({ color: 0x6a4484 }),
  ]
};

export const soylentGreenPalette = {
  name: 'soylent-green',
  base: new MeshBasicMaterial({ color: 0x8dde1a }),
  attachments: [
    new MeshBasicMaterial({ color: 0x4f79c5 }),
    new MeshBasicMaterial({ color: 0xa448a4 }),
    new MeshBasicMaterial({ color: 0xc82957 }),
    new MeshBasicMaterial({ color: 0xebdf22 }),
    new MeshBasicMaterial({ color: 0x31b8c0 }),
    new MeshBasicMaterial({ color: 0x6a4484 }),
  ]
};

export const allWhitePalette = {
  name: 'white',
  base: new MeshBasicMaterial({ color: 0xffffff }),
  attachments: [
    new MeshBasicMaterial({ color: 0xffffff }),
    new MeshBasicMaterial({ color: 0xffffff }),
    new MeshBasicMaterial({ color: 0xffffff }),
    new MeshBasicMaterial({ color: 0xffffff }),
    new MeshBasicMaterial({ color: 0xffffff }),
    new MeshBasicMaterial({ color: 0xffffff }),
  ]
};

export const allColorPalettes = [punkinPalette, seaSicklyPalette, sharksFinPalette, punkyBrewserPalette, soylentGreenPalette]; // allWhitePalette]

export const easyBases = [boxBase, cylinderBase, hemisphereBase];
export const mediumBases = [boxBase, cylinderBase, tetraBase];
export const hardBases = allBases;

export const easyColorPalettes   = [punkinPalette, punkyBrewserPalette, soylentGreenPalette];
export const mediumColorPalettes = [punkinPalette, punkyBrewserPalette, sharksFinPalette, soylentGreenPalette];
export const hardColorPalettes   = allColorPalettes;

export const easyEyes   = [eyes1, eyes2];
export const mediumEyes = [eyes1, eyes2, eyes3];
export const hardEyes   = [eyes1, eyes2, eyes3, eyes4, eyes5];

export const easyGenericAttachments = [cone, cube, cylinder, pyramid, handle, spring, hemisphere];
export const mediumGenericAttachments = [cone, pyramid, handle, spring, button, crank, screw, gear];
export const hardGenericAttachments = genericAttachments;

export const easyAttachmentsByType = {};
easyAttachmentsByType[AttachmentType.face]   = easyEyes;
easyAttachmentsByType[AttachmentType.back]   = easyGenericAttachments;
easyAttachmentsByType[AttachmentType.left]   = easyGenericAttachments;
easyAttachmentsByType[AttachmentType.right]  = easyGenericAttachments;
easyAttachmentsByType[AttachmentType.top]    = easyGenericAttachments;
easyAttachmentsByType[AttachmentType.bottom] = easyGenericAttachments;

export const mediumAttachmentsByType = {};
mediumAttachmentsByType[AttachmentType.face]   = mediumEyes;
mediumAttachmentsByType[AttachmentType.back]   = mediumGenericAttachments;
mediumAttachmentsByType[AttachmentType.left]   = mediumGenericAttachments.concat(leftOnly);
mediumAttachmentsByType[AttachmentType.right]  = mediumGenericAttachments.concat(rightOnly);
mediumAttachmentsByType[AttachmentType.top]    = mediumGenericAttachments.concat(headOnlyAttachments);
mediumAttachmentsByType[AttachmentType.bottom] = mediumGenericAttachments;

export const hardAttachmentsByType = {};
hardAttachmentsByType[AttachmentType.face]   = hardEyes;
hardAttachmentsByType[AttachmentType.back]   = hardGenericAttachments;
hardAttachmentsByType[AttachmentType.left]   = hardGenericAttachments.concat(leftOnly);
hardAttachmentsByType[AttachmentType.right]  = hardGenericAttachments.concat(rightOnly);
hardAttachmentsByType[AttachmentType.top]    = hardGenericAttachments.concat(headOnlyAttachments);
hardAttachmentsByType[AttachmentType.bottom] = hardGenericAttachments;

export const allAttachmentsByType = {};
allAttachmentsByType[AttachmentType.face]   = faceOnlyAttachments;
allAttachmentsByType[AttachmentType.back]   = hardGenericAttachments;
allAttachmentsByType[AttachmentType.left]   = hardGenericAttachments.concat(leftOnly);
allAttachmentsByType[AttachmentType.right]  = hardGenericAttachments.concat(rightOnly);
allAttachmentsByType[AttachmentType.top]    = hardGenericAttachments.concat(headOnlyAttachments);
allAttachmentsByType[AttachmentType.bottom] = hardGenericAttachments;

export function cloneAttachmentsByType(attachmentsByType) {
  // 1 level 'deep' clone
  const res = {};
  for (let i=0; i < allAttachmentTypes.length; i++) {
    const slot = allAttachmentTypes[i];
    res[slot] = attachmentsByType[slot].slice(0); // shallow copy of the array
  }
  return res;
}


