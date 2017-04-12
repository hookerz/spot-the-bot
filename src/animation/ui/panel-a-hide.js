
export default function ( parts, onComplete ) {

  const tl = new TimelineMax ( { repeat: 0, repeatDelay: 1.2, delay: 0.0, onComplete: onComplete } );

        tl.add ([
          TweenMax.to ( parts.cont_anim.scale, 0.2, { x: 0.6, y: 0.6, z: 1.0, ease: Power3.easeIn } ),
          TweenMax.to ( parts.cont_anim.scale, 0.1, { x: 0.05, y: 0.05, z: 1.0, ease: Power0.easeOut } ),
          TweenMax.to ( parts.cont_anim.scale, 0.01, { x: 0.001, y: 0.001, z: 1.0, ease: Power2.easeOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_anim.rotation, 0.4, { z: -0.4, ease: Power1.easeIn } ),
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.to ( parts.cont_anim.position, 0.3, { x: 1.0, y: -2.0, ease: Power1.easeIn } ),
        ], 0.0, 'sequence' );

        tl.timeScale ( 1.4 );

  return tl;

}
