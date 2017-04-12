
import eases from '../eases';

export default function ( mesh, bones, onComplete)  {

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

      tl.add ([

        TweenMax.to ( part.position, 0.2, { y: spread * 0.6, ease: Power2.easeOut, delay: 0.1 } ),
        TweenMax.to ( part.position, 0.3, { y: spread * 0.4, ease: Power1.easeOut, delay: 0.1 } ),
        TweenMax.to ( part.position, 0.2, { y: spread * 1.0, ease: Power2.easeOut, delay: 0.1 } ),
        TweenMax.to ( part.position, 0.3, { y: spread * 0.6, ease: Power2.easeOut, delay: 0.1 } ),
        TweenMax.to ( part.position, 0.4, { y: spread * 0.0, ease: Elastic.easeOut.config ( 1.0, 0.6 ), delay: 0.1 } ),

      ], ( ( 0.02 + Math.random () * 0.04 ) * i ), 'sequence' );

    }

    //tl.to ( rootRoot.scale, 0.8, { x: 1.1, y: 1.1, z: 1.1, ease: Elastic.easeOut.config ( 1.0, 0.6 ) }, 0.02 );

    return [
      tl
    ];

}
