varying vec3 worldPosition;

void main() {

  vec4 wp4 = modelMatrix * vec4(position, 1.0);
  worldPosition = normalize(wp4.xyz); // this fixes an issue on mobile
  gl_Position = projectionMatrix * viewMatrix * wp4;
}
