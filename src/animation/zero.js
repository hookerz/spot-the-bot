
import eases from './eases';

export default function ( bones, onComplete ) {

  const root = bones.animationBone;
  const toot = bones.rootBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];
  const rotations = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );
    rotations.push ( attachments[i].rotation );

  }

  const ease = Elastic.easeOut.config ( 0.8, 0.6 );
  const t = 0.12;

  const tl = new TimelineMax ( { repeat: 0, onComplete: onComplete});

        // quick tween to the start position

        tl.add ([
          TweenMax.to ( toot.scale, t, { x: 1, y: 1, z: 1, ease: ease, overwrite: 1 } ),
          TweenMax.to ( root.rotation, t, { x: 0, y: 0, z: 0, ease: ease, overwrite: 1 } ),
          TweenMax.to ( root.position, t, { x: 0, y: 0, z: 0, ease: ease, overwrite: 1 } ),
          TweenMax.to ( root.scale, t, { x: 1, y: 1, z: 1, ease: ease, overwrite: 1 } ),
          TweenMax.to ( positions, t, { x: 0, y: 0, z: 0, ease: ease, overwrite: 1 } ),
          TweenMax.to ( rotations, t, { x: 0, y: 0, z: 0, ease: ease, overwrite: 1 } )
        ]);

  return [
    tl
  ];

}
