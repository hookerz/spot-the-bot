import { Object3D, Geometry, RingGeometry, BufferGeometry, CylinderBufferGeometry, CylinderGeometry, Mesh, MeshBasicMaterial, Vector3} from 'three';
import { Math as TMath} from 'three';

import { WorldEvent } from './world.js';
import vertexShader from './shaders/portal-shadow-vert.glsl';
import fragmentShader from './shaders/portal-shadow-frag.glsl';

export const backGroundRenderOrder = 1000;

function flipNormals(bufferedGeo) {
  let normals = bufferedGeo.attributes.normal.array;
  for (let i=0; i < normals.length; i++) {
    normals[i] = -normals[i];
  }
  bufferedGeo.attributes.normal.needsUpdate = true;
}

function flipFaces(bufferedGeo) {
  let indexArray = bufferedGeo.index.array;
  for (let i=0; i < indexArray.length / 3; i++) {
    //let a = i * 3;
    let b = i * 3 + 1;
    let c = i * 3 + 2;
    let temp = indexArray[b];
    indexArray[b] = indexArray[c];
    indexArray[c] = temp;
  }
}

export const portalRenderOrder = backGroundRenderOrder + 100;
export const objectRenderOrder = portalRenderOrder + 100;

export const originalObjects = [];
export const shadowObjects = [];
export const shadowMaterials = [];
export const portalObjects = [];
export const portalLocalToWorld = [];
export const portalWorldSpaceDirs = [];

// used to avoid allocations of Vector3 on updates
const portalPositions = [];
const shadowPositions = [];
const trackingShadows = {};

export function cleanUpShadowObjects() {
  for (let i=0; i < shadowObjects.length; i++) {
    // remove from the scene
    originalObjects[i].remove(shadowObjects[i]);
    shadowPositions[i].set(0,0,0);
  }
  originalObjects.length = 0;
  shadowObjects.length = 0;
  shadowMaterials.length = 0;
}

export function updatePortalPositionsCache() {
  for (let i=0; i < portalObjects.length; i++) {
    portalObjects[i].getWorldPosition(portalPositions[i]);
    portalLocalToWorld[i] = portalObjects[i].matrixWorld;
    let z = portalWorldSpaceDirs[i];
    z.set(0,0,-1);
    z.applyMatrix4(portalObjects[i].matrixWorld);
    z.subVectors(z, portalPositions[i]);
    z.normalize();
  }
}


function clamp(v, min=0.0, max=1.0) {
  if (v > max)
    return max;

  if (v < min)
    return min;

  return v;
}

// reuse to avoid allocations
let z = new Vector3(0, 0, 1);
const v = new Vector3(0, 0, 0);
const smallestPortalScale = 0.75;
const smallestObjectScale = 0.5;
const largestPortalScale = 1.0;
const portalMinDistanceSquared = 3.0;
const scaleBeforeOffset = 0.5;

