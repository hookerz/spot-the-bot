
import eases from '../eases';

function on01 ( mesh, bones, onComplete  ) {

  const root = bones.animationBone;
  const rootRoot = bones.rootBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );

  }

  const tl = new TimelineMax ( { repeat: 0, onComplete: onComplete} );

  // lets just spit the arms out right now
  // and do a little jitter-loop
  // for this, each arm should probably have its own timeline
  // containing sub-timelines for:
  // - push out
  // - loop

  const spread = 0.3;

  for ( let i = attachments.length; --i >= 0; ) {

    const part = attachments[i];

    tl.add ([

      TweenMax.to ( part.position, 0.6, { y: spread * 1.0, ease: Elastic.easeOut.config ( 1.3, 0.6 ), overwrite: 1 } ),
      TweenMax.to ( part.position, 0.6, { y: spread * 0.8, ease: Power1.easeInOut, repeat: -1, yoyo: true } ),

    ], 0.02 * i, 'sequence' );

  }

  tl.to ( rootRoot.scale, 0.8, { x: 1.1, y: 1.1, z: 1.1, ease: Elastic.easeOut.config ( 1.0, 0.6 ) }, 0.02 );

  return [
    tl
  ];

}

function off01 ( mesh, bones, onComplete ) {

  const root = bones.animationBone;
  const rootRoot = bones.rootBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );

  }

  const tl = new TimelineMax ( { repeat: 0, onComplete: onComplete} );

  // lets just spit the arms out right now
  // and do a little jitter-loop
  // for this, each arm should probably have its own timeline
  // containing sub-timelines for:
  // - push out
  // - loop

  const spread = 0.3;

  for ( let i = attachments.length; --i >= 0; ) {

    const part = attachments[i];

    tl.add ([

      TweenMax.to ( part.position, 0.12, { y: spread * 1.1, ease: Power1.easeOut } ),
      TweenMax.to ( part.position, 0.3, { y: spread * 0.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ), overwrite: 1 } ),

    ], 0.03 * i, 'sequence' );

  }

  const scale = 1.0;

  tl.to ( rootRoot.scale, 0.6, { x: scale, y: scale, z: scale, ease: Elastic.easeOut.config ( 1.0, 0.4 ) }, 0.1 );

  return [
    tl
  ];

}


export { on01, off01 }

export const gazeOverAnimation = on01;
export const gazeOutAnimation = off01;
