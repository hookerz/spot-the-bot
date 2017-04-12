import { Object3D, Geometry, Mesh, MeshBasicMaterial, Vector3, Vector4, Euler, VertexColors, Bone, Skeleton, SkinnedMesh, BufferGeometry} from 'three';
import { shuffle } from '../util';
import * as parts from './parts';
import config, {DefaultMaterial, DefaultPortalShadowMaterial} from './config';
import Debug from 'debug';

const debug = Debug('app:robots');


const sharedMaterialOptions = {
  vertexColors: VertexColors,
  skinning: true,
};

if (config.pbr) {
  sharedMaterialOptions.roughness = 0.3;
  sharedMaterialOptions.metalness = 0.0;
} else {
  sharedMaterialOptions.shininess = 200;
}

const robotSharedMaterial = new DefaultMaterial(sharedMaterialOptions);
// this material is a fork on the standard material but add's support for a single portal shadow
const robotSharedPortalMaterial = new DefaultPortalShadowMaterial(sharedMaterialOptions);
// fake emissive by not using lighting
export const defaultEmissiveMat = new MeshBasicMaterial({color:0xffffff});

export function setRobotMaterialsCubemap(cubeMap) {

  robotSharedMaterial.envMap = cubeMap;
  robotSharedPortalMaterial.envMap = cubeMap;

}

// a random number generator only used for the bot generation
const rnd = config.seed ? new Math.seedrandom(config.seed) : Math.random ;

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(rnd() * (max - min)) + min;
}

function getRandomSubArray(arr, size) {
    let shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * rnd());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

function sampleDifferentValue(currentValue, sampler) {
  let newValue = sampler();
  while (newValue === currentValue)
    newValue = sampler();
  return newValue;
}

export function indexDistance(g1, g2) {
  return (g1 == g2) ? 0 : 1;
}

// we might get more complex with color and base distances at some point...
export const colorDistance = indexDistance;
export const baseDistance = indexDistance;

export function descriptionDistance(d1, d2) {
  if (!d1 || !d2) {
    return Infinity;
  }

  let dist = 0;
  // main color is most important, use a 3x multiplier
  dist += baseDistance(d1.baseIndex, d2.baseIndex) * 10.0;
  dist += colorDistance(d1.colorIndex, d2.colorIndex) * 3.0;

  for (let i=0; i < parts.allAttachmentTypes.length; i++) {
    let type = parts.allAttachmentTypes[i];

    if (d1.attachments[type] && d2.attachments[type]) {
      // both has the attachment type
      dist += colorDistance(d1.attachments[type].colorIndex     , d2.attachments[type].colorIndex);
      dist += indexDistance(d1.attachments[type].attachmentIndex, d2.attachments[type].attachmentIndex);
    } else if (!d1.attachments[type] && !d2.attachments[type]) {
      // neither has the attachment type
      // no difference here
    }
    else {
      // one object has the attachment type and the other doesn't
      dist += 2; // 1 for color, 1 type
    }
  }

  return dist;
}

function setValueOperator(propertyName, value) {
  return (object) => {
    if (config.log) debug(propertyName, " = ", value, object);
    object[propertyName] = value;
  }
}

// the min/max just add some safety in case the original starting numbers change
function addToValueOperator(propertyName, value=1, min=undefined , max=undefined) {
  return (object) => {
    const originalValue = object[propertyName];
    const newValue = originalValue + value;
    if (min !== undefined && min > newValue) {
      if (config.log) debug("value operator: " + propertyName + " reached min value: ", originalValue, min);
      return; // no change
    }
    if (max !== undefined && max < newValue) {
      if (config.log) debug("value operator: " + propertyName + " reached max value: ", originalValue, max);
      return; // no change
    }
    if (config.log) debug(propertyName, " = ", newValue, ",", value, object);
    object[propertyName] = newValue;
  };
}

function addGenericPartOperator(part) {
  return (object) => {
    object.attachmentsByType[parts.AttachmentType.back].push(part);
    object.attachmentsByType[parts.AttachmentType.left].push(part);
    object.attachmentsByType[parts.AttachmentType.right].push(part);
    object.attachmentsByType[parts.AttachmentType.top].push(part);
    object.attachmentsByType[parts.AttachmentType.bottom].push(part);
    if (config.log) debug("added generic part: " + part.name);
  }
}