function updateShadowMats() {
  // pre-allocate variables to avoid unnecessary local objects
  let pos = null;
  let mat = null;
  let shortestDist = 9999999999.0;
  let shortestIndex = -1;
  let dist = 9999999999.0;
  let scale = 0.0;
  let portalPos = null;
  let projectionScalar = 0.0;
  let originalObject = null;


  // first get the updated world positions of all the portal objects
  for (let i=0; i < originalObjects.length; i++) {
    originalObjects[i].getWorldPosition(shadowPositions[i]);
  }

  for (let i=0; i < portalObjects.length; i++) {
    //portalObjects[i].getWorldPosition(portalPositions[i]); // we using the caches version of this for now...
    portalObjects[i].scale.set(smallestPortalScale, smallestPortalScale, 1);
  }

  // TODO: replace this check with a version based on the current track instead of checking them all...
  for (let i=0; i < originalObjects.length; i++) {
    mat = shadowMaterials[i];
    pos = shadowPositions[i];
    originalObject = originalObjects[i];
    shortestDist = 9999999999.0;
    shortestIndex = -1;
    for (let i = 0; i < portalObjects.length; i++) {
      dist = portalPositions[i].distanceToSquared(pos);
      if (dist < shortestDist) {
        shortestDist = dist;
        shortestIndex = i;
      }
    }

    if (shortestDist > portalMinDistanceSquared) {
      // closest portal is too far away...
      mat.uniforms.on1.value = 0.0;
      originalObject.scale.set(1,1,1);
      originalObject.visible = true;
      originalObject.castShadow = true;

      if (originalObject.userData.sharedMaterial) {
        originalObject.material = originalObject.userData.sharedMaterial;
      }
      //shadowObjects[i].visible = false;
      continue;
    }

    if (originalObject.userData.portalShadowMaterial) {
      originalObject.material = originalObject.userData.portalShadowMaterial;
    }

    //shadowObjects[i].visible = true;
    portalPos = portalPositions[shortestIndex];
    // need to compute the distance past the portal entrance, but only along the local z-axis
    z = portalWorldSpaceDirs[shortestIndex];
    v.subVectors(pos, portalPos); // point from portal pos to shadow object position, un-normalized
    projectionScalar = v.dot(z) / z.length(); // length of the projected vector onto the portal world space dir (doing dot first to avoid allocation)
    // projectionScalar is a negative distance when the object is in front of the portal, 0 if its at the portal, and positive if its in the portal
    originalObject.visible = projectionScalar < 1.0; // object it no longer visible once its more than 1 unit deep into the portal to hide pop-ing when jumping splines
    mat.uniforms.portalPosition1.value = portalPos;
    mat.uniforms.portalWorldSpaceDir1.value = z;

    // for the portal we want to scale up if something is approaching and scale down if they going away
    scale = 1.0 - clamp(Math.abs(projectionScalar*0.2), 0, 1.0);
    scale = TMath.smootherstep(scale, smallestPortalScale, 1.0);
    scale = TMath.mapLinear(scale, 0, 1, smallestPortalScale, 1.0);
    if (portalObjects[shortestIndex].scale.x < scale) {
      portalObjects[shortestIndex].scale.set(scale, scale, 1.0);
    }

    originalObject.castShadow = projectionScalar < 0.0;

    // compute object scaling so the objects scales down as it approaches the portal
    scale = 1.0 - clamp(projectionScalar * 0.5 + scaleBeforeOffset, 0, 1.0);
    scale = TMath.smootherstep(scale, smallestObjectScale, 1.0);
    scale = TMath.mapLinear(scale, 0, 1, smallestObjectScale, 1.0);
    originalObject.scale.set(scale, scale, scale);
    mat.uniforms.on1.value = 1.0;
  }
}

export function setupTrackStaticPortalShadowUniforms(object3D, p1, p2)
{
  const shadowMat = object3D.material;
  object3D.renderOrder = objectRenderOrder;

  // assume a single statically assigned portal
  // assumes portalPositions and portalWorldSpaceDirs are already calculated and up to date
  const portalIndex1 = p1.userData.portalIndex;
  const portalIndex2 = p2.userData.portalIndex;
  const portalPos1 = portalPositions[portalIndex1];
  const portalPos2 = portalPositions[portalIndex2];
  const z1 = portalWorldSpaceDirs[portalIndex1];
  const z2 = portalWorldSpaceDirs[portalIndex2];
  shadowMat.uniforms.portalPosition1.value = portalPos1;
  shadowMat.uniforms.portalWorldSpaceDir1.value = z1;
  shadowMat.uniforms.portalPosition2.value = portalPos2;
  shadowMat.uniforms.portalWorldSpaceDir2.value = z2;
  shadowMat.uniforms.on1.value = 1.0;
  shadowMat.uniforms.on2.value = 1.0;
  shadowMat.defines.CHECK_TWO_PORTALS = true;
}

export function setupStaticPortalShadowUniforms(object3D, staticPortal)
{
  const shadowMat = object3D.material;
  object3D.renderOrder = objectRenderOrder;

  // assume a single statically assigned portal
  // assumes portalPositions and portalWorldSpaceDirs are already calculated and up to date
  const portalIndex = staticPortal.userData.portalIndex;
  const portalPos = portalPositions[portalIndex];
  const z = portalWorldSpaceDirs[portalIndex];
  shadowMat.uniforms.portalPosition1.value = portalPos;
  shadowMat.uniforms.portalWorldSpaceDir1.value = z;
  shadowMat.uniforms.on1.value = 1.0;
}

