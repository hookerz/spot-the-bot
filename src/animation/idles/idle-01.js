
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

    tl.staggerTo ( positions, 0.6, { y: spread * 1.0, ease: Elastic.easeOut.config ( 1.2, 0.8 ), overwrite: 1 }, 0.02 );

    for ( let i = attachments.length; --i >= 0; ) {

      const part = attachments[i];

      tl.add ([

        TweenMax.to ( part.rotation, 0.4, { y: 0.2 + Math.random () * 0.2, ease: eases.a } ),
        TweenMax.to ( part.rotation, 1.2, { y: '-=0.6', ease: eases.a } ),
        TweenMax.to ( part.rotation, 0.2, { y: '-=0.05', ease: Power2.easeOut } ),
        TweenMax.to ( part.rotation, 0.4, { y: 0.1, ease: Power2.easeOut } ),
        TweenMax.to ( part.rotation, 0.4, { y: 0.0, ease: Power2.easeInOut } ),

        //TweenMax.to ( part.position, 0.6, { y: spread * 0.8, ease: Power1.easeInOut, repeat: -1, yoyo: true } ),

      ], 0.3 + 0.1 * i, 'sequence' );

    }

    tl.add ( 'return' );

    for ( let i = attachments.length; --i >= 0; ) {

      const part = attachments[i];

      tl.add ([

        TweenMax.to ( part.position, 0.1, { y: spread * 0.8, ease: Power4.easeIn } ),
        TweenMax.to ( part.position, 0.3, { y: spread * 0.0, ease: Elastic.easeOut.config ( 1.0, 0.6 ) } ),

      ], 'return+=' + ( 0.02 * i ), 'sequence' );

    }

    //tl.to ( rootRoot.scale, 0.8, { x: 1.1, y: 1.1, z: 1.1, ease: Elastic.easeOut.config ( 1.0, 0.6 ) }, 0.02 );

    return [
      tl
    ];

}
