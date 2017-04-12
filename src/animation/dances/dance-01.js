
import eases from '../eases';

const key = 0.18;
const antic = key * 0.8;
const passing = key * 0.1;
const dip = 0.04;
const spread = 0.04;

const rY_key = 0.06;
const rY_passing = -0.06;

const rX_passing = 0.08;

export default function ( mesh, bones, onComplete ) {

  const root = bones.animationBone;
  const attachments = bones.allAttachmentBonesButFace;

  const positions = [];
  const rotations = [];

  for ( let i = 0; i < attachments.length; i++ ) {

    positions.push ( attachments[i].position );
    rotations.push ( attachments[i].rotation );

  }

  const tl_sway = new TimelineMax ( { repeat: 0, onComplete: onComplete});

        // quick tween to the start position

        tl_sway.add ([
          TweenMax.to ( root.rotation, 0.2, { y: -rY_key, z: key, ease: Power1.easeOut } ),
          TweenMax.to ( root.position, 0.2, { y: 0.0, ease: Power1.easeOut } ),
          //TweenMax.to ( root.scale, 0.08, { x: 1, y: 1, z: 1, ease: Power1.easeOut } ),
          //TweenMax.to ( positions, 0.2, { y: spread, ease: eases.b } )
        ]);

        // then the loop

        tl_sway.add ((() => {

          const tl = new TimelineMax ( { repeat: -1 } );

                tl.add ([
                  TweenMax.to ( root.rotation, 0.3, { x: rX_passing, y: rY_passing, z: passing, ease: Power2.easeIn } ),
                  TweenMax.to ( root.position, 0.3, { x: 0.0, y: -dip, ease: Power2.easeInOut } ),
                  //TweenMax.to ( positions, 0.3, { y: 0.0, ease: Power2.easeInOut  } )
                ]);

                tl.add ([
                  TweenMax.to ( root.rotation, 0.6, { x: 0.0, y: rY_key, z: -key, ease: Power2.easeOut } ),
                  TweenMax.to ( root.position, 0.6, { y: 0.0, ease: Power2.easeOut } ),
                  //TweenMax.to ( positions, 0.6, { y: spread, ease: eases.b } )
                ]);

                tl.add ([
                  TweenMax.to ( root.rotation, 0.3, { x: rX_passing, y: -rY_passing, z: -passing, ease: Power2.easeIn } ),
                  TweenMax.to ( root.position, 0.3, { x: 0.0, y: -dip, ease: Power2.easeInOut } ),
                  //TweenMax.to ( positions, 0.3, { y: 0.0, ease: Power2.easeInOut  } )
                ]);

                tl.add ([
                  TweenMax.to ( root.rotation, 0.6, { x: 0, y: -rY_key, z: key, ease: Power2.easeOut } ),
                  TweenMax.to ( root.position, 0.6, { y: 0.0, ease: Power2.easeOut } ),
                  //TweenMax.to ( positions, 0.6, { y: spread, ease: eases.b } )
                ]);

          return tl;

        })());

  const tl_parts_turn = new TimelineMax ( { repeat: -1, yoyo: false } );

        tl_parts_turn.to ( rotations, 0.6, { y: 0.2, ease: Power2.easeInOut } );
        tl_parts_turn.to ( rotations, 0.8, { y: 0.0, ease: Power2.easeInOut } );
        /*
        tl_sway.add ( tl_parts_turn );
        */

  return [
    tl_sway,
    tl_parts_turn
  ];

}
