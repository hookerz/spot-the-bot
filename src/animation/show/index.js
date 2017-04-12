

import eases from '../eases';

function show01 ( mesh, bones, onComplete ) {

  const root = bones.animationBone;
  const rootRoot = bones.rootBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );

  }

  const spread = 0.1;
  const tl = new TimelineMax ( { repeat: 0, repeatDelay: 0.8, onComplete: onComplete} );

        tl.fromTo ( mesh.scale, 0.12,
          { x: 0.1, y: 0.1, z: 0.1 },
          { x: 0.6, y: 0.6, z: 0.6, ease: Power2.easeIn } );

        tl.to ( mesh.scale, 0.6, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } );

        for ( let i = positions.length; --i >= 0; ) {

          const p = positions[i];

          tl.add ([

            TweenMax.fromTo ( p, 0.2, { y: 0.0 }, { y: spread, ease: Power2.easeOut } ),
            TweenMax.to ( p, 0.1, { y: spread * 0.8, ease: Power3.easeIn } ),
            TweenMax.to ( p, 0.4, { y: 0.0, ease: Elastic.easeOut.config ( 1.2, 0.6 ) } )

          ], 0.12 + i * 0.02, 'sequence' );

        }

  return [tl];

}

function show02 ( mesh, bones, onComplete ) {

  const root = bones.animationBone;
  const rootRoot = bones.rootBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );

  }

  const spread = 0.2;
  const tl = new TimelineMax ( { repeat: 0, repeatDelay: 0.8, onComplete: onComplete} );

        tl.fromTo ( mesh.scale, 0.12,
          { x: 0.1, y: 0.1, z: 0.1 },
          { x: 0.6, y: 0.6, z: 0.6, ease: Power2.easeIn } );

        tl.to ( mesh.scale, 0.8, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.0, 0.6 ) } );

        for ( let i = positions.length; --i >= 0; ) {

          const p = positions[i];

          tl.add ([

            TweenMax.fromTo ( p, 0.2, { y: spread * 0.0 }, { y: spread, ease: Power2.easeOut } ),
            TweenMax.to ( p, 0.12, { y: spread * 1.2, ease: Power3.easeInOut, delay: 0.0 } ),
            TweenMax.to ( p, 0.4, { y: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.6 ) } )

          ], 0.08 + i * 0.03, 'sequence' );

        }

        tl.fromTo ( rootRoot, 0.8, { y: 1.0 }, { y: 0.0, ease: Power3.easeOut }, 0.0 );

  return [tl];

}

export { show01, show02 };


export const showAnimation = show01;
export const showAnimations = [show01, show01];