export function ShadowObject(world, object3D) {
  const shadowMat = object3D.userData.portalShadowMaterial || object3D.material; // TODO: check if the material has the required uniforms...

  // setup the render order so the shadows work
  object3D.renderOrder = objectRenderOrder;
  if (object3D.userData.emissiveMeshes) {
    for (let i=0; i < object3D.userData.emissiveMeshes.length; i++) {
      object3D.userData.emissiveMeshes[i].renderOrder = objectRenderOrder;
    }
  }

  originalObjects.push(object3D);
  shadowMaterials.push(shadowMat);
  shadowPositions.push(new Vector3());

  if (!trackingShadows[world]) {
    trackingShadows[world] = true;
    world.addEventListener(WorldEvent.update, updateShadowMats);
  }
}

export function pausePortalShadowUpdating(world) {
  delete trackingShadows[world];
  world.removeEventListener(WorldEvent.update, updateShadowMats);
}

export function resumePortalShadowUpdating(world) {
  trackingShadows[world] = true;
  world.addEventListener(WorldEvent.update, updateShadowMats);
}
const blackMat = new MeshBasicMaterial({
  color: 0x000000,
  //polygonOffset: true,
  //polygonOffsetFactor: 0.02,
  //polygonOffsetUnits: 0.1,
});
const blockerMat = new MeshBasicMaterial({
  color: 0xFF0000,
  colorWrite: false, // write to z-buffer, but not to the color buffer (i.e. invisible object)
  polygonOffset: true,
  polygonOffsetFactor: -2.0, // this has to be stupid high to avoid artifacts on IOS
  polygonOffsetUnits: -1.0,
});

// DEBUG
window.blackMat = blackMat;
window.blockerMat = blockerMat;

