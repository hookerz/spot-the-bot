
export default function ( parts ) {

  return TweenMax.to ( [
    parts.cont_speaker_l_anim.scale,
    parts.cont_speaker_r_anim.scale ], 0.1, { y: 1.0, ease: Power2.easeOut, overwrite: 1 } );

}
