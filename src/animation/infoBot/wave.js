import { Color } from 'three';

const white = new Color ( 0xffffff );
const black = new Color ( 0x000000 );
const color1 = new Color ( 0xfcffd3 );
const color2 = new Color ( 0xb2fffb );
const color3 = new Color ( 0xffb032 );

const flickerWiggle = CustomWiggle.create ( null, { wiggles: 3, amplitudeEase: Power0.easeOut, timingEase: Power1.easeIn } );

export default function ( parts ) {

  const tl = new TimelineMax ( { repeat: 0 } );

        tl.add ( 'wave', 0.06 );

        tl.fromTo ( parts.cont_speaker_l_anim.rotation, 0.12, { z: 0.0 }, { z: 0.4, ease: Power2.easeIn }, 'wave' );

        tl.add ( 'pushit' );

        tl.add ( [
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.3, { z: 0.9, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.4, { z: 0.8, ease: Power1.easeInOut } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.6, { z: 1.0, ease: Power1.easeInOut } ),
        ], '+=0.0', 'sequence' );

        tl.add ([
          TweenMax.to ( parts.inner.position, 0.12, { y: -0.06, ease: Power2.easeOut } ),
          TweenMax.to ( parts.inner.position, 0.2, { y: 0.06, ease: Power2.easeOut } ),
          TweenMax.to ( parts.inner.position, 0.8, { y: 0.00, ease: Power2.easeOut } ),
        ], 'wave', 'sequence' );

        tl.add ([
          TweenMax.fromTo ( parts.cont_body_anim.rotation, 0.2, { z: 0.0 }, { z: -0.20, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_body_anim.rotation, 0.4, { z: -0.10, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_body_anim.rotation, 0.8, { z: -0.12, ease: Power1.easeInOut } ),
        ], 'pushit', 'sequence' );

        tl.add ([
          TweenMax.fromTo ( parts.cont_head_anim.rotation, 0.1, { z: 0.0 }, { z: -0.10, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_head_anim.rotation, 0.3, { z: -0.26, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_head_anim.rotation, 0.6, { z: -0.16, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_head_anim.rotation, 0.8, { z: -0.20, ease: Power1.easeInOut } ),
        ], 'pushit+=0.02', 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_head_anim.position, 0.12, { y: -0.04, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_head_anim.position, 0.2, { y: 0.3, ease: Power2.easeOut} ),
          TweenMax.to ( parts.cont_head_anim.position, 0.6, { y: 0.2, ease: Power1.easeInOut} ),
        ], 0.0, 'sequence' );

        tl.add ( [
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.3, { z: 0.44, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.4, { z: 0.4, ease: Power1.easeInOut } ),
        ], 'wave+=0.12', 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_light_anim.position, 0.2, { y: -0.04, ease: Power3.easeOut } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.3, { y: 0.04, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_light_anim.position, 0.8, { y: 0.0, ease: Elastic.easeOut.config ( 1.2, 0.6 ) } ),
        ], 0.04, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_body_anim.position, 0.12, { y: -0.14, ease: Power3.easeOut } ),
          TweenMax.to ( parts.cont_body_anim.position, 0.4, { y: -0.1, ease: Power1.easeInOut } ),
        ], 0.12, 'sequence' );

        tl.add ( 'return', '+=0.2' );

        tl.add ( [
          //TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.1, { z: 1.01, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.2, { z: 0.6, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_speaker_l_anim.rotation, 0.6, { z: 0.0, ease: Power3.easeOut } ),
        ], 'return', 'sequence' );

        tl.add ([
          //TweenMax.to ( parts.cont_body_anim.rotation, 0.2, { z: -0.14, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_body_anim.rotation, 0.4, { z: 0.04, ease: Power1.easeInOut } ),
          TweenMax.to ( parts.cont_body_anim.rotation, 0.4, { z: 0.0, ease: Power1.easeInOut } ),
        ], 'return+=0.04', 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_head_anim.rotation, 0.1, { z: -0.14, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_head_anim.rotation, 0.4, { z: 0.0, ease: Power2.easeOut } ),
        ], 'return+=0.16', 'sequence' );

        tl.add ([
          //TweenMax.to ( parts.cont_head_anim.position, 0.12, { y: 0.22, ease: Power1.easeOut } ),
          TweenMax.to ( parts.cont_head_anim.position, 0.2, { y: 0.1, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_head_anim.position, 0.6, { y: 0.0, ease: Elastic.easeOut.config ( 1.2, 0.9 ) } ),
        ], 'return+=0.12', 'sequence' );

        tl.add ([
          TweenMax.to ( parts.inner.position, 0.2, { y: -0.04, ease: Power2.easeOut } ),
          TweenMax.to ( parts.inner.position, 0.8, { y: 0.0, ease: Power1.easeInOut } ),
        ], 'return+=0.4', 'sequence' );

        tl.add ( [
          TweenMax.to ( parts.cont_speaker_r_anim.rotation, 0.3, { z: 0.0, ease: Power2.easeOut } ),
        ], 'return+=0.0', 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_body_anim.rotation, 0.4, { y: 0.0, ease: Power1.easeOut } ),
        ], 'return+=0.0', 'sequence' );

        // light

        /*
        tl.add ([
          TweenMax.fromTo ( parts.mesh_light_emissive.material, 0.2, { emissiveIntensity: 0.0 }, { emissiveIntensity: 0.8, ease: Power1.easeIn } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.6, { emissiveIntensity: 1.0, ease: flickerWiggle } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.4, { emissiveIntensity: 1.0, ease: Power2.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.4, { emissiveIntensity: 0.6, ease: Power2.easeIn } ),
          TweenMax.to ( parts.mesh_light_emissive.material, 0.6, { emissiveIntensity: 0.0, ease: Power1.easeOut } ),
        ], 'pushit', 'sequence' );

        tl.add ([
          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 0.2, { r: color2.r, g: color2.g, b: color2.b, ease: Power1.easeOut } ),
          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 0.2, { r: white.r, g: white.g, b: white.b, ease: Power1.easeInOut } ),

          TweenMax.to ( parts.mesh_light_emissive.material.emissive, 0.4, { r: color1.r, g: color1.g, b: color1.b, ease: Power1.easeOut } ),
        ], 'pushit', 'sequence' );
        */


  return tl;

}
