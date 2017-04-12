uniform vec2 resolution;
uniform vec2 eyeResolution;
uniform vec2 eyeOffset;

uniform float vignettePower;
uniform float vignetteRadiusStart;
uniform float vignetteRadiusEnd;
uniform float vignetteMax;
uniform vec3 vignetteColor;

varying vec3 worldPosition;

void main() {
  vec3 nwpos = normalize(worldPosition);
  vec2 screen01 = (gl_FragCoord.xy - eyeOffset) / eyeResolution;
  vec2 screenUnit = screen01 * 2.0 - vec2(1.0);
  float distance = length(screenUnit);
  float range = vignetteRadiusEnd - vignetteRadiusStart;
  float r01 = saturate((distance - vignetteRadiusStart) / range);
  float vin = pow(r01, vignettePower) * vignetteMax;
  gl_FragColor = vec4(vignetteColor, vin);
}
