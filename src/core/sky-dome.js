import { Object3D,  SphereBufferGeometry, PlaneBufferGeometry, Mesh, MeshBasicMaterial, ShaderMaterial, Color, BackSide, HemisphereLight, FogExp2, CubeCamera} from 'three';
import { sharedUniforms } from './world';
import { MeshShadowNoLightMaterial } from './materials/ground-plane-material';
import vertexShader from './shaders/sky-dome-vert.glsl';
import fragmentShader from './shaders/sky-dome-frag.glsl';

export const skyDomeDefines = {
  COLORS_ARE_LINEAR: false,
  DITHER: false,
};

export const skyDomeUniforms = Object.assign({
  skyColor: { value: new Color(0x0077ff) },
  horizonColor: { value: new Color(0x00ffff) },
  gradientPower: { value: 0.6 },
  blendHeight: { value: 0.8 },
}, sharedUniforms);

export function SkyDome(radius=100, height=-3.5, skyColor, horizonColor, groundColor, groundColorFar) {

  skyColor = skyColor || 0x429cf0;
  horizonColor = horizonColor || 0x98ffff;
  groundColor = groundColor || 0xe6f6fc;
  groundColorFar = groundColorFar || 0xe1f9ff;

  skyDomeUniforms.skyColor.value.setHex(skyColor);
  skyDomeUniforms.horizonColor.value.setHex(horizonColor);

  const dome = new Object3D();
  dome.name = "Sky Dome";
  dome.position.set(0, height, 0);

  const skyMat = new ShaderMaterial({
    side: BackSide,
    fog: false,
    defines: skyDomeDefines,
    uniforms: skyDomeUniforms,
    vertexShader,
    fragmentShader,
  });

  const sphere = new Mesh(new SphereBufferGeometry(radius, 5, 5, 0, Math.PI * 2.0, 0, Math.PI/2), skyMat);
  sphere.name = "Dome Sphere";
  sphere.renderOrder = 1;
  dome.add(sphere);

  // custom lambert derived shader that doesn't do lighting and just takes a solid color
  const groundPlaneMat = new MeshShadowNoLightMaterial({color: groundColor, fog: true, lights: true});
  // these are some pretty specific default values...
  // this shader also does lighter shadows controlled by the uniform parameter 'shadowMaskMin' which 0 dark shadows, 1 no shadows
  groundPlaneMat.uniforms.shadowMaskMin.value = 0.8; // never lets the shadows darken more than 0.8 * color
  groundPlaneMat.uniforms.farPower.value = 0.8;
  groundPlaneMat.uniforms.farDistance.value = radius;
  groundPlaneMat.uniforms.farColor.value.setHex(groundColorFar);
  groundPlaneMat.uniforms.uvScale = {value: 0.25};
  skyDomeUniforms.blendHeight.value = 0.3;
  skyDomeUniforms.gradientPower.value = 0.81;

  const plane = new Mesh(new PlaneBufferGeometry(200, 200 , 1, 1), groundPlaneMat);
  plane.name = "Ground Plane";
  plane.rotation.set(-Math.PI*0.5,0,0);
  plane.receiveShadow = true;
  plane.renderOrder = 1;
  dome.add(plane);

  dome.userData.setBakedShadowMap = function (map) { groundPlaneMat.map = map };
  dome.userData.skyMat = skyMat;
  dome.userData.groundPlaneMat = groundPlaneMat;
  dome.userData.skyDomeUniforms = skyDomeUniforms;
  dome.userData.skyDomeDefines = skyDomeDefines;
  dome.userData.groundPlaneMat = groundPlaneMat;

  // DEBUG:
  window.skyDome = dome;
  window.skyDomeUniforms = skyDomeUniforms;
  window.skyDomeDefines = skyDomeDefines;
  window.groundPlaneMat = groundPlaneMat;
  window.skyDomeColors = { skyColor: skyDomeUniforms.skyColor.value, horizonColor: skyDomeUniforms.horizonColor.value, groundColor: groundPlaneMat.color, groundColorFar: groundPlaneMat.uniforms.farColor.value };

  return dome;
}

export function mult(array, scalar) {
  const res = [];
  for (let i=0; i < array.length; i++) {
    res.push(array[i] * scalar);
  }
  return res;
}


