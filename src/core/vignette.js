import { Geometry, BufferGeometry, Vector3, Face3, Mesh, ShaderMaterial, Color} from 'three';
import { WorldEvent, sharedUniforms } from './world';
import vertexShader from './shaders/vignette-vert.glsl';
import fragmentShader from './shaders/vignette-frag.glsl';

const vignetteUniforms = Object.assign({

  vignettePower:       { value: 3.0 },
  vignetteRadiusStart: { value: 1.0 },
  vignetteRadiusEnd:   { value: 1.5 },
  vignetteMax:         { value: 0.6 },
  vignetteColor:       { value: new Color(0x000000) },

}, sharedUniforms);

window.vignetteUniforms = vignetteUniforms;

export function createVignetteMesh(size=0.5) {
  const geometry = new Geometry();

  // build based on a 2x2 size quad centered around 0,0,0
  geometry.vertices.push(
    // upper left
    new Vector3(-1        , 1       , 0), // 0
    new Vector3(-1        , 1 - size, 0), // 1
    new Vector3(-1 + size , 1       , 0), // 2

    // lower left
    new Vector3(-1        ,-1       , 0), // 3
    new Vector3(-1  + size,-1       , 0), // 4
    new Vector3(-1        ,-1 + size, 0), // 5

    // upper right
    new Vector3( 1        , 1       , 0), // 6
    new Vector3( 1 - size , 1       , 0), // 7
    new Vector3( 1        , 1 - size, 0), // 8

    // lower right
    new Vector3( 1        ,-1       , 0), // 9
    new Vector3( 1        ,-1 + size, 0), // 10
    new Vector3( 1 - size ,-1       , 0)  // 11
  );

  geometry.faces.push(
    new Face3(0,  1,  2),
    new Face3(3,  4,  5),
    new Face3(6,  7,  8),
    new Face3(9, 10, 11)
  );

  const vignetteMaterial = new ShaderMaterial({
    fog: false,
    transparent: true,
    uniforms: vignetteUniforms,
    vertexShader,
    fragmentShader,
  });

  geometry.computeBoundingSphere();
  return new Mesh(new BufferGeometry().fromGeometry(geometry), vignetteMaterial); // new MeshBasicMaterial({color: 0xff0000}));
}

export function updateVignetteMesh(vignetteMesh, camera) {
  const distance = camera.near * 1.01;
  vignetteMesh.position.set(0,0, -distance);
  const halfFovRad = camera.fov * 0.5 * Math.PI / 180.0;
  const h = 2.0 * distance * Math.tan(halfFovRad);
  const w = h * camera.aspect;
  vignetteMesh.scale.set(w * 0.5, h * 0.5, 1); // the mesh is 2x2 not 1x1 so we need to scale by half the width/height
}

export function addVignetteMeshToCamera(camera, vignetteMesh=undefined) {
  vignetteMesh = vignetteMesh || createVignetteMesh();
  updateVignetteMesh(vignetteMesh, camera);

  if (camera.layers.mask > 1) {
    // ASSUME: this is a stereo camera since it has more than the 1 layer turned on
    vignetteMesh.layers.mask = camera.layers.mask;
    vignetteMesh.layers.disable(0); // don't render for the default camera only the stereo ones
  }

  camera.add(vignetteMesh);
  vignetteMesh.name = camera.name + " Vignette Mesh";
  return vignetteMesh;
}

export function addVignetteMeshToWorld(world, startUpdating=true) {

  const cameras = [world.camera];

  if (world.vrCameras) {
    cameras.push(world.vrCameras[0], world.vrCameras[1]);
  }

  const meshes = [];
  for (let i=0; i < cameras.length; i++) {
    const vMesh = addVignetteMeshToCamera(cameras[i]);
    meshes.push(vMesh);
  }

  const resize = () => {
    for (let i=0; i < meshes.length; i++) {
      updateVignetteMesh(meshes[i], cameras[i]);
    }
  };

  const start = () => world.addEventListener(WorldEvent.resize, resize);
  const stop = () => world.removeEventListener(resize);

  if (startUpdating) {
    start();
  }

  return {
    meshes: meshes,
    start: start,
    stop: stop,
  }
}

export function vignetteGui(vignetteMesh, gui) {
  const mat = vignetteMesh.material;
  const vFolder = gui.addFolder("Vignette");

  vFolder.add(mat.uniforms.vignettePower, "value").name("Power Factor");
  vFolder.add(mat.uniforms.vignetteRadiusStart, "value").name("Radius Start");
  vFolder.add(mat.uniforms.vignetteRadiusEnd, "value").name("Radius End");
  vFolder.add(mat.uniforms.vignetteMax, "value").name("Max Darkness");
  vFolder.addColor(mat.uniforms.vignetteColor, "value").name("Color");


}
