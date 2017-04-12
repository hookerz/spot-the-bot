import { Color } from 'three';

const red = new Color ( 0xFF0000 );
const orange = new Color ( 0xff970f );
const deep = new Color ( 0x681d1d );

const ease_head_turn = CustomWiggle.create ( null, { wiggles: 6, amplitudeEase: Power3.easeOut, timingEase: Power0.easeIn } );
const ease_speakers = CustomWiggle.create ( null, { wiggles: 4, amplitudeEase: Power3.easeOut, timingEase: Power0.easeIn } );

export default function ( parts ) {

  // material animation test

  const tl = new TimelineMax ( { repeat: 0, repeatDelay: 1.0 });

        tl.add ([
          TweenMax.to ( parts.cont_face_anim.rotation, 0.8, { y: 0.3, ease: ease_head_turn } ),
          TweenMax.to ( parts.cont_face_anim.rotation, 0.4, { y: 0.0, ease: Power1.easeOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_face_anim.position, 0.2, { y: -0.01, ease: Power4.easeOut } ),
          TweenMax.to ( parts.cont_face_anim.position, 0.3, { y: 0.0, ease: Power2.easeIn } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_head_anim.rotation, 0.2, { x: 0.05, ease: Power4.easeOut } ),
          TweenMax.to ( parts.cont_head_anim.rotation, 0.8, { x: 0.0, ease: Power1.easeInOut } )
        ], 0.06, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_body_anim.position, 0.2, { y: 0.02, ease: Power4.easeOut } ),
          TweenMax.to ( parts.cont_body_anim.position, 0.6, { y: 0.0, ease: Power1.easeInOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_body_anim.rotation, 0.8, { y: -0.1, ease: ease_head_turn } ),
          TweenMax.to ( parts.cont_body_anim.rotation, 0.4, { y: 0.0, ease: Power1.easeOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.6, { x: -0.4, ease: ease_head_turn } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.2, { x: 0.0, ease: Power1.easeOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.12, { z: 0.3, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.6, { z: 0.0, ease: Power1.easeInOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.6, { x: 0.4, ease: ease_head_turn } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.2, { x: 0.0, ease: Power1.easeOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.12, { z: -0.3, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.6, { z: 0.0, ease: Power1.easeInOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.inner.position, 0.12, { y: -0.02, ease: Power2.easeOut } ),
          TweenMax.to ( parts.inner.position, 0.8, { y: 0.00, ease: Power2.easeInOut } ),
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_light_anim.position, 0.3, { y: 0.2, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.1, { y: 0.22, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.3, { y: -0.04, ease: Power3.easeIn } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.1, { y: 0.0, ease: Power1.easeOut } ),
        ], 0.0, 'sequence' );

        /*
        tl.add ([
          TweenMax.to ( parts.mesh_light_emissive.material, 0.4, { emissiveIntensity: 1.0, ease: Power4.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.8, { emissiveIntensity: 0.0, ease: Power1.easeOut } ),
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 0.04, { r: orange.r, g: orange.g, b: orange.b, ease: Power0.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 0.4, { r: red.r, g: red.g, b: red.b, ease: Power1.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 0.6, { r: deep.r, g: deep.g, b: deep.b, ease: Power1.easeIn } ),
        ], 0.0, 'sequence' );
        */

       // tl.to ( parts.mesh_light_emissive.material.emissive, 0.2, { r: red.r, g: red.g, b: red.b, ease: Power1.easeOut }, 0.0 );

  return tl;

}
