
import eases from '../eases';

const wiggle01 = CustomWiggle.create ( "wiggle01", { wiggles: 4, amplitudeEase: Power2.easeOut } );

export default function ( mesh, bones, onComplete  ) {

  const root = bones.animationBone;
  const rootRoot = bones.rootBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );

  }

  const tl = new TimelineMax ( { repeat: 0, onComplete: onComplete} );

        // spread em

        const spread = 0.4;

        tl.add ([

          'expand',
           TweenMax.fromTo ( positions, 0.1, { y: 0.0, immediateRender: true }, { y: spread * 0.4, ease: Power3.easeIn } ),
           TweenMax.to ( positions, 0.4, { y: spread * 1.0, ease: Elastic.easeOut.config ( 1.2, 0.4 ) } ),

        ], 0.0, 'sequence' );

        tl.add ( 'antic', '-=0.2' );

        const s = 1.05;
        const s0 = 0.98;

        tl.add ([

          TweenMax.to ( root.scale, 0.12, { x: s0, y: s0, z: s0, ease: Power2.easeOut } ),
          TweenMax.to ( root.scale, 0.4, { x: s, y: s, z: s, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } ),
           //TweenMax.to ( root.scale, 0.1, { x: 0.0, y: 0.01, z: 0.0, ease: Power3.easeOut } )

        ], 'expand+=0.02', 'sequence' );

        // spin

        const r = -Math.PI * 2.0;

        /*
        tl.add ([

          TweenMax.fromTo ( root.rotation, 0.2, { y: 0.0 }, { y: 0.2, ease: Power1.easeOut } ),
          TweenMax.to ( root.rotation, 0.3, { y: r * 0.6, ease: Power1.easeIn } ),
          TweenMax.to ( root.rotation, 0.4, { y: r * 1.005, ease: Power3.easeOut } ),
          TweenMax.to ( root.rotation, 0.6, { y: r * 1.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } ),
          TweenMax.set ( root.rotation, { y: 0 } )

        ], 'antic', 'sequence' );

        const rZ = 0.1;

        tl.add ([

          TweenMax.fromTo ( root.rotation, 0.4, { z: 0.0 }, { z: -0.1, ease: Power2.easeOut } ),
          TweenMax.to ( root.rotation, 0.2, { z: 0.1, ease: Power2.easeOut } ),
          TweenMax.to ( root.rotation, 0.2, { z: 0.05, ease: Power1.easeIn } ),
          TweenMax.to ( root.rotation, 0.6, { z: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } )

        ], 'antic', 'sequence' );
        */

        /*
        tl.add ( 'shrank', 'antic+=0.2' );

        tl.add ([

           TweenMax.to ( root.scale, 0.3, { x: 0.6, y: 0.6, z: 0.6, ease: Power2.easeIn } ),
           TweenMax.to ( root.scale, 0.1, { x: 0.0, y: 0.01, z: 0.0, ease: Power3.easeOut } )

        ], 'shrank', 'sequence' );

        tl.add ([

          TweenMax.to ( root.position, 0.4, { y: 0.5, ease: Power2.easeIn } )
          //TweenMax.to ( root.position, 0.6, { y: 1.0, ease: Power2.easeInOut } )

        ], 'shrank', 'sequence' );
        */

  return [tl];

}
