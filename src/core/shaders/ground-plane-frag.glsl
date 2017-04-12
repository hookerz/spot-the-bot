uniform vec3 diffuse;

#include <common>
#include <packing>
#include <lights_pars>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <fog_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>

uniform float shadowMaskMin;
uniform vec3 farColor;
uniform float farPower;
uniform float farDistance;
uniform float uvScale;

varying vec4 worldPosition;

void main() {
  #include <color_fragment>

  vec3 worldPosXY = vec3(worldPosition.x, 0, worldPosition.z); // we only care about xz distance
  float dist = length(worldPosition); // distance from the player at 0,0,0
  float factor = pow(saturate(dist / farDistance), farPower);
  vec3 color = mix(diffuse.rgb, farColor, factor);

  #ifdef USE_SHADOWMAP
    float shadow = getShadowMask();
  #else
    #ifdef USE_MAP
      vec2 newUV = vec2(vUv.x, 1.0 - vUv.y);
      float shadow = texture2D(map, newUV  * 4.0 - 1.5).w;
    #else
      float shadow = 1.0;
    #endif
  #endif
  // remap shadow from 0-1 => 0.8 -> 1 instead to prevent the shadows from getting TOO dark
  float range = 1.0 - shadowMaskMin;
  shadow = shadowMaskMin + range * shadow;
  gl_FragColor = vec4(color * shadow, 1.0);

  #include <fog_fragment>
}
