import { Color } from 'three';

const green = new Color ( 0x30ffb3 );
const green2 = new Color ( 0xa7ff96 );
const green3 = new Color ( 0xc1ffde );
const green4 = new Color ( 0x19493d );

const ease_01 = CustomEase.create("custom", "M0,0 C0.12,0.1 0.145,0.53 0.246,0.53 0.296,0.53 0.35,0.279 0.466,0.372 0.58,0.464 0.394,1 1,1")

const ease_body_wiggle = CustomWiggle.create ( null, { wiggles: 4, amplitudeEase: Power1.easeIn, timingEase: Power0.easeIn } );

const r0 = Math.PI * 2.0 * 0.8;
const r1 = Math.PI * 2.0;

export default function ( parts ) {

  // material animation test

  const tl = new TimelineMax ( { repeat: 0, repeatDelay: 1.0 });

        /*
        tl.add ([
          TweenMax.fromTo ( parts.mesh_light_emissive.material, 0.2, { emissiveIntensity: 0.0 }, { emissiveIntensity: 0.6, ease: Power1.easeIn } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.4, { emissiveIntensity: 1.0, ease: Power4.easeOut } ),
          //TweenMax.to ( parts.mesh_light_emissive.material, 0.8, { emissiveIntensity: 0.0, ease: Power1.easeOut } ),
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.mesh_light_emissive.material, 0.4, { opacity: 1.0, ease: Power4.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.8, { opacity: 0.1, ease: Power1.easeOut } ),
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 0.2, { r: green3.r, g: green3.g, b: green3.b, ease: Power0.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 0.2, { r: green.r, g: green.g, b: green.b, ease: Power1.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 0.4, { r: green.r, g: green.g, b: green.b, ease: Power1.easeOut } ),
        ], 0.0, 'sequence' );

        tl.to ( parts.mesh_light_emissive.material.emissive, 0.2, { r: green.r, g: green.g, b: green.b, ease: Power1.easeOut }, 0.0 );
        */

        tl.add ([
          //TweenMax.to ( parts.cont_light_anim.position, 0.02, { y: -0.04, ease: Power1.easeOut } ),
          TweenMax.fromTo ( parts.cont_light_anim.position, 0.04, { y: -0.04 }, { y: 0.2, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.1, { y: 0.4, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.2, { y: 0.34, ease: Power1.easeInOut } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.3, { y: 0.6, ease: Power2.easeOut } ),
          'drop',
          TweenMax.to ( parts.cont_light_anim.position, 0.3, { y: 0.4, ease: Power2.easeIn } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.4, { y: 0.00, ease: Elastic.easeOut.config ( 1.4, 0.8 ) } ),

        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_face_anim.position, 0.04, { y: -0.05, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_face_anim.position, 0.1, { y: 0.05, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_face_anim.position, 0.4, { y: 0.1, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_face_anim.position, 0.2, { y: 0.08, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_face_anim.position, 0.4, { y: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } ),
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_body_anim.position, 0.08, { y: -0.05, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_body_anim.position, 0.1, { y: 0.03, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_body_anim.position, 0.3, { y: 0.08, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_body_anim.position, 0.2, { y: 0.06, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_body_anim.position, 0.4, { y: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } ),
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.12, { z: 0.6, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.4, { z: 0.8, ease: Power3.easeOut } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.2, { z: 0.6, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.4, { z: 0.0, ease: Power3.easeOut } )
        ], 0.02, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.12, { z: -0.6, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.4, { z: -0.8, ease: Power3.easeOut } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.2, { z: -0.6, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.4, { z: 0.0, ease: Power3.easeOut } )
        ], 0.06, 'sequence' );

        /*
        tl.add ([
          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 1.2, { r: green4.r, g: green4.g, b: green4.b, ease: Power1.easeIn } ),
        ], 'drop+=0.2', 'sequence' );

        tl.to ( parts.mesh_light_emissive.material, 2.2, { emissiveIntensity: 0.0, ease: Power1.easeOut }, 'drop+=0.2' );
        */

        /*
        tl.add ([
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.12, { z: -0.3, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.6, { z: 0.0, ease: Power1.easeInOut } )
        ], 0.1, 'sequence' );
        */

  return tl;

}
