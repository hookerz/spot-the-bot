import { MeshLambertMaterial, UniformsUtils, ShaderLib, Color} from 'three';
import vertexShader from '../shaders/ground-plane-vert.glsl';
import fragmentShader from '../shaders/ground-plane-frag.glsl';


export const meshShadowNoLightMaterialUniforms = {
  shadowMaskMin: { value: 0.8 },
  farColor: {value: new Color(0xFF0000)},
  farPower: {value: 0.6},
  farDistance: {value: 100},
};

export function MeshShadowNoLightMaterial (parameters) {

  MeshLambertMaterial.call( this );
  this.uniforms = UniformsUtils.merge([
    ShaderLib.lambert.uniforms,
    meshShadowNoLightMaterialUniforms,
  ]);
  setFlags(this);
  this.setValues(parameters);
}

MeshShadowNoLightMaterial.prototype = Object.create( MeshLambertMaterial.prototype );
MeshShadowNoLightMaterial.prototype.constructor = MeshShadowNoLightMaterial;
MeshShadowNoLightMaterial.prototype.isMeshLambertMaterial = true;

MeshShadowNoLightMaterial.prototype.copy = function ( source ) {
  MeshLambertMaterial.prototype.copy.call( this, source );
  this.uniforms = UniformsUtils.clone(source.uniforms);
  setFlags(this);
  return this;
};

function setFlags (material) {

  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;
  material.type = 'MeshCustomMaterial';
}
