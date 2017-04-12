
import eases from '../eases';

export default function ( mesh, bones, onComplete )  {

    const root = bones.animationBone;
    const rootRoot = bones.rootBone;
    const attachments = bones.allAttachmentBonesButFace;

    const positions = [];
    const rotations = [];

    for ( let i = 0; i < attachments.length; i++ ) {

      positions.push ( attachments[i].position );
      rotations.push ( attachments[i].rotation );

    }

    const spread = 0.1;

    const tl = new TimelineMax ( { repeat: 0, onComplete: onComplete} );

    for ( let i = attachments.length; --i >= 0; ) {

      const part = attachments[i];
      const r = 0.2 + Math.random () * 0.1;
      const p = 0.0 + 0.04 * i;

      tl.add ([

        TweenMax.to ( part.rotation, 0.4, { y: r * 0.8, ease: eases.a } ),
        TweenMax.to ( part.rotation, 0.4, { y: '-=' + r * 2.0, ease: eases.a } ),
        TweenMax.to ( part.rotation, 0.8, { y: '+=' + r * 2.4, ease: eases.a } ),
        TweenMax.to ( part.rotation, 0.4, { y: 0.0, ease: eases.a } ),

      ], p, 'sequence' );

      tl.add ([

        TweenMax.to ( part.position, 0.4, { y: spread * 0.8, ease: eases.a } ),
        TweenMax.to ( part.position, 0.4, { y: spread * 0.4, ease: eases.a } ),
        TweenMax.to ( part.position, 0.8, { y: spread * 1.0, ease: eases.a } ),
        TweenMax.to ( part.position, 0.4, { y: spread * 0.0, ease: Elastic.easeOut.config ( 1.2, 0.9 ) } ),

      ], p, 'sequence' );

    }

    //tl.to ( rootRoot.scale, 0.8, { x: 1.1, y: 1.1, z: 1.1, ease: Elastic.easeOut.config ( 1.0, 0.6 ) }, 0.02 );

    return [
      tl
    ];

}