function addEyePartOperator(part) {
  return (object) => {
    object.attachmentsByType[parts.AttachmentType.face].push(part);
    if (config.log) debug("added eye part: " + part.name);
  }
}

function addBaseOperator(base) {
  return (object) => {
    object.baseModels.push(base);
    if (config.log) debug("added base: " + base.name);
  }
}

function addColorPaletteOperator(palette) {
  return (object) => {
    object.baseColorPalettes.push(palette);
    if (config.log) debug("added color palette: " + palette.name);
  }
}

function logMilestoneOperator(name) {
  return (object) => {
    if (config.log) debug("Milestone: " + name);
  }
}


const minBots = 5;
const maxBots = 20;

const incrementBotCount = addToValueOperator("botCount", 1, minBots, maxBots);
const incrementTrackSpeed = addToValueOperator("trackSpeed", 0.0025, 0.02, 0.05);
const incrementCloseCallCount = addToValueOperator("closeCallCount", 1, 1, maxBots);
const decrementCloseCallMutations = addToValueOperator("closeCallAttachmentMutations", -1, 1, 5);
const decrementMinRandomDistance = addToValueOperator("minRandomDistance", -1, 2, 20);
const setIncorrectGuessPenalty = (p) => setValueOperator("incorrectGuessPenalty", p);
const setCorrectGuessBonus = (p) => setValueOperator("correctGuessBonus", p);

export const defaultDifficultyProgressionList = [
  [incrementBotCount, incrementCloseCallCount],
  [incrementBotCount, addGenericPartOperator(parts.crank), incrementTrackSpeed],
  [incrementBotCount, addBaseOperator(parts.tetraBase), addColorPaletteOperator(parts.sharksFinPalette)],
  [incrementBotCount, incrementCloseCallCount],
  [incrementBotCount, addGenericPartOperator(parts.button)],
  [incrementTrackSpeed, addEyePartOperator(parts.eyes3)],
  [decrementCloseCallMutations, addGenericPartOperator(parts.screw)],
  [incrementCloseCallCount, addGenericPartOperator(parts.gear)],

  [logMilestoneOperator("MEDIUM DIFFICULTY"), setIncorrectGuessPenalty(-10), setCorrectGuessBonus(20)], // index 9
  [addColorPaletteOperator(parts.seaSicklyPalette), incrementTrackSpeed],
  [addEyePartOperator(parts.eyes4)],
  [addGenericPartOperator(parts.bolt)],
  [addBaseOperator(parts.trilinderBase)],
  [incrementCloseCallCount, incrementTrackSpeed],
  [addGenericPartOperator(parts.antenna)],
  [addEyePartOperator(parts.eyes5)],
  [addGenericPartOperator(parts.spinny)],
  [addGenericPartOperator(parts.outlet), incrementTrackSpeed],
  [incrementCloseCallCount],
  [decrementCloseCallMutations],
  [addGenericPartOperator(parts.outlet)],
  [addGenericPartOperator(parts.switch1)],
  [addGenericPartOperator(parts.dial)],
  [addGenericPartOperator(parts.dpad), incrementTrackSpeed],
  [incrementTrackSpeed],
  [addGenericPartOperator(parts.outlet), incrementTrackSpeed],
  [addGenericPartOperator(parts.hex), addGenericPartOperator(parts.phillips), incrementTrackSpeed], // all three screw types are now in (ouch!)

  [logMilestoneOperator("HARD DIFFICULTY"), setIncorrectGuessPenalty(-15), setCorrectGuessBonus(15), incrementTrackSpeed],
];

