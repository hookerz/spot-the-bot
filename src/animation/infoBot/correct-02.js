import { Color } from 'three';

const green = new Color ( 0x00ff00 );

const ease_body_wiggle = CustomWiggle.create ( null, { wiggles: 4, amplitudeEase: Power1.easeIn, timingEase: Power0.easeIn } );

const r0 = Math.PI * 2.0 * 0.8;
const r1 = Math.PI * 2.0;

export default function ( parts ) {

  // material animation test

  const tl = new TimelineMax ( { repeat: 0, repeatDelay: 1.0 });

        tl.add ([
          TweenMax.fromTo ( parts.mesh_light_emissive.material, 0.2, { emissiveIntensity: 0.0 }, { emissiveIntensity: 0.6, ease: Power1.easeIn } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.2, { emissiveIntensity: 0.9, ease: Power2.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.6, { emissiveIntensity: 1.0, ease: Power1.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.4, { emissiveIntensity: 0.0, ease: Power1.easeOut } ),
        ], 0.0, 'sequence' );

        tl.to ( parts.mesh_light_emissive.material.emissive, 0.2, { r: green.r, g: green.g, b: green.b, ease: Power1.easeOut }, 0.0 );

        tl.add ([
          TweenMax.to ( parts.cont_light_anim.position, 0.1, { y: 0.2, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.3, { y: 0.4, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.4, { y: 0.34, ease: Power1.easeInOut } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.2, { y: 0.5, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.2, { y: 0.25, ease: Power2.easeIn } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.6, { y: 0.0, ease: Elastic.easeOut.config ( 1.4, 0.8 ) } ),
        ], 0.00, 'sequence' );

        tl.add ([
          //TweenMax.to ( parts.cont_face_anim.position, 0.1, { y: -0.05, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_face_anim.position, 0.6, { y: 0.2, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_face_anim.position, 0.2, { y: 0.16, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_face_anim.position, 0.6, { y: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } ),
        ], 0.1, 'sequence' );

        tl.add ([
          //TweenMax.to ( parts.cont_body_anim.position, 0.1, { y: -0.05, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_body_anim.position, 0.4, { y: 0.12, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_body_anim.position, 0.2, { y: 0.08, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_body_anim.position, 0.6, { y: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } ),
        ], 0.24, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.1, { z: -0.1, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.2, { z: 0.6, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.6, { z: 0.9, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.3, { z: -0.1, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.3, { z: 0.0, ease: Power1.easeInOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.1, { z: 0.1, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.2, { z: -0.6, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.6, { z: -0.9, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.3, { z: 0.1, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.3, { z: 0.0, ease: Power1.easeInOut } )
        ], 0.04, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_face_anim.rotation, 0.1, { y: -0.1, ease: Power3.easeOut } ),
          TweenMax.to ( parts.cont_face_anim.rotation, 0.2, { y: r0, ease: Power2.easeIn } ),
          TweenMax.to ( parts.cont_face_anim.rotation, 0.2, { y: r1 + 0.06, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_face_anim.rotation, 0.3, { y: r1, ease: Power1.easeInOut } ),
          TweenMax.set ( parts.cont_face_anim.rotation, { y: 0.0, immediateRender: false } )
        ], 0.1, 'sequence' );

        /*
        tl.add ([
          TweenMax.to ( parts.cont_body_anim.rotation, 0.8, { y: 0.3, ease: ease_body_wiggle } ),
          TweenMax.to ( parts.cont_body_anim.rotation, 0.4, { y: 0.0, ease: Power1.easeOut } )
        ], 0.1, 'sequence' );
        */

        tl.timeScale ( 1.2 );

  return tl;

}
