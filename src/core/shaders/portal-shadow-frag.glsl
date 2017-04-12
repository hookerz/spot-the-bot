uniform vec3 portalPosition;
uniform vec3 portalWorldSpaceDir;
uniform float power;
uniform float offset;
uniform float on;

varying vec4 worldPosition;

float projectScalar(vec3 a, vec3 b) {
    vec3 bn = b / length(b);
    return dot(a, bn);
}

void main() {
  vec3 v = worldPosition.xyz - portalPosition;
  float s = saturate(projectScalar(v, portalWorldSpaceDir) + offset);
  float c = pow(s, power);
  gl_FragColor = vec4(0,0,0,c * on);
}