// builds a sky dome and ground plane system with fog and a matching hemisphere light
export function addSkyEnvironment(scene, options) {

  // defaults for the options...
  options = Object.assign({
    skyDome: null,
    hemisphereLight: null,
    fog: null,
    hemisphereLightIntensity: 0.5,
    skyColor: 0xf2e7ff,
    horizonColor: 0xEFC5EC,
    groundColorFar: 0xAFB4E0,
    groundColor: 0xCAD7EA,
    radius: 100,
    height: -3.5,
    fogDensity: 0.0125,
  }, options);

  let { skyDome, hemisphereLight, fog } = options;
  const { skyColor, horizonColor, groundColorFar, groundColor, radius, height, fogDensity, hemisphereLightIntensity} = options;

  if (!skyDome) {
    skyDome = SkyDome(radius, height, skyColor, horizonColor, groundColor, groundColorFar);
    scene.add(skyDome);
  }

  if (!hemisphereLight) {
    hemisphereLight = new HemisphereLight(skyColor, groundColor, hemisphereLightIntensity);
    hemisphereLight.name = "Sky Dome Hemisphere Light";
    skyDome.add(hemisphereLight);
  } else {
    hemisphereLight.color.setHex(skyColor);
    hemisphereLight.groundColor.setHex(groundColor);
    hemisphereLight.intensity = hemisphereLightIntensity;
  }

  if (!fog) {
    if (!scene.fog) {
      scene.fog = new FogExp2(horizonColor, fogDensity);
    } else {
      scene.fog.color.setHex(horizonColor);
    }
    fog = scene.fog;
  }

  // HACK: this is a really lame extraction and uses information from SkyDome about insertion order.. , consider returning more from SkyDome
  const skyDomeMesh = skyDome.children[0];
  const skyDomeMat = skyDomeMesh.material;
  const groundPlaneMesh = skyDome.children[1];
  const groundPlaneMat = groundPlaneMesh.material;

  skyDomeMat.uniforms.blendHeight.value = 0.15;

  function multiColorPropertyWrapper(colors) {
    return {
      get: () => mult(colors[0].toArray(), 255),
      set: (value) => {
        // some times value is not an Array for some reason... need to support it being a hex string
        if (Array.isArray(value)) {
          const a = mult(value, 1.0 / 255.0);
          for (let i = 0; i < colors.length; i++) {
            colors[i].fromArray(a);
          }
        } else {
          for (let i = 0; i < colors.length; i++) {
            colors[i].set(value);
          }
        }
      }
    }
  }

  const env = Object.create(Object.prototype, {
    skyDomeMesh:         {value: skyDomeMesh    , writable: false},
    skyDomeMat:          {value: skyDomeMat     , writable: false},
    skyDomeUniforms:     {value: skyDomeUniforms, writable: false},
    groundPlaneMesh:     {value: groundPlaneMesh, writable: false},
    groundPlaneMat:      {value: groundPlaneMat , writable: false},
    groundPlaneUniforms: {value: skyDomeUniforms, writable: false},
    fog:                 {value: fog            , writable: false},
    hemisphereLight:     {value: hemisphereLight, writable: false},

    skyColor: {
      get: () => skyDomeMat.uniforms.skyColor.value,
      set: (value) => {
        skyDomeMat.uniforms.skyColor.value.copy(value);
        hemisphereLight.color.copy(value);
      }
    },
    horizonColor: {
      get: () => skyDomeMat.uniforms.horizonColor.value,
      set: (value) => {
        skyDomeMat.uniforms.horizonColor.value.copy(value);
        fog.color.copy(value);
      },
    },
    groundColor: {
      get: () => groundPlaneMat.color,
      set: (value) => {
        groundPlaneMat.color.copy(value);
        hemisphereLight.groundColor.copy(value);
      },
    },
    groundColorFar: {
      get: () => groundPlaneMat.uniforms.farColor.value,
      set: (value) => groundPlaneMat.uniforms.farColor.value.copy(value),
    },
    // wraps access as a rgb255 array for datGUI while applying to multiple objects at the same time
    skyColorRGB:       multiColorPropertyWrapper([skyDomeMat.uniforms.skyColor.value, hemisphereLight.color]),
    horizonColorRGB:   multiColorPropertyWrapper([skyDomeMat.uniforms.horizonColor.value, fog.color]),
    groundColorRGB:    multiColorPropertyWrapper([groundPlaneMat.color, hemisphereLight.groundColor]),
    groundColorFarRGB: multiColorPropertyWrapper([groundPlaneMat.uniforms.farColor.value]),
  });

  return env;
}

export function buildEnvGui(env, gui) {
  const colorsFolder = gui.addFolder("Env Colors");
  colorsFolder.addColor(env, 'skyColorRGB').name("Sky Color");
  colorsFolder.addColor(env, 'horizonColorRGB').name("Horizon Color");
  colorsFolder.addColor(env, 'groundColorFarRGB').name("Ground Color Far");
  colorsFolder.addColor(env, 'groundColorRGB').name("Ground Color");
  colorsFolder.open();

  const skyFolder = gui.addFolder("Sky Dome Shader");
  skyFolder.add(env.skyDomeMat.uniforms.blendHeight, 'value').name("Blend Height");
  skyFolder.add(env.skyDomeMat.uniforms.gradientPower, 'value').name("Gradient Power");

  const groundFolder = gui.addFolder("Ground Shader");
  groundFolder.add(env.groundPlaneMat.uniforms.shadowMaskMin, "value").name("Shadow Darkness");
  groundFolder.add(env.groundPlaneMat.uniforms.farPower, "value").name("Far Color Power");
  groundFolder.add(env.groundPlaneMat.uniforms.farDistance, "value").name("Far Color Distance");
  groundFolder.add(env.fog, "density").name("Fog Density (Ground Only)");
}

export function addEnvMapCamera(world, updateNow=true, showTestObject=false) {
  const cubeCamera = new CubeCamera(1, 1000, 256);
  cubeCamera.name = "Environment Map Camera";
  cubeCamera.renderTarget.texture.minFilter = LinearMipMapLinearFilter;
  // by rendering here we are explicitly excluding the track... might change this later...
  if (updateNow)
    cubeCamera.updateCubeMap(world.renderer, world.scene);

  world.scene.add(cubeCamera);

  if (showTestObject) {
    const material = new MeshBasicMaterial( {
      envMap: cubeCamera.renderTarget.texture
    });
    const geometry = new SphereBufferGeometry( 1, 32, 32 );
    const sphere = new Mesh( geometry, material );
    sphere.name = "Cubemap Sphere";
    sphere.position.set(0, 0, -5);
    world.scene.add( sphere );
  }

  return cubeCamera
}
