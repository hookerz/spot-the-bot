varying vec3 viewSpaceNormal;
varying vec4 viewSpacePosition;

uniform float alphaPower;
uniform float colorPower;
uniform vec3 innerColor;
uniform vec3 outerColor;

void main() {
  vec3 normal = normalize(viewSpaceNormal);
  vec3 viewDir = normalize(viewSpacePosition.xyz);
  float d = saturate(dot(-viewDir, normal));
  float apow = pow(d, alphaPower);
  float cpow = pow(d, colorPower);
  vec3 col = mix(outerColor, innerColor, cpow);
  gl_FragColor = vec4(col.x, col.y, col.z, apow);
}
