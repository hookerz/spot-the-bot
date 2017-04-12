import { Geometry, Mesh, TubeGeometry, Math as TMath, Vector4, Plane, Vector3, MeshBasicMaterial, Matrix4, BufferGeometry} from 'three';
import { ShadowMesh } from '../util/three-ext/shadow-mesh';
import { SubCurve } from './track-geometry';

export const shadowMeshes = [];
export const shadowMeshLightPosition4D = new Vector4(0, 10, 0, 0.01);
export const shadowMeshPlane = new Plane(new Vector3(0, 1, 0), -3.49);
export const shadowMeshMaterial = new MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.2,
  depthWrite: false,
  fog: false,
});

export function updateShadowMeshesShadows() {
  for (let i=0; i < shadowMeshes.length; i++) {
    shadowMeshes[i].update(shadowMeshPlane, shadowMeshLightPosition4D);
  }
}

// DEBUG...
window.shadowMeshes = shadowMeshes;
window.shadowMeshPlane = shadowMeshPlane;
window.shadowMeshLightPosition4D = shadowMeshLightPosition4D;
window.shadowMeshMaterial = shadowMeshMaterial;


export function createMergedTrackGeometry(splines, splinePortals, meshOverrides, tubeRadius=0.05, radialSegments=4, trackPoints=150, shadowStartAmount=1.1) {
  const identity = new Matrix4();
  const trackMergedGeo = new Geometry();

  for (let i=0; i < splines.length; i++) {
    if (meshOverrides[i] !== null) {
      // this is a lame workaround because BufferedGeomtery.merge doesn't work correctly, so we have to use Geometry to merge
      // even though we are converting back to buffered geometry in the end...
      let geo = new Geometry().fromBufferGeometry(meshOverrides[i].geometry);
      geo.mergeVertices();
      trackMergedGeo.merge(geo, identity);
      continue;
    }

    const len = splines[i].getLength();
    // need a tube segment that matches where the portals start...
    const startU = shadowStartAmount / len;
    const endU = 1.0 - startU;
    const startT = splines[i].getUtoTmapping(startU);
    const endT = splines[i].getUtoTmapping(endU);
    const c = new SubCurve(splines[i],   startT, endT);
    // Can't use buffer geo here otherwise the merge fails
    const g = new TubeGeometry(c, trackPoints, tubeRadius, radialSegments, false);
    //const g = new TubeBufferGeometry(c, trackPoints, tubeRadius, radialSegments, false);
    // merge all track parts into a single mesh so we can have a single shadow mesh...
    trackMergedGeo.merge(g, identity); // everything is 0,0,0 so the matrix doesn't mater here..

    // add static portal geo for now all as part of this single merged mesh
    for (let j=0; j < 2; j++) {
      const p = splinePortals[i][j];
      const backPanelCap = p.children[0]; // this is pretty dependent on the order the portal added its children...
      trackMergedGeo.merge(backPanelCap.geometry, backPanelCap.matrixWorld);
      // now flip along the local y-axis 180 degs so the back side will also get rendered in the shadow map
      const matrixWorld = backPanelCap.matrixWorld.clone();
      matrixWorld.multiply(new Matrix4().makeRotationY(Math.PI));
      trackMergedGeo.merge(backPanelCap.geometry, matrixWorld);
    }
  }
  return new BufferGeometry().fromGeometry(trackMergedGeo);
}

export function setupShadowMesh(mesh) {
  const mat = new MeshBasicMaterial({
    color: 0xFF0000, // for testing
    depthWrite: false,
    colorWrite: false,
    side: DoubleSide,
  });
  mesh.castShadow = true;
  return mesh;
}


export function createShadowMapCasterMesh(splines, splinePortals, meshOverrides, tubeRadius=0.05, radialSegments=3, trackPoints=100, shadowStartAmount=1.1) {
  const geo = createMergedTrackGeometry(splines, splinePortals, meshOverrides, tubeRadius, radialSegments, trackPoints, shadowStartAmount);
  const mat = new MeshBasicMaterial({
    color: 0xFF0000, // for testing
    depthWrite: false,
    colorWrite: false,
    side: DoubleSide,
  });

  const mesh = new Mesh(geo, mat);
  mesh.name = "Track Shadow Map caster mesh";
  mesh.castShadow = true;
  return mesh;
}


export function createTrackShadowMesh(splines, splinePortals, tubeRadius=0.05, radialSegments=4, trackPoints=150, shadowStartAmount=1.1) {

  const trackMergedGeo = createMergedTrackGeometry(splines, splinePortals, tubeRadius, radialSegments, trackPoints, shadowStartAmount);
  const trackMergedMesh = new Mesh(trackMergedGeo, shadowMeshMaterial); // material does't matter always invisble
  trackMergedMesh.name = "Track Shadow Geometry (Hidden)";
  trackMergedMesh.visible = false;

  const shadowMesh = new ShadowMesh(trackMergedMesh, shadowMeshMaterial);
  shadowMesh.name = "Track Shadow Mesh";
  // track is static so just update once now...
  shadowMesh.update(shadowMeshPlane, shadowMeshLightPosition4D);
  return shadowMesh;
}

export function addShadowMesh(mesh) {
  // use shared material and keep track of the mesh for updating
  const shadowMesh = new ShadowMesh(mesh, shadowMeshMaterial);
  shadowMesh.name = mesh.name + " Shadow Mesh";
  shadowMeshes.push(shadowMesh);
  return shadowMesh;
}

export function cleanUpShadowMeshObjects() {
  for (let i=0; i < shadowMeshes.length; i++) {
    // remove from the scene
    shadowMeshes[i].parent.remove(shadowMeshes[i]);
    shadowMeshes[i].material = null; // drop shared material reference
  }
  shadowMeshes.length = 0; // drop all references
}

