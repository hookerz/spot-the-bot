varying vec4 worldPosition;

void main() {
  vec4 pos = vec4(position, 1.0);
  worldPosition = modelMatrix * pos;
  gl_Position = projectionMatrix * modelViewMatrix * pos;
}
