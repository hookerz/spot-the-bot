
import eases from '../eases';

export default function ( mesh, bones, onComplete ) {

  const root = bones.animationBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );

  }

  const tl = new TimelineMax ( { repeat: -1, onComplete: onComplete} );

        //tl.to ( [ root.rotation, root.position ], 0.08, { x: 0, y: 0, z: 0 } );

        // antic / explode

        tl.fromTo ( root.scale, 0.08,

          { y: 0.8, x: ( 3.0 - 0.8 ) * 0.5, z: ( 3.0 - 0.8 ) * 0.5, immediateRender: false },
          { y: 1.8, x: ( 3.0 - 1.8 ) * 0.5, z: ( 3.0 - 1.8 ) * 0.5, ease: Power2.easeIn } );

        // vertical motion

        tl.add ( 'lift' );

        tl.add ([

          TweenMax.fromTo ( root.position, 0.4, { y: 0.0, immediateRender: false }, { y: 2.3, ease: eases.b } ),
          TweenMax.to ( root.position, 1.6, { y: 1.5, ease: eases.c } )

        ], 'lift', 'sequence' );

        tl.add ( 'drop', '+=0.6' );

        tl.add ([

          TweenMax.to ( root.position, 0.1, { y: 1.55, ease: Power2.easeInOut } ),
          TweenMax.to ( root.position, 0.2, { y: 0.0, ease: Power2.easeIn } ),

        ], 'drop', 'sequence' );

        // squash and stretch and smear

        tl.add ([
          TweenMax.to ( root.scale, 0.8, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.0, 0.8 )})
        ], 'lift');

        tl.add ([
          TweenMax.to ( root.scale, 0.2, { y: 1.4, x: 1.0, z: 1.0, ease: Power2.easeIn } ),
          TweenMax.to ( root.scale, 0.3, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.0, 1.0 )})
        ], 'drop+=0.1', 'sequence');

        // spin

        tl.to ( root.rotation, 2.0, { y: Math.PI * 4.0, ease: eases.d }, 'lift+=0.0' );

        // spread em

        tl.add ((() => {

          const spread = 0.4;

          const tl = new TimelineMax ();

                tl.fromTo ( positions, 1.0, { y: 0.0, immediateRender: true }, { y: spread, ease: eases.f, overwrite: 1 } );
                tl.fromTo ( positions, 0.8, { y: spread, immediateRender: false }, { y: spread * 0.9, ease: Expo.easeIn }, '+=0.4' );
                tl.staggerTo ( positions, 0.3, { y: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.9 ) }, 0.03 );

          return tl;

        })(), 'lift+=0.1' );

  return [tl];

}
