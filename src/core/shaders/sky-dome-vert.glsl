varying vec3 modelPosition;

void main() {
  modelPosition = normalize(position.xyz); // normalize() here fixes an issue on mobile with interpolation
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
