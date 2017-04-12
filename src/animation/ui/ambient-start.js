
export default function ( parts, onComplete ) {

  TweenMax.fromTo ( parts.mesh_front.rotation, 2.0, { z: -0.01 }, { z: 0.01, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.0 } );
  TweenMax.fromTo ( parts.mesh_front.position, 1.8, { z: -0.05 }, { z: 0.05, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.0 } );

  TweenMax.fromTo ( parts.mesh_back.rotation, 1.9, { z: -0.02 }, { z: 0.02, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.0 } );
  TweenMax.fromTo ( parts.mesh_back.position, 1.6, { z: -0.05 }, { z: 0.05, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.0 } );

  /*
  TweenMax.to ( parts.loc_head.position, 1.2, { y: 0.08, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.2 } );
  TweenMax.to ( parts.loc_light_ambient.position, 1.2, { y: 0.02, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.6 } );

  TweenMax.to ( [ parts.loc_speaker_l.position, parts.loc_speaker_r.position ], 1.2, { y: 0.02, ease: Sine.easeInOut, repeat: -1, yoyo: true, delay: 0.4 } );
  */

      /*
      mesh_front.rotation.z = Math.sin ( a_dt * 2.0 ) * 0.01;
      mesh_front.position.y = Math.sin ( a_dt * 1.8 ) * 0.05;

      mesh_back.rotation.z = Math.sin ( a_dt * 1.98 ) * 0.02;
      mesh_back.position.y = Math.sin ( a_dt * 1.6 ) * 0.05;

      mesh_button.rotation.z = Math.sin ( a_dt * 1.8 ) * 0.01;
      mesh_button.position.y = Math.sin ( a_dt * 1.4 ) * 0.05;
*/
}
