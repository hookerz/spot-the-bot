
import eases from '../eases';

const wiggle01 = CustomWiggle.create ( "wiggle01", { wiggles: 4, amplitudeEase: Power2.easeOut } );

export default function ( mesh, bones, onComplete ) {

  const root = bones.animationBone;
  const rootRoot = bones.rootBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );

  }

  const tl = new TimelineMax ( { repeat: 0, onComplete: onComplete} );

        // antic / explode

        /*
        tl.fromTo ( root.scale, 0.08,

          { y: 0.8, x: ( 3.0 - 0.8 ) * 0.5, z: ( 3.0 - 0.8 ) * 0.5, immediateRender: false },
          { y: 1.8, x: ( 3.0 - 1.8 ) * 0.5, z: ( 3.0 - 1.8 ) * 0.5, ease: Power2.easeIn } );
        */
        // vertical motion

        tl.add ( 'lift' );

        // squash and stretch and smear
        /*
        tl.add ([
          TweenMax.to ( root.scale, 0.8, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.0, 0.8 )})
        ], 'lift');
        */
        // spin

        const r = Math.PI * 2.0;

        tl.add ([

          TweenMax.to ( root.rotation, 0.06, { y: -r * 0.03, ease: Power2.easeInOut } ),
          'spin',
          TweenMax.to ( root.rotation, 0.3, { y: r * 0.6, ease: Power1.easeIn } ),
          'overshoot',
          TweenMax.to ( root.rotation, 0.3, { y: r * 1.005, ease: Power3.easeOut } ),
          TweenMax.to ( root.rotation, 0.4, { y: r * 1.0, ease: Elastic.easeOut.config ( 1.0, 0.9 ) } ),
          TweenMax.set ( root.rotation, { y: 0 } )

        ], 'lift', 'sequence' );

        tl.add ([

          TweenMax.to ( root.rotation, 0.12, { z: 0.2, ease: Power2.easeOut } ),
          TweenMax.to ( root.rotation, 0.4, { z: -0.1, ease: Power2.easeInOut } ),
          TweenMax.to ( root.rotation, 0.4, { z: 0.0, ease: Power4.easeOut } )

          /*
          TweenMax.to ( root.rotation, 0.8, { y: r, ease: eases.d } ),
          'antic',
          TweenMax.to ( root.rotation, 0.12, { y: r + 0.2, ease: Power2.easeOut } ),
          'out',
          TweenMax.to ( root.rotation, 1.2, { y: -Math.PI * 12.0, ease: Power2.easeIn } ),
          */
        ], 'lift', 'sequence' );

        tl.add ([

          TweenMax.to ( root.position, 0.2, { x: -0.2, ease: Power2.easeOut } ),
          TweenMax.to ( root.position, 0.4, { x:  0.05, ease: Power3.easeOut } ),
          TweenMax.to ( root.position, 0.4, { x: 0, ease: Power1.easeOut } ),
          /*
          TweenMax.to ( root.rotation, 0.8, { y: r, ease: eases.d } ),
          'antic',
          TweenMax.to ( root.rotation, 0.12, { y: r + 0.2, ease: Power2.easeOut } ),
          'out',
          TweenMax.to ( root.rotation, 1.2, { y: -Math.PI * 12.0, ease: Power2.easeIn } ),
          */
        ], 'lift', 'sequence' );

        /*
        tl.add ([
          TweenMax.to ( root.position, 0.2, { y: 0.01, ease: Power2.easeOut } ),
          TweenMax.to ( root.position, 0.2, { y: -0.1, ease: Power2.easeInOut } ),
          TweenMax.to ( root.position, 0.4, { y: 0.0, ease: Power2.easeOut } )
        ], 'lift', 'sequence' );
        */

        const squash = 1.2;
        const stretch = ( 3.0 - squash ) * 0.5;

        const s = 1.05;

        tl.add ([
          TweenMax.to ( root.scale, 0.2, { x: squash, y: stretch, z: stretch, ease: Power3.easeOut } ),
          TweenMax.to ( root.scale, 0.4, { x: s, y: s, z: s, ease: Elastic.easeOut.config ( 1.2, 0.9 ) } )
        ], 'spin+=0.2', 'sequence' );

        // spread em

        const spread = 0.4;

        tl.add ([

           TweenMax.fromTo ( positions, 0.2, { y: 0.0, immediateRender: true }, { y: spread * 0.4, ease: Power2.easeIn } ),
           TweenMax.to ( positions, 0.4, { y: spread * 1.0, ease: Elastic.easeOut.config ( 1.2, 0.6 ) } ),
           'shrank'

        ], 'spin+=0.24', 'sequence' );

        /*
        tl.add ( 'shrankydank', 'shrank+=0.0' );

        tl.add ([

          TweenMax.staggerTo ( positions, 0.2, { y: spread * 1.2, ease: Power2.easeOut }, 0.01 ),
          TweenMax.staggerTo ( positions, 0.1, { y: spread * 0.0, ease: Power3.easeIn }, 0.02 ),

        ], 'shrankydank+=0.0', 'sequence' );

        tl.add ([

           TweenMax.to ( root.scale, 0.3, { x: 0.4, y: 0.4, z: 0.4, ease: Power4.easeIn } ),
           TweenMax.to ( root.scale, 0.1, { x: 0.0, y: 0.01, z: 0.0, ease: Power3.easeOut } )

        ], 'shrankydank+=0.14', 'sequence' );

        tl.add ([

          TweenMax.to ( root.position, 0.3, { y: 0.10, ease: Power2.easeOut } )
          //TweenMax.to ( root.position, 0.6, { y: 1.0, ease: Power2.easeInOut } )

        ], 'shrankydank+=0.0', 'sequence' );
        */

        tl.timeScale ( 1.1 );

  return [tl];

}
