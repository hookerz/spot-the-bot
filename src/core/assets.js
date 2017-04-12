import Debug from 'debug';
import config from './config';
import { noop } from '../util';

const debug = Debug('app:assets');

const keyToURL = new Map();
const requests = new Map();
const cache = new Map();

/**
 * @typedef {Object} AssetDescription
 *
 * A self-contained description of an asset, and how to load it.
 *
 * @property {String} key - The asset key.
 * @property {String} url - The asset URL.
 * @property {Function} loader - The three.js loader constructor to use.
 */

/**
 * Load a manifest of asset descriptions.
 *
 * @param {AssetDescription[]} manifest
 * @param {Function} outerOnComplete
 * @param {Function} outerOnProgress
 * @param {Function} outerOnError
 */
export function load(manifest, outerOnComplete, outerOnProgress, outerOnError) {

  if (Array.isArray(manifest) === false) {
    manifest = [ manifest ];
  }

  if (config.log) debug(`loading ${ manifest.length } assets as group`);

  let loadedAssets = 0;
  let totalAssets = manifest.length;

  // The three.js LoadingManager is subtly broken for loaders with async parsing, like the
  // AudioLoader. So instead we use a little mini manager object that tracks completed requests.
  // https://github.com/mrdoob/three.js/issues/10706

  const manager = {
    onStart(url) {
      requests.set(url, true);
    },

    onProgress(url, itemProgress) {
      const totalProgress = (loadedAssets / totalAssets) + (itemProgress / totalAssets);
      outerOnProgress(totalProgress);
    },

    onError(url, err) {
      if (config.log) debug(`unable to load "${ url }"`);

      requests.delete(url);
      totalAssets = (totalAssets - 1);
      outerOnError(err);

      if (loadedAssets === totalAssets) outerOnComplete();
    },

    onComplete(url, asset) {
      if (config.log) debug(`loaded "${ url }"`);

      requests.delete(url);
      cache.set(url, asset);
      loadedAssets = (loadedAssets + 1);

      if (loadedAssets === totalAssets) outerOnComplete();
    }
  };

  for (let item of manifest) {
    loadAsset(item, manager);
  }
}

/**
 * Load an asset into the global cache, reporting progress to a loading manager.
 *
 * @param {AssetDescription} desc - The asset description.
 * @param {Object} manager - The loading manager.
 *
 * @return {Loader}
 */
function loadAsset(desc, manager) {

  if (desc.key === undefined) {
    desc.key = desc.url;
  } else {
    keyToURL.set(desc.key, desc.url);
  }

  if (desc.url === undefined) throw new Error(`The "${ desc.key }" asset is missing a url.`);
  if (desc.loader === undefined) throw new Error(`The "${ desc.key }" asset is missing a loader class.`);

  const loaderctr = desc.loader;

  // Reuse loader instances in the same group. We could probably reuse them globally; I'm not even
  // sure why they need to be instantiated.

  const loader = manager[loaderctr] = manager[loaderctr] || new loaderctr();

  function onComplete(asset) {
    manager.onComplete(desc.url, asset);
  }

  function onProgress(xhr) {
    // xhr.total is 0 if content-length header is missing
    const percent = (xhr.total > 0) ? (xhr.loaded / xhr.total) : 0;
    manager.onProgress(desc.url, percent);
  }

  function onError(err) {
    manager.onError(desc.url, err);
  }

  manager.onStart(desc.url);
  loader.load(desc.url, onComplete, onProgress, onError);
  return loader;
}

/**
 * Get an asset by it's key or URL. Throws an error if the asset is still being loaded, or was
 * never requested.
 *
 * @param {String} key - The key or URL used to load the asset.
 *
 * @return {*}
 */
export function get(key) {
  const url = keyToURL.has(key) ? keyToURL.get(key) : key;

  if (requests.has(url)) throw new Error(`"${ key }" has not finished downloading`);

  const asset = cache.get(url);

  if (asset === undefined) {
    throw new Error(`"${ key }" was not loaded`);
  } else {
    return asset;
  }
}

export default { load, get };