// TODO: make this class data only and move methods to LevelContext so we can send this over the wire between clients
export function Difficulty(options = {}) {

  let dif = Object.create(Object.prototype, {});
  // make a clone of the arrays/dicts for the robot stuff so we can mutate freely
  // available robot parts
  dif.baseModels        = (options.baseModels || parts.easyBases).slice(0);
  dif.attachmentsByType = parts.cloneAttachmentsByType(options.attachmentsByType || parts.easyAttachmentsByType);

  // track
  dif.trackSpeed = options.trackSpeed || 0.02;

  // available colors
  dif.baseColorPalettes = (options.baseColorPalettes || parts.easyColorPalettes).slice(0);

  // robot pool generation
  dif.botCount                     = options.botCount || minBots;
  dif.closeCallCount               = options.closeCallCount || 1;
  dif.closeCallAttachmentMutations = options.closeCallAttachmentMutations || 4;
  dif.minRandomDistance            = options.minRandomDistance ||  6;

  // game play options
  dif.gameStartingTime      = options.gameStartingTime      || 60; // in seconds
  dif.incorrectGuessPenalty = options.incorrectGuessPenalty || -5; // in seconds
  dif.correctGuessBonus     = options.correctGuessBonus     || 30; // in seconds
  dif.pauseCooldown         = options.pauseCooldown         || 30; // in seconds
  dif.pauseDuration         = options.pauseDuration         || 6; // in seconds
  dif.passCooldown          = options.passCooldown          || 30; // in seconds

  dif.randomBaseColorIndex = function () {
    return getRandomInt(0, dif.baseColorPalettes.length);
  };

  dif.randomAttachmentColor = function (baseIndex) {
    return getRandomInt(0, dif.baseColorPalettes[baseIndex].attachments.length);
  };

  dif.randomAttachmentByType = function (type) {
    return getRandomInt(0, dif.attachmentsByType[type].length);
  };

  dif.randomBase = function () {
    return getRandomInt(0, dif.baseModels.length);
  };

  dif.randomObjectDescription = function() {
    const baseIndex = dif.randomBase();
    const res = {
      colorIndex: dif.randomBaseColorIndex(),
      baseIndex: baseIndex,
      attachments: {}
    };

    const base = dif.baseModels[baseIndex];

    for (let i=0; i < base.slots.length; i++) {
      const type = base.slots[i].type;
      res.attachments[type] = {
        attachmentIndex: dif.randomAttachmentByType(type),
        colorIndex: dif.randomAttachmentColor(res.colorIndex),
      };
    }
    return res;
  };

  dif.mutateObjectDescription = function (desc, allowMainColorMutation=false, attachmentColorMutations=1, attachmentShapeMutations=1) {
    //const newDesc = Object.assign({}, desc); // this doesn't work, shallow copy of attachments
    const newDesc = JSON.parse(JSON.stringify(desc));
    if (allowMainColorMutation) {
      // pick a random color may or may not be the same
      newDesc.colorIndex = dif.randomBaseColorIndex();
    }
    // we assume that we keep the base model here...
    const base = dif.baseModels[desc.baseIndex];
    const colorSlots = getRandomSubArray(base.slots, attachmentColorMutations);
    const attachSlots = getRandomSubArray(base.slots, attachmentShapeMutations);

    for (let i=0; i < colorSlots.length; i++) {
      const slot = colorSlots[i];
      newDesc.attachments[slot.type].colorIndex = sampleDifferentValue(newDesc.attachments[slot.type].colorIndex, () => dif.randomAttachmentColor(newDesc.colorIndex));
    }

    for (let i=0; i < attachSlots.length; i++) {
      const slot = attachSlots[i];
      newDesc.attachments[slot.type].attachmentIndex = sampleDifferentValue(newDesc.attachments[slot.type].attachmentIndex, () => dif.randomAttachmentByType(slot.type));
    }

    return newDesc;
  };

  dif.generateDescriptionPool = function (targetDescription) {
    const res = [targetDescription];
    for (let i=0; i < dif.closeCallCount; i++) {
      const attachmentColorMutations = getRandomInt(0, dif.closeCallAttachmentMutations);
      const attachmentShapeMutations = dif.closeCallAttachmentMutations - attachmentColorMutations;
      const d = dif.mutateObjectDescription(targetDescription, false, attachmentColorMutations, attachmentShapeMutations);
      res.push(d);
    }

    // rejection sample random objects with a min distance from the target
    while (res.length < dif.botCount) {
      const d = dif.randomObjectDescription();
      if (descriptionDistance(d, targetDescription) >= dif.minRandomDistance) {
        // keep it
        res.push(d);
      }
    }
    return shuffle(res);
  };

  return dif;
}

