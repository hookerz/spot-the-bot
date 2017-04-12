uniform vec3 skyColor;
uniform vec3 horizonColor;
uniform float gradientPower;
uniform float time;
uniform float blendHeight;

varying vec3 modelPosition;

vec3 vpow(vec3 v, float power) {
    return vec3(
        pow(v.x, power),
        pow(v.y, power),
        pow(v.z, power)
    );
}

// https://www.shadertoy.com/view/MslGR8
// original source: http://alex.vlachos.com/graphics/Alex_Vlachos_Advanced_VR_Rendering_GDC2015.pdf
vec3 ScreenSpaceDither(vec2 vScreenPos) {
	// Iestyn's RGB dither (7 asm instructions) from Portal 2 X360, slightly modified for VR
  vec3 vDither = vec3( dot( vec2( 171.0, 231.0 ), vScreenPos.xy + time) );
  vDither.rgb = fract( vDither.rgb / vec3( 103.0, 71.0, 97.0 ) );
  return vDither.rgb / 255.0;

}

void main() {
  vec3 nmpos = normalize(modelPosition);
  float upness = saturate(saturate(nmpos.y) / blendHeight);
  vec3 color = mix(horizonColor, skyColor, pow(upness, gradientPower));
#ifdef COLORS_ARE_LINEAR
  color = vpow(color, 2.2); // liner -> gamma
#endif

#ifdef DITHER
  vec3 dither = ScreenSpaceDither(gl_FragCoord.xy);
  gl_FragColor = vec4(color + dither, 1.0);
#else
  gl_FragColor = vec4(color, 1.0);
#endif
}
