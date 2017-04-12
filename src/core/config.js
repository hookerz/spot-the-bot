import is from 'is_js';
import { query } from '../util/querystring';
import { MeshStandardMaterial, MeshPhongMaterial} from 'three';
import { MeshPortalShadowStandardMaterial, MeshPortalShadowPhongMaterial } from './materials/portal-shadow-materials';

const mobile = is.mobile();

/**
 * @typedef {Object} Config
 *
 * Some global application configuration.
 *
 * @property {Boolean} mobile - True if we're running on a mobile platform.
 * @property {String} roomCharset - The characters to use when generating room codes.
 * @property {String} requireVRPresent - Only let the user play in VR if they can present to a device.
 */
const config = applyQueryParams({

  shadows: !mobile,
  softShadows: !mobile,
  pbr: !mobile,
  animations: true,
  audio: true,
  dustParticles: !mobile,
  singleLight: mobile,
  rayCasting: true,
  showFPS: false,
  renderStats: false,
  difficulty: 'easy',
  vignette: false,
  envMap: false,
  useSkinningVertexTexture: true,
  shadowMapSize: mobile ? 1024 : 4096,
  log: true,
  seed: null,
  mobile: mobile,
  roomCharset: '123456789',
  requireVRPresent: true,
  prod: false, // production environment
});

export const DefaultMaterial = config.pbr
  ? MeshStandardMaterial
  : MeshPhongMaterial;

export const DefaultPortalShadowMaterial = config.pbr
  ? MeshPortalShadowStandardMaterial
  : MeshPortalShadowPhongMaterial;

export default config;

/**
 * Apply query param values to the config, with some generous parsing.
 *
 * @param {Object} config - The config object to apply values to.
 * @return {Object} the same config object.
 */
function applyQueryParams(config) {

  const keys = Object.keys(query);

  for (let key of keys) {

    const val = query[key];

    if (val === "0" || val === "false" || val === "f" || val === "no" || val === "n")
      config[key] = false;
    else if (val === "1" || val === "true" || val === "t" || val === "yes" ||  val === "y")
      config[key] = true;
    else if (key === "shadowMapSize")
      config[key] = Number(val);
    else
      config[key] = val;

  }

  return config;

}

export function executeIfConfig(key, value, func) {
  return function (...args) {
    if (config[key] === value) {
      func(...args);
    }
  }
}
