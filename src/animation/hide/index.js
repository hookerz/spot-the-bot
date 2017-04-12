

import eases from '../eases';

function hide01 ( mesh, bones, onComplete ) {

  const root = bones.animationBone;
  const rootRoot = bones.rootBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );

  }

  const tl = new TimelineMax ( { repeat: 0, repeatDelay: 0.8, onComplete: onComplete} );

  const spread = 0.1;

  for ( let i = positions.length; --i >= 0; ) {

    const p = positions[i];

    tl.add ([

      TweenMax.to ( p, 0.2, { y: '+=0.1', ease: Power2.easeOut, overwrite: 1 } ),
      TweenMax.to ( p, 0.3, { y: 0.0, ease: Power2.easeIn } )

      //TweenMax.fromTo ( p, 0.2, { y: 0.0 }, { y: spread, ease: Power2.easeOut } ),
      //TweenMax.to ( p, 0.1, { y: spread * 0.8, ease: Power3.easeIn } ),
      //TweenMax.to ( p, 0.4, { y: 0.0, ease: Elastic.easeOut.config ( 1.2, 0.6 ) } )

    ], 0.12 + i * 0.02, 'sequence' );

  }

  const scale_down = 0.001;
  const scale_up = 1.1;

  tl.add ([
    TweenMax.to ( mesh.scale, 0.08, { x: scale_up, y: scale_up, z: scale_up, ease: Power1.easeOut } ),
    TweenMax.to ( mesh.scale, 0.2, { x: scale_down, y: scale_down, z: scale_down, ease: Power1.easeIn } )
  ], 0.12, 'sequence' );


  return [tl];

}

export { hide01 };

export const hideAnimation = hide01;