export function PortalObject(options) {

  options = Object.assign({
    depth: 2.0,
    offset: 0.3,
    cylinderSegments: 32,
    radius: 1.0,
    centerHeight: 0.0,
  }, options);

  let blockerMergedGeo = new Geometry();
  let blackMergedGeo = new Geometry();
  let blackMerged2Geo = new Geometry();

  // assume the object will approaching from +Z go in through to -Z
  let portal = new Object3D();
  portal.name = "Portal";
  portal.renderOrder = portalRenderOrder;

  let backSideRingGeo = new RingGeometry(0.000000001, options.radius, options.cylinderSegments, 1);
  let backSideRingMesh = new Mesh(backSideRingGeo, blackMat);
  backSideRingMesh.name = "Black Portal Back Side";
  backSideRingMesh.rotation.set(0, Math.PI, 0);
  backSideRingMesh.renderOrder = portalRenderOrder - 1;

  let blockerGeo = new CylinderGeometry(options.radius + options.offset, options.radius + options.offset, options.depth + options.offset * 2.0, options.cylinderSegments, 1, true);
  let blockerMesh = new Mesh(blockerGeo, blockerMat);
  blockerMesh.name = "Blocker Cylinder";
  blockerMesh.rotation.set(Math.PI * 0.5, 0, 0);
  blockerMesh.position.set(0,0,-options.depth * 0.5 - options.offset);
  blockerMesh.renderOrder = portalRenderOrder;

  let blockerFrontGeo = new RingGeometry(options.radius, options.radius + options.offset, options.cylinderSegments, 1);
  let blockerFrontMesh = new Mesh(blockerFrontGeo, blockerMat);
  blockerFrontMesh.name = "Blocker Front Cap";
  blockerFrontMesh.renderOrder = portalRenderOrder;


  let ringGeo = new RingGeometry(0.000000001, options.radius + options.offset, options.cylinderSegments, 1);
  let blockerRingMesh = new Mesh(ringGeo, blockerMat);
  blockerRingMesh.name = "Blocker Cylinder End Cap";
  blockerRingMesh.rotation.set(Math.PI, 0, 0);
  blockerRingMesh.position.set(0,0,-options.depth - options.offset);
  blockerRingMesh.renderOrder = portalRenderOrder;

  let geo = new CylinderBufferGeometry(options.radius, options.radius, options.depth, options.cylinderSegments, 1, true);
  flipNormals(geo);
  flipFaces(geo);
  geo = new Geometry().fromBufferGeometry(geo);
  let cylinderMesh = new Mesh(geo, blackMat);
  cylinderMesh.name = "Inner Black Cylinder";
  cylinderMesh.rotation.set(Math.PI * 0.5, 0, 0);
  cylinderMesh.position.set(0,0,-options.depth * 0.5);
  cylinderMesh.renderOrder = portalRenderOrder + 1;

  let smallerRingGeo = new RingGeometry(0.000000001, options.radius, options.cylinderSegments, 1);
  let blackRingMesh = new Mesh(smallerRingGeo, blackMat);
  blackRingMesh.name = "Inner Black Cylinder End Cap";
  blackRingMesh.position.set(0,0,-options.depth * 0.5);
  blackRingMesh.renderOrder = portalRenderOrder + 1;

  portal.add(backSideRingMesh, cylinderMesh, blackRingMesh, blockerMesh, blockerRingMesh);
  //portal.add(cylinderMesh, blackRingMesh, blockerMesh, blockerRingMesh);
  portal.position.set(0.0, -options.centerHeight, 0.0);
  // update the world matrices so when we mergeGeo every is relative to the portal offset
  portal.updateMatrixWorld(true);

  // now merge geometry (render order means we can't combine all black geo... ugh
  blackMergedGeo.merge(cylinderMesh.geometry, cylinderMesh.matrixWorld);
  //blackMergedGeo.merge(blackRingMesh.geometry, blackRingMesh.matrixWorld);

  blackMerged2Geo.merge(backSideRingMesh.geometry, backSideRingMesh.matrixWorld);

  blockerMergedGeo.merge(blockerMesh.geometry, blockerMesh.matrixWorld);
  blockerMergedGeo.merge(blockerRingMesh.geometry, blockerRingMesh.matrixWorld);
  blockerMergedGeo.merge(blockerFrontMesh.geometry, blockerFrontMesh.matrixWorld);

  const blackMeshPlus1 = new Mesh(new BufferGeometry().fromGeometry(blackMergedGeo), blackMat);
  blackMeshPlus1.renderOrder = portalRenderOrder + 1;
  blackMeshPlus1.name = "Black Inner Mesh";
  //const blackMeshMinus1 = new Mesh(new BufferGeometry().fromGeometry(blackMerged2Geo), blackMat);
  const blackMeshMinus1 = new Mesh(blackMerged2Geo, blackMat);
  blackMeshMinus1.renderOrder = portalRenderOrder - 1;
  blackMeshMinus1.name = "Black Outer Cap";
  const blockerBufferMesh = new Mesh(new BufferGeometry().fromGeometry(blockerMergedGeo), blockerMat);
  blockerBufferMesh.renderOrder = portalRenderOrder;
  blockerBufferMesh.name = "Blocker Mesh";

  // recreate portal and use the merged geometry this time
  portal = new Object3D();
  portal.name = "Portal";
  portal.renderOrder = portalRenderOrder;
  //portal.add(blackMeshMinus1, blockerBufferMesh, blackMeshPlus1);
  portal.add(blockerBufferMesh, blackMeshPlus1);


  portalObjects.push(portal);
  let v = new Vector3();
  // assume the portal doesn't move so cache its position and world matrix
  // call updatePortalPositionsCache() if the positions change
  portal.getWorldPosition(v);
  portalPositions.push(v);
  portal.updateMatrixWorld(true);
  portalLocalToWorld.push(portal.matrixWorld);
  portalWorldSpaceDirs.push(new Vector3(0, 0, -1)); // this wrong until the cache is updated
  portal.userData.portalIndex = portalPositions.length-1;

  return portal;
}

function portalFromPoints(p1, p2, options) {
  const portal = PortalObject(options);
  portal.position.set(p1.x, p1.y, p1.z);
  portal.lookAt(p2);
  return portal;
}

export function portalsFromSplines(splines, radius=1.0, depth=3.0, centerHeight=0.0, startAmount=1.2, forwardAmount=1.3) {
  const portalMaster = new Object3D();
  portalMaster.name = "Portal Master";

  const portalOptions = {depth, radius, centerHeight};

  const portalsBySpline = [];
  for (let i=0; i < splines.length; i++) {
    const s = splines[i];
    const len = s.getLength();
    const startU = startAmount / len;
    const forwardU = forwardAmount / len;
    const p1 = portalFromPoints(s.getPointAt(startU), s.getPointAt(forwardU), portalOptions);
    const p2 = portalFromPoints(s.getPointAt(1-startU), s.getPointAt(1-forwardU), portalOptions);
    portalMaster.add(p1);
    portalMaster.add(p2);
    portalsBySpline.push([p1, p2]);
  }
  portalMaster.position.set(0, centerHeight, 0);
  portalMaster.updateMatrixWorld(true); // force update the portal world positions so we can cache them
  updatePortalPositionsCache();

  portalMaster.userData.portalsBySpline = portalsBySpline;
  return portalMaster;
}

