

export default function ( parts ) {

  const t = 0.01;

  // this doesnt construct a timeline for easier overriding

  TweenMax.to ( parts.cont_head_anim.rotation, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );
  TweenMax.to ( parts.cont_head_anim.position, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );

  TweenMax.to ( parts.cont_face_anim.rotation, t, { x: 0.0, y: 0.0, z: 0.0, ease: Power3.easeOut } );
  TweenMax.to ( parts.cont_face_anim.position, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );

  TweenMax.to ( parts.cont_body_anim.rotation, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );
  TweenMax.to ( parts.cont_body_anim.position, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );

  TweenMax.to ( parts.cont_speaker_l_anim.rotation, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );
  TweenMax.to ( parts.cont_speaker_l_anim.position, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );

  TweenMax.to ( parts.cont_speaker_r_anim.rotation, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );
  TweenMax.to ( parts.cont_speaker_r_anim.position, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );

  TweenMax.to ( parts.inner.position, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );

  TweenMax.to ( parts.cont_light_anim.position, t, { x: 0, y: 0, z: 0, ease: Power3.easeOut } );

  TweenMax.to ( parts.mesh_light_emissive.material, t, { emissiveIntensity: 0.0, ease: Power3.easeOut } );
  //TweenMax.to ( parts.mesh_light_emissive.material.emissive, t, { r: green.r, g: green.g, b: green.b, ease: Power1.easeOut } );

  // but returns an empty one for cross-functional purposes

  return new TimelineMax ();

}
