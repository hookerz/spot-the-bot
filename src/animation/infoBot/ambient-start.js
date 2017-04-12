
const ease_speaker_wiggle_01 = CustomWiggle.create ( "speaker", { wiggles: 16, type: "random" } );

export default function ( parts ) {

  TweenMax.to ( parts.cont_body.position, 1.2, { y: 0.05, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.3 } );

  TweenMax.to ( parts.loc_head.position, 1.2, { y: 0.08, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.2 } );
  TweenMax.to ( parts.loc_light_ambient.position, 1.2, { y: 0.02, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.6 } );

  TweenMax.to ( [ parts.cont_speaker_l.position, parts.cont_speaker_r.position ], 1.2, { y: 0.04, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.5 } );

}
