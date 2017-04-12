
import eases from '../eases';

const wiggle01 = CustomWiggle.create ( "wiggle01", { wiggles: 4, amplitudeEase: Power2.easeOut } );
const wiggle02 = CustomWiggle.create ( "wiggle02", { wiggles: 6, amplitudeEase: Power4.easeOut } );
const wiggle03 = CustomWiggle.create ( "wiggle03", { wiggles: 12, amplitudeEase: Power2.easeOut, timingEase: Power1.easeOut } );

export default function ( mesh, bones, onComplete ) {

  const root = bones.animationBone;
  const rootRoot = bones.rootBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );

  }

  const tl = new TimelineMax ( { repeat: 0, onComplete: onComplete} );

        // lets start with some rotations around the y axis

        const jiggleY = 0.12;

        tl.to ( rootRoot.rotation, 0.9, { z: 0.3, ease: wiggle02 }, 0.1 );
        tl.to ( rootRoot.rotation, 0.8, { y: 0.6, ease: wiggle02 }, 0.1 );

        /*
        tl.add ([
          TweenMax.to ( rootRoot.rotation, 0.12, { y: jiggleY, ease: Power2.easeInOut } ),
          TweenMax.to ( rootRoot.rotation, 0.1, { y: -jiggleY * 0.9, ease: Power3.easeOut } ),
          TweenMax.to ( rootRoot.rotation, 0.1, { y: jiggleY * 0.4, ease: Power3.easeOut } ),
          TweenMax.to ( rootRoot.rotation, 0.1, { y: -jiggleY * 0.1, ease: Power3.easeOut } ),
          TweenMax.to ( rootRoot.rotation, 0.4, { y: 0.0, ease: Power3.easeOut } ),
        ], 0.0, 'sequence' );
        */

        // add a little on the z axis

        //tl.to ( rootRoot.rotation, 0.8, { z: -0.08, ease: wiggle01 }, 0.0 );

        /*

        tl.add ([
          TweenMax.to ( rootRoot.rotation, 0.1, { x: 0.1, ease: Power3.easeOut }),
          TweenMax.to ( rootRoot.rotation, 0.6, { x: 0.0, ease: Power4.easeOut })
        ], 0.0, 'sequence' );
*/
        // and x?

        //tl.fromTo ( rootRoot.rotation, 0.6, { x: -0.04 }, { x: 0, ease: Elastic.easeOut.config ( 1.2, 0.6 ) }, 0.0 );

        // shoot the arms out

        const spread = 0.3;

        tl.add ((() => {

          const tl = new TimelineMax ();

                //tl.to ( positions, 0.8, { y: spread * 1.0, ease: Elastic.easeOut.config ( 1.0, 0.6 ), overwrite: 1 } );
                //tl.to ( positions, 0.12, { y: spread * 0.5, ease: Power2.easeIn, overwrite: 1 } );
                tl.staggerTo ( positions, 0.4, { y: spread * 0.0, ease: Elastic.easeOut.config ( 1.4, 0.6 ), overwrite: 1 }, 0.02 );

          return tl;

        })(), 0.0 );

        // some scale

        tl.add ([

         TweenMax.to ( root.scale, 0.12, { x: 0.98, y: 0.98, z: 0.98, ease: Power2.easeOut } ),
         TweenMax.to ( root.scale, 0.60, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.0, 0.6 ) } )

        ], 0.12, 'sequence' );

        const scale = 1.0;

        tl.to ( rootRoot.scale, 0.2, { x: scale, y: scale, z: scale, ease: Power2.easeOut, overwrite: 1 }, 0.0 );

  return [tl];

}
