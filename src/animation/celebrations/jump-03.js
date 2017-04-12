
import eases from '../eases';

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

  tl.fromTo ( root.scale, 0.08,

    { y: 0.8, x: ( 3.0 - 0.8 ) * 0.5, z: ( 3.0 - 0.8 ) * 0.5, immediateRender: false },
    { y: 1.8, x: ( 3.0 - 1.8 ) * 0.5, z: ( 3.0 - 1.8 ) * 0.5, ease: Power2.easeIn } );

  // vertical motion

  tl.add ( 'lift' );

  tl.add ([

    TweenMax.fromTo ( root.position, 0.4, { y: 0.0, immediateRender: false }, { y: 2.3, ease: eases.b } ),
    TweenMax.to ( root.position, 1.6, { y: 1.5, ease: eases.c } )

  ], 'lift', 'sequence' );

  /*
  tl.add ( 'drop', '+=0.6' );

  tl.add ([

    TweenMax.to ( root.position, 0.1, { y: 1.55, ease: Power2.easeInOut } ),
    TweenMax.to ( root.position, 0.2, { y: 0.0, ease: Power2.easeIn } ),

  ], 'drop', 'sequence' );
  */
  // squash and stretch and smear

  tl.add ([
    TweenMax.to ( root.scale, 0.8, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.0, 0.8 )})
  ], 'lift');
  /*
  tl.add ([
    TweenMax.to ( root.scale, 0.2, { y: 1.4, x: 1.0, z: 1.0, ease: Power2.easeIn } ),
    TweenMax.to ( root.scale, 0.3, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.0, 1.0 )})
  ], 'drop+=0.1', 'sequence');
  */

  // spin

  const r = Math.PI * 4.0;

  tl.add ([
    TweenMax.to ( root.rotation, 0.8, { y: r, ease: eases.d } ),
    'antic',
    TweenMax.to ( root.rotation, 0.12, { y: r + 0.2, ease: Power2.easeOut } ),
    'out',
    TweenMax.to ( root.rotation, 1.2, { y: -Math.PI * 12.0, ease: Power2.easeIn } ),
  ], 'lift+=0.0', 'sequence' );

  tl.add ( [
    TweenMax.to ( root.rotation, 0.3, { z: -0.10, ease: Power2.easeInOut } ),
    TweenMax.to ( root.rotation, 0.2, { z: 0.3, ease: Power2.easeInOut } ),
    TweenMax.to ( root.rotation, 0.8, { z: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.4 ) } )
  ], 'antic+=0.02', 'sequence' );

  // spread em

  const spread = 0.4;

  tl.add ((() => {

    const tl = new TimelineMax ();

          tl.fromTo ( positions, 0.2, { y: 0.0, immediateRender: true }, { y: spread * 0.6, ease: Power2.easeIn } );
          tl.to ( positions, 0.6, { y: spread * 1.0, ease: Elastic.easeOut.config ( 1.2, 0.8 ) } );
          //tl.staggerTo ( positions, 0.3, { y: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.9 ) }, 0.03 );

    return tl;

  })(), 'lift+=0.26' );

  tl.add ([

    TweenMax.to ( root.scale, 0.4, { x: 0.001, y: 0.1, z: 0.001, ease: Power4.easeIn } )

  ], 'out+=0.4' );

  tl.add ([

    TweenMax.to ( root.position, 0.6, { y: 2.0, ease: Power4.easeIn } )

  ], 'out+=0.2', 'sequence' );



  return [tl];

}
