
const ease_speaker_wiggle_01 = CustomWiggle.create ( "speaker01", { wiggles: 16, type: "random" } );
const ease_speaker_wiggle_02 = CustomWiggle.create ( "speaker02", { wiggles: 16, type: "random" } );

export default function ( parts ) {

  return [
    TweenMax.fromTo ( parts.cont_speaker_l_anim.scale, 1.6, { y: 0.94 }, { y: 1.04, ease: ease_speaker_wiggle_01, repeat: -1, overwrite: 1  } ),
    TweenMax.fromTo ( parts.cont_speaker_r_anim.scale, 1.6, { y: 0.94 }, { y: 1.04, ease: ease_speaker_wiggle_02, repeat: -1, overwrite: 1  } ),
  ]

}