export function staticDifficultyProgression(difficulty, round) {
  return difficulty;
}

export function createOperatorDifficultyProgression(operatorList) {

  return function (difficulty, round) {
    if (round >= operatorList.length) {
      // no changes, we have exhausted the list of operators
      return difficulty;
    }
    const operators = operatorList[round];
    for (let i=0 ; i < operators.length; i++) {
      const op = operators[i];
      op(difficulty);
    }

    return difficulty;
  }
}

export const easyDifficultyProgression = createOperatorDifficultyProgression(defaultDifficultyProgressionList);
export const mediumDifficultyProgression = createOperatorDifficultyProgression(defaultDifficultyProgressionList.slice(9)); // this number needs to get updated if the difficulty list changes...lame
export const hardDifficultyProgression = staticDifficultyProgression; // just assume hard is as hard as it gets for now

export function LevelContext(difficulty, difficultyProgression) {

  const ctx = Object.create(Object.prototype, {});
  ctx.difficulty = difficulty || Difficulty();
  ctx.originalDifficulty = ctx.difficulty;
  ctx.round = 0;
  ctx.difficultyProgression = difficultyProgression || easyDifficultyProgression;

  // forward these methods to the current difficulty
  ctx.randomObjectDescription = function() {
    return ctx.difficulty.randomObjectDescription();
  };

  ctx.mutateObjectDescription = function (targetDescription, allowMainColorMutation=false, attachmentColorMutations=1, attachmentShapeMutations=1) {
    return ctx.difficulty.mutateObjectDescription(targetDescription, allowMainColorMutation, attachmentColorMutations, attachmentShapeMutations);
  };

  ctx.generateDescriptionPool = function (targetDescription) {
    return ctx.difficulty.generateDescriptionPool(targetDescription);
  };

  ctx.nextRound = function () {
    ctx.difficulty = ctx.difficultyProgression(ctx.difficulty, ctx.round);
    ctx.round += 1;
    return ctx.round;
  };

  ctx.resetDifficulty = function () {
    ctx.round = 0;
    ctx.difficulty = Difficulty(ctx.originalDifficulty); // clone it!
  };

  return ctx;
}


export const easyLevelContext = new LevelContext(new Difficulty({
  baseModels: parts.easyBases,
  attachmentsByType: parts.easyAttachmentsByType,
  baseColorPalettes: parts.easyColorPalettes,

  botCount: minBots,
  closeCallCount: 2,
  closeCallAttachmentMutations: 5,
  minRandomDistance: 10,
  incorrectGuessPenalty:  -10,
  correctGuessBonus: 30,
}), easyDifficultyProgression);

export const mediumLevelContext = new LevelContext(new Difficulty({
  baseModels: parts.mediumBases,
  attachmentsByType: parts.mediumAttachmentsByType,
  baseColorPalettes: parts.mediumColorPalettes,
  botCount: 10,
  closeCallCount: 4,
  closeCallAttachmentMutations: 4,
  minRandomDistance: 8,

  gameStartingTime: 120,
  incorrectGuessPenalty:  -15,
  correctGuessBonus: 25,
}), mediumDifficultyProgression);

export const hardLevelContext = new LevelContext(new Difficulty({
  baseModels: parts.allBases,
  attachmentsByType: parts.allAttachmentsByType,
  baseColorPalettes: parts.allColorPalettes,
  botCount: 15,
  closeCallCount: 6,
  closeCallAttachmentMutations: 3,
  minRandomDistance: 6,

  gameStartingTime: 100,
  incorrectGuessPenalty:  -20,
  correctGuessBonus: 20,
}), hardDifficultyProgression);

export const levelContexts = {
  easy: easyLevelContext,
  medium: mediumLevelContext,
  hard: hardLevelContext,
};

