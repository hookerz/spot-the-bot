
export default function ( parts, onComplete) {

  const s0 = 1.2;
  const s1 = 2.0 - s0;

  const tl = new TimelineMax ( { repeat: 0, repeatDelay: 1.2, delay: 0.12, onComplete: onComplete} );

        tl.add ([
          TweenMax.fromTo ( parts.cont_panels_anim.scale, 0.04, { x: 1.0, y: 0.02, z: 1.0 }, { x: 1.4, y: 0.6, z: 1.0, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_panels_anim.scale, 0.14, { x: s1, y: s0, z: 1.0, ease: Power2.easeOut } ),
          TweenMax.to ( parts.cont_panels_anim.scale, 0.14, { x: 0.90, y: 1.1, z: 1.0, ease: Power2.easeIn } ),
          TweenMax.to ( parts.cont_panels_anim.scale, 0.8, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.2, 0.7 ) } )
        ], 0.04, 'sequence' );

        tl.add ([
          TweenMax.fromTo ( parts.cont_anim.scale, 0.2, { x: 0.01, y: 0.01, z: 1.0 }, { x: 0.6, y: 0.6, z: 1.0, ease: Power2.easeIn } ),
          TweenMax.to ( parts.cont_anim.scale, 0.4, { x: 1.0, y: 1.0, z: 1.0, ease: Power3.easeOut } )
        ], 0.0, 'sequence' );

        tl.add ([
          TweenMax.fromTo ( parts.cont_anim.rotation, 0.1, { z: 0.6 }, { z: 0.4, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_anim.rotation, 0.8, { z: 0.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } ),
        ], 0.12, 'sequence' );

        tl.add ([
          TweenMax.fromTo ( parts.cont_anim.position, 0.14, { x: -1.0, y: -4.0 }, { x: -0.3, y: -2.0, ease: Power1.easeIn } ),
          TweenMax.to ( parts.cont_anim.position, 0.8, { x: 0.0, y: 0.0, ease: Elastic.easeOut.config ( 0.8, 0.6 ) } ),
        ], 0.0, 'sequence' );

  for ( let i = parts.buttons.length; --i >= 0; ) {

    const btn = parts.buttons[i];
    const pos = 0.12 + 0.1 * i;

    tl.add ([
      TweenMax.fromTo ( btn.scale, 0.02, { x: 0.04, y: 0.04, z: 1.0 }, { x: 0.4, y: 0.4, z: 1.0, ease: Power0.easeIn } ),
      TweenMax.to ( btn.scale, 0.12, { x: 0.8, y: 0.8, z: 1.0, ease: Power1.easeIn } ),
      TweenMax.to ( btn.scale, 0.4, { x: 1.0, y: 1.0, z: 1.0, ease: Elastic.easeOut.config ( 1.0, 0.8 ) } )
    ], pos, 'sequence' );

    tl.add ([
      TweenMax.fromTo ( btn.rotation, 0.8, { z: -0.2 * ( ( i & 1 ) ? -1 : 1 ) }, { z: 0.0, ease: Elastic.easeOut.config ( 0.8, 0.8 ) } ),
    ], pos + 0.04, 'sequence' );

    tl.add ([
      TweenMax.fromTo ( btn.position, 0.4, { y: -2.0 }, { y: 0.0, ease: Power2.easeOut } ),
    ], pos, 'sequence' );

  }

  tl.timeScale ( 1.2 );

  return tl;

}
