import { TextureLoader, Geometry, Vector3, BufferGeometry, BufferAttribute, Object3D, ShaderMaterial, Points, Color, AdditiveBlending } from 'three';
import { WorldEvent } from './world';

/**
 * Dust particles. Particles are organized into sets, each set can have a different color and texture.
 *
 * The options are:
 *   speedFactor - The higher the value, the faster the particles will move
 *   particleSize - The size of the particles
 *   radius - The radius of the volume in which the particles exist
 *   alphaTest - If the texture's alpha is lower than this threshold, the pixel is discarded
 *   nParticlesPerSet - Number of particles in each set
 *   setColors - Array of colors, one per set
 *   setTextures - Array of textures, one per set
 *   textureAlphaFactor - Scales the texture alphas by this factor
 *
 * @return {Promise}
 */
export function DustParticles(options) {

  options = Object.assign({
    speedFactor: 0.0000075,
    particleSize: 1.65,
    radius: 10,
    nParticlesPerSet: 50,
    setColors: [0x990000, 0xFFFF3C, 0xFDEDE5, 0x009900, 0x990000],
    setTextures: [
      '../../sprites/hexagon.png',
      '../../sprites/pentagon.png',
      '../../sprites/spark.png',
      '../../sprites/hexagon.png',
      '../../sprites/circle.png'
    ],
    textureAlphaFactor: [0.25, 0.05, 0.1, 0.125, .5],
    alphaTest: [.1, .025, .075, .1, .1]
  }, options);

  const vertexShader = `
        attribute float size;
      
        void main() {
      
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      
          gl_PointSize = size * ( 300.0 / -mvPosition.z );
      
          gl_Position = projectionMatrix * mvPosition;

      }`;
  const fragShader = `
        uniform vec3 color;
        uniform sampler2D texture;
        uniform float alphaFactor;

        void main() {
        
            gl_FragColor = vec4( color, 1.0 );
        
            vec4 texColor = texture2D( texture, gl_PointCoord );
            texColor.a *= alphaFactor;
            
            gl_FragColor = gl_FragColor * texColor;            
        
            if ( gl_FragColor.a < ALPHATEST ) discard;
        
      }`;

  const textureLoader = new TextureLoader();

  const particlesGeometry = new Geometry();
  const radius = options.radius;
  for (let i = 0; i < options.nParticlesPerSet; i++) {

    const vertex = new Vector3();
    vertex.x = Math.random() * 2 * radius - radius;
    vertex.y = Math.random() * 2 * radius - radius;
    vertex.z = Math.random() * 2 * radius - radius;

    particlesGeometry.vertices.push(vertex);

  }
  const positions = new Float32Array( particlesGeometry.vertices.length * 3 );
  const sizes = new Float32Array( particlesGeometry.vertices.length );

  const vCount = particlesGeometry.vertices.length;
  let vertex;
  for ( let i = 0; i < vCount; i ++ ) {

    vertex = particlesGeometry.vertices[ i ];
    vertex.toArray( positions, i * 3 );

    const pixelRatio = devicePixelRatio || 1;
    sizes[ i ] = options.particleSize * pixelRatio;

  }

  const geometry = new BufferGeometry();
  geometry.addAttribute( 'position', new BufferAttribute( positions, 3 ) );
  geometry.addAttribute( 'size', new BufferAttribute( sizes, 1 ) );

  let materials = [];

  let dust = new Object3D();
  dust.name = "Particles Root";
  dust.position.z = 0;

  for (let i = 0; i < options.setColors.length; i++) {

    materials[i] =
      new ShaderMaterial({

        uniforms: {
          color: {value: new Color(options.setColors[i])},
          texture: {value: textureLoader.load(options.setTextures[i])},
          alphaFactor: {value: options.textureAlphaFactor[i]}
        },
        blending: AdditiveBlending,
        depthTest: true,
        transparent: true,
        vertexShader: vertexShader,
        fragmentShader: fragShader,

        alphaTest: options.alphaTest[i]

      });

    const particles = new Points(geometry, materials[i]);

    particles.rotation.x = Math.random() * 6;
    particles.rotation.y = Math.random() * 6;
    particles.rotation.z = Math.random() * 6;

    dust.add(particles);

  }

  dust.update = function(event) {

    const time = Date.now() * options.speedFactor;

    for (let i = 0; i < dust.children.length; i++) {

      const object = dust.children[i];

      object.rotation.y = time * ( i < 4 ? i + 1 : -( i + 1 ) );

    }

  };

  return dust;
}

export function addDustToWorld(world) {
  const dust = new DustParticles({
    speedFactor: 0.0000075,
    particleSize: .3,
    radius: 20,
    nParticlesPerSet: 75,
    setColors: [0x990000, 0xFFFF3C, 0xFDEDE5, 0x009900, 0x990000],
    setTextures: [
      '../../sprites/hexagon.png',
      '../../sprites/pentagon.png',
      '../../sprites/spark.png',
      '../../sprites/hexagon.png',
      '../../sprites/circle.png'
    ],
    textureAlphaFactor: [0.25, 0.05, 0.1, 0.125, .5],
    alphaTest: [.1, .025, .075, .1, .1]});
  world.scene.add(dust);
  world.addEventListener(WorldEvent.update, dust.update);
}