export function levelContextFromConfig(config) {
  // NOTE: the level context and progression needs to match between both clients...
  // at the moment this is not sent over the wire!
  let levelContext = easyLevelContext;
  if (config.difficulty) {
    if (levelContexts[config.difficulty]) {
      levelContext = levelContexts[config.difficulty];
      if (config.log) debug("using difficulty: from query string: " + config.difficulty);
    } else {
      if (config.log) debug("Invalid query parameter for 'difficulty': " + config.difficulty + ", default to 'easy'");
    }
  } else {
    if (config.log)debug("using default easy difficulty: 'easy'");
  }
  return levelContext
}



function setColorsOnGeometry(geo, mat) {
  // setting geo.colors doesn't seem to transfer when converted to BufferGeometry
  // so set at the face level directly
  const hex = mat.color.getHex();
  for (let i=0 ; i < geo.faces.length; i++) {
    geo.faces[i].color.setHex(hex);
  }
  geo.colorsNeedUpdate = true;
}

export function ProceduralObject(options = {}) {
  parts.processLoadedGeometry();

  options.levelContext = options.levelContext || LevelContext();
  const ctx = options.levelContext;
  const difficulty = ctx.difficulty;
  options.description = options.description || ctx.randomObjectDescription();
  options.position = options.position || new Vector3(0,0,0);
  options.rotation = options.rotation || new Euler(0,0,0);
  options.name = options.name || "Object";

  const { description } = options;
  const base = difficulty.baseModels[description.baseIndex];
  const scaleFactor = 1.0;
  const root = new Object3D(); // this won't actually be added to the scene, just to setup the world matrix for everything
  const mergedGeo = new Geometry(); // merge all the parts together into this and then convert to BufferGeometry
  const baseColorIndex = description.colorIndex;
  const baseMesh = new Mesh(base.geometry, difficulty.baseColorPalettes[description.colorIndex].base);
  const rootBone = new Bone();
  rootBone.name = "Base Bone";
  rootBone.position.set(base.rootBonePivotPosition.x, base.rootBonePivotPosition.y, base.rootBonePivotPosition.z);
  const animBone = new Bone();
  animBone.name = "Animation Bone";
  rootBone.add ( animBone );
  const centerBone = new Bone();
  centerBone.name = "Center Bone";
  centerBone.position.set(-base.rootBonePivotPosition.x, -base.rootBonePivotPosition.y, -base.rootBonePivotPosition.z);
  const bones = [rootBone, animBone];

  setColorsOnGeometry(baseMesh.geometry, difficulty.baseColorPalettes[description.colorIndex].base);
  root.add(baseMesh);
  root.updateMatrixWorld(true); // force all children to update their matrices before merging
  mergedGeo.merge(baseMesh.geometry, baseMesh.matrixWorld);
  const boneWeights = new Vector4(1,0,0,0);
  for (let i=0; i < baseMesh.geometry.vertices.length; i++) {
    mergedGeo.skinIndices.push(new Vector4(1,0,0,0));
    mergedGeo.skinWeights.push(boneWeights);
  }

  const attachmentBonesBySlotType = {};
  const allAttachmentBonesButFace = [];
  const allAttachmentBones = [];
  const emissiveMeshes = [];
  let faceBone = null;


  for (let i=0; i < base.slots.length; i++) {
    const slot = base.slots[i];
    if (!description.attachments[slot.type])
      continue;

    const pos = slot.pos;
    const rot = slot.rot;
    const attachmentIndex = description.attachments[slot.type].attachmentIndex;
    const colorIndex = description.attachments[slot.type].colorIndex;
    const attachment = difficulty.attachmentsByType[slot.type][attachmentIndex];
    const mat = difficulty.baseColorPalettes[baseColorIndex].attachments[colorIndex];
    const geo = attachment.geometry;
    const mesh = new Mesh(geo, mat);
    setColorsOnGeometry(geo, mat); // set face colors based on the selected material
    if (attachment.offset) {
      mesh.position.set(attachment.offset.x, attachment.offset.y, attachment.offset.z);
    }
    // describes the attachment origin with an transform
    const location = new Object3D();
    const rotBone = new Bone();
    rotBone.name = parts.AttachmentTypeNames[slot.type] + " Rot Bone";
    rotBone.position.copy(pos);
    rotBone.position.sub(base.rootBonePivotPosition);
    rotBone.rotation.copy(rot);

    const slotBone = new Bone();
    slotBone.name = parts.AttachmentTypeNames[slot.type] + " Slot Bone";
    animBone.add(rotBone);
    rotBone.add(slotBone);
    bones.push(rotBone);
    bones.push(slotBone);
    const boneIndices = new Vector4(1 + i * 2 + 2, 0, 0, 0);
    for (let i=0; i < mesh.geometry.vertices.length; i++) {
      mergedGeo.skinIndices.push(boneIndices);
      mergedGeo.skinWeights.push(boneWeights);
    }
    attachmentBonesBySlotType[slot.type] = slotBone;
    allAttachmentBones.push(slotBone);
    if (slot.type !== parts.AttachmentType.face) {
      allAttachmentBonesButFace.push(slotBone);
    } else {
      faceBone = slotBone;
    }

    location.rotation.set(rot.x, rot.y, rot.z, rot.order);
    location.position.set(pos.x, pos.y, pos.z);
    location.scale.set(scaleFactor, scaleFactor, scaleFactor);
    location.add(mesh);
    root.add(location);
    root.updateMatrixWorld(true); // force all children to update their matrices
    mergedGeo.merge(mesh.geometry, mesh.matrixWorld);

    // emissive eyes support
    if (attachment.emissiveGeometry) {
      const emissiveMesh = new Mesh(attachment.emissiveGeometry, defaultEmissiveMat);
      emissiveMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      emissiveMesh.name = parts.AttachmentTypeNames[slot.type] + "Emissive Mesh";
      slotBone.add(emissiveMesh); // add directly to the bone
      emissiveMeshes.push(emissiveMesh);
    }
  }

  // add this last so it doesn't mess with bone indices anymore
  animBone.add(centerBone);
  bones.push(centerBone);

  // convert everything to a single buffered geometry object
  const geo = new BufferGeometry().fromGeometry(mergedGeo);
  //const entity = new SkinnedMesh(mergedGeo, robotSharedMaterial);
  const entity = new SkinnedMesh(geo, robotSharedMaterial, config.useSkinningVertexTexture);

  rootBone.updateMatrixWorld(true); // this has to be called or bone inverses will be wrong
  const skely = new Skeleton(bones);
  entity.bind(skely);
  entity.add(rootBone);

  entity.name = options.name;
  entity.userData.levelContext = ctx;
  entity.userData.sharedMaterial = robotSharedMaterial;
  entity.userData.portalShadowMaterial = robotSharedPortalMaterial.clone();
  entity.userData.emissiveMeshes = emissiveMeshes;
  entity.userData.selectable = true;
  entity.userData.animationBones = {rootBone: rootBone, animationBone: animBone, allAttachmentBones, attachmentBonesBySlotType, faceBone, allAttachmentBonesButFace, centerBone};
  entity.userData.description = description;
  entity.userData.isTarget = false;
  entity.position.set(options.position.x, options.position.y, options.position.z);
  entity.rotation.set(options.rotation.x, options.rotation.y, options.rotation.z);
  entity.castShadow = true;

  // lame selection support, have to do this after we have the entity
  for (let i=0; i < emissiveMeshes.length; i++) {
    emissiveMeshes[i].userData.selectable = true;
    emissiveMeshes[i].userData.selectableParent = entity;
  }

  return entity;
}

export function generateObjects(ctx, targetDescription = null) {
  ctx = ctx || LevelContext();
  targetDescription = targetDescription || ctx.randomObjectDescription();
  const descPool = ctx.generateDescriptionPool(targetDescription);
  const parent = new Object3D();
  parent.name = "Procedural Objects Parent";

  for (let i = 0; i < descPool.length; i++) {
    const desc = descPool[i];
    const po = ProceduralObject({
      levelContext: ctx,
      position: new Vector3(0, 0, 0),
      description: desc,
    });
    if (descriptionDistance(desc, targetDescription) === 0) {
      po.name = "[Target!]";
      po.userData.isTarget = true;
    } else {
      po.name = "Impostor";
    }
    parent.add(po);
  }
  return parent;
}


