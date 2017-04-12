import is from 'is_js';
import { TextureLoader, FontLoader } from 'three';
import { OBJLoader } from '../util/three-ext/obj-loader';
import { FixedAudioLoader } from '../util/three-ext/fixed-audio-loader';
import { getPartsManifest } from '../core/parts';
import { manifest as soundManifest } from '../core/sound-manager';
import { manifest as chatbotManifest } from '../core/info-bot/index';

/**
 * Build the asset manifest.
 *
 * @return {AssetDescription[]}
 */
export function build() {

  const manifest = [];

  manifest.push(...getPartsManifest());
  manifest.push(...soundManifest);
  manifest.push(...chatbotManifest);
  manifest.push({ key: 'main-font',           url: 'fonts/roboto_bold.json',                loader: FontLoader });
  manifest.push({ key: 'trackshadow',         url: 'images/trackshadow.png',                loader: TextureLoader });
  manifest.push({ key: 'lineTrack',           url: 'geo/tracks/line_track.obj',             loader: OBJLoader });
  manifest.push({ key: 'lineTrackShadow',     url: 'geo/tracks/line_track_shadow.obj',      loader: OBJLoader });
  manifest.push({ key: 'allTracksShadowMesh', url: 'geo/tracks/all_tracks_shadow_mesh.obj', loader: OBJLoader });
  manifest.push({ key: 'wand',                url: 'geo/wand.obj',                          loader: OBJLoader });

  if (is.ios() || is.mac()) {

    manifest.push({ key: 'music', url: 'sounds/WebVR_music_04.mp3', loader: FixedAudioLoader });

  } else {

    manifest.push({ key: 'music', url: 'sounds/WebVR_music_04.ogg', loader: FixedAudioLoader });

  }

  return manifest;
}
