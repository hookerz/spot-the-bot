varying vec3 viewSpaceNormal;
varying vec4 viewSpacePosition;

void main() {
  vec4 pos = vec4(position, 1.0);
  viewSpacePosition = modelViewMatrix * pos;
  viewSpaceNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * viewSpacePosition;
}
