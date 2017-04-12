import { MeshStandardMaterial, MeshLambertMaterial, MeshPhongMaterial, UniformsUtils, ShaderLib, ShaderChunk, Vector3} from 'three';
import vertexShaderStandard from '../shaders/portal-shadow-standard-vert.glsl';
import fragmentShaderStandard from '../shaders/portal-shadow-standard-frag.glsl';
import vertexShaderLambert from '../shaders/portal-shadow-lambert-vert.glsl';
import fragmentShaderLambert from '../shaders/portal-shadow-lambert-frag.glsl';
import vertexShaderPhong from '../shaders/portal-shadow-phong-vert.glsl';
import fragmentShaderPhong from '../shaders/portal-shadow-phong-frag.glsl';

// put the shader changes into chunks so we apply the same chunks to both lambert and standard materials...

const portalUniforms = {
  portalPosition1: {type: "v3", value: new Vector3()},
  portalPosition2: {type: "v3", value: new Vector3()},
  portalWorldSpaceDir1: {type: "v3", value: new Vector3()},
  portalWorldSpaceDir2: {type: "v3", value: new Vector3()},
  on1: {value: 0.0},
  on2: {value: 0.0},
  offset: {value: 0.5},
  power: {value: 2.0},
};

ShaderChunk.portal_shadow_pars_vertex = `varying vec4 worldPosition;`;
ShaderChunk.portal_shadow_vertex = `
// replace worldpos_vertex.glsl so we store worldPosition into a uniform
  #if defined( USE_ENVMAP ) || defined( PHONG ) || defined( PHYSICAL ) || defined( LAMBERT ) || defined ( USE_SHADOWMAP )
    #ifdef USE_SKINNING
      worldPosition = modelMatrix * skinned;
    #else
      worldPosition = modelMatrix * vec4( transformed, 1.0 );
    #endif
  #endif
`;

ShaderChunk.portal_shadow_pars_frag = `
uniform vec3 portalPosition1;
uniform vec3 portalPosition2;
uniform vec3 portalWorldSpaceDir1;
uniform vec3 portalWorldSpaceDir2;
uniform float power;
uniform float offset;
uniform float on1;
uniform float on2;
varying vec4 worldPosition;

float projectScalar(vec3 a, vec3 b) {
    vec3 bn = b / length(b);
    return dot(a, bn);
}
`;

ShaderChunk.portal_shadow_frag = `
  // turn off by distance here
  vec3 diff1 = worldPosition.xyz - portalPosition1;
  float distCutOff1 = 1.0 - step(3.0, length(diff1));
  float darkness1 = 1.0 - on1 * distCutOff1 * pow(saturate(projectScalar(diff1, portalWorldSpaceDir1) + offset), power);
  
  #ifdef CHECK_TWO_PORTALS
    vec3 diff2 = worldPosition.xyz - portalPosition2;
    float distCutOff2 = 1.0 - step(3.0, length(diff2));
    float darkness2 = 1.0 - on2 * distCutOff2 * pow(saturate(projectScalar(diff2, portalWorldSpaceDir2) + offset), power);
    darkness1 *= darkness2;
  #endif
  outgoingLight = outgoingLight * darkness1;
`;

export function MeshPortalShadowStandardMaterial (parameters) {

  this.checkTwoPortals = false;
  if (parameters && parameters.checkTwoPortals && parameters.checkTwoPortals === true)
    this.checkTwoPortals = true;

  MeshStandardMaterial.call( this );
  this.uniforms = UniformsUtils.merge([ShaderLib.standard.uniforms, portalUniforms]);
  if (this.checkTwoPortals)
    this.defines = {CHECK_TWO_PORTALS : true};
  setFlags(this);
  this.setValues(parameters);
}

MeshPortalShadowStandardMaterial.prototype = Object.create( MeshStandardMaterial.prototype );
MeshPortalShadowStandardMaterial.prototype.constructor = MeshPortalShadowStandardMaterial;
MeshPortalShadowStandardMaterial.prototype.isMeshStandardMaterial = true;

MeshPortalShadowStandardMaterial.prototype.copy = function ( source ) {
  MeshStandardMaterial.prototype.copy.call( this, source );
  this.uniforms = UniformsUtils.clone(source.uniforms);
  if (source.defines && source.defines.CHECK_TWO_PORTALS)
    this.defines = {CHECK_TWO_PORTALS: true};
  setFlags(this);
  return this;
};

function setFlags(material) {

  material.vertexShader = vertexShaderStandard;
  material.fragmentShader = fragmentShaderStandard;
  material.type = 'MeshCustomMaterial';
}


export function MeshPortalShadowLambertMaterial (parameters) {

  this.checkTwoPortals = false;
  if (parameters && parameters.checkTwoPortals && parameters.checkTwoPortals === true)
    this.checkTwoPortals = true;

  MeshLambertMaterial.call( this );
  this.uniforms = UniformsUtils.merge([ShaderLib.lambert.uniforms, portalUniforms]);
  if (this.checkTwoPortals)
    this.defines = {CHECK_TWO_PORTALS : true};
  setFlagsLambert(this);
  this.setValues(parameters);
}

MeshPortalShadowLambertMaterial.prototype = Object.create( MeshLambertMaterial.prototype );
MeshPortalShadowLambertMaterial.prototype.constructor = MeshPortalShadowLambertMaterial;
MeshPortalShadowLambertMaterial.prototype.isMeshLambertMaterial  = true;

MeshPortalShadowLambertMaterial.prototype.copy = function ( source ) {
  MeshLambertMaterial.prototype.copy.call( this, source );
  this.uniforms = UniformsUtils.clone(source.uniforms);
  if (source.defines && source.defines.CHECK_TWO_PORTALS)
    this.defines = {CHECK_TWO_PORTALS: true};
  setFlagsLambert(this);
  return this;
};

function setFlagsLambert(material) {

  material.vertexShader = vertexShaderLambert;
  material.fragmentShader = fragmentShaderLambert;
  material.type = 'MeshPortalShadowLambertMaterial';
}


export function MeshPortalShadowPhongMaterial (parameters) {

  this.checkTwoPortals = false;
  if (parameters && parameters.checkTwoPortals && parameters.checkTwoPortals === true)
    this.checkTwoPortals = true;

  MeshPhongMaterial.call( this );
  this.uniforms = UniformsUtils.merge([ShaderLib.phong.uniforms, portalUniforms]);
  if (this.checkTwoPortals)
    this.defines = {CHECK_TWO_PORTALS : true};
  setFlagsPhong(this);
  this.setValues(parameters);
}

MeshPortalShadowPhongMaterial.prototype = Object.create( MeshPhongMaterial.prototype );
MeshPortalShadowPhongMaterial.prototype.constructor = MeshPortalShadowPhongMaterial;
MeshPortalShadowPhongMaterial.prototype.isMeshPhongMaterial  = true;

MeshPortalShadowPhongMaterial.prototype.copy = function ( source ) {
  MeshPhongMaterial.prototype.copy.call( this, source );
  this.uniforms = UniformsUtils.clone(source.uniforms);
  if (source.defines && source.defines.CHECK_TWO_PORTALS)
    this.defines = {CHECK_TWO_PORTALS: true};
  setFlagsPhong(this);
  return this;
};

function setFlagsPhong(material) {

  material.vertexShader = vertexShaderPhong;
  material.fragmentShader = fragmentShaderPhong;
  material.type = 'MeshPortalShadowPhongMaterial';
}

