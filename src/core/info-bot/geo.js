import {Object3D, Mesh} from 'three';
import loadedAssets from '../assets';

const DEG2RAD = Math.PI / 180.0;

const slots = {};

slots['light-root'] = (() => {

  const obj = new Object3D ();
        obj.position.set ( 0.0, 0.90, 0.0 );
        obj.rotation.set ( -1.5 * DEG2RAD, 0.0 * DEG2RAD, 0.0 * DEG2RAD );

  return obj;

})();

slots['body'] = (() => {

  const obj = new Object3D ();
        obj.position.set ( 0.0, -0.15, 0.0 );
        obj.rotation.set ( 6.8 * DEG2RAD, 0.0 * DEG2RAD, 0.0 * DEG2RAD );

  return obj;

})();

slots['eye-l'] = (() => {

  const scale = 1.0;

  const obj = new Object3D ();
        obj.position.set ( 0.47, 0.34, 0.84 );
        obj.rotation.set ( 0.0 * DEG2RAD, 117.0 * DEG2RAD, 90.0 * DEG2RAD );
        obj.scale.set ( scale, scale, scale );

  return obj;

})();

slots['eye-r'] = (() => {

  const scale = 1.1;

  const obj = new Object3D ();
        obj.position.set ( -0.47, 0.34, 0.88 );
        obj.rotation.set ( 58.8 * DEG2RAD, ( 64.4 * 0.5 ) * DEG2RAD, 90.9 * DEG2RAD, 'ZXY' );
        obj.scale.set ( scale, scale, scale );

  return obj;

})();

slots['speaker-l'] = (() => {

  const scale = 0.97;

  const obj = new Object3D ();
        obj.position.set ( -0.59, -0.37, 0.49 );
        obj.rotation.set ( 26.0 * DEG2RAD, -130.0 * DEG2RAD, -103.0 * DEG2RAD );
        obj.scale.set ( scale, scale, scale );

  return obj;

})();

slots['speaker-r'] = (() => {

  const scale = 0.97;

  const obj = new Object3D ();
        obj.position.set ( 0.59, -0.37, 0.49 );
        obj.rotation.set ( 26.0 * DEG2RAD, 130.0 * DEG2RAD, 103.0 * DEG2RAD );
        obj.scale.set ( scale, scale, scale );

  return obj;

})();

slots['speaker-inner'] = (() => {

  const scale = 1.0;

  const obj = new Object3D ();
        obj.position.set ( 0.0, 0.17, 0.0 );
        obj.rotation.set ( 0.0 * DEG2RAD, 0.0 * DEG2RAD, 0.0 * DEG2RAD );
        obj.scale.set ( scale, scale, scale );

  return obj;

})();




export default function (botMaterial, lightMaterial, eyeMaterial) {

    // this is just a shim so I can reuse most of Brad's code as is....
    const assets = {
      'body': loadedAssets.get("body_lo").children[0],
      'head': loadedAssets.get("head_w-eyes_lo").children[0],
      'light-casing': loadedAssets.get("light-casing_lo").children[0],
      'light-emissive': loadedAssets.get("light-emissive").children[0],
      'eyes-emissive_combined': loadedAssets.get("eyes-emissive_combined").children[0],
      'speaker': loadedAssets.get("speaker-base_lo").children[0],
      'speaker-inner': loadedAssets.get("speaker-inner").children[0],
    };

    const mesh_body = new Mesh ( assets.body.geometry, botMaterial );
          mesh_body.name = 'mesh_body';
    const mesh_head = new Mesh ( assets['head'].geometry, botMaterial );
          mesh_head.name = 'mesh_head';
          mesh_head.castShadow = true;
    const mesh_light_casing = new Mesh ( assets['light-casing'].geometry, botMaterial );
          mesh_light_casing.name = 'mesh_light_casing';
    const mesh_light_emissive = new Mesh ( assets['light-emissive'].geometry, lightMaterial );
          mesh_light_emissive.name = 'mesh_light_emissive';

    const mesh_eyes_emissive = new Mesh ( assets['eyes-emissive_combined'].geometry, eyeMaterial );
          mesh_eyes_emissive.name = 'mesh_eyes_emissive_combined';

    const mesh_speaker_l = new Mesh ( assets['speaker'].geometry, botMaterial );
          mesh_speaker_l.name = 'mesh_speaker_l';
          mesh_speaker_l.castShadow = true;
    const mesh_speaker_r = new Mesh ( assets['speaker'].geometry, botMaterial );
          mesh_speaker_r.name = 'mesh_speaker_r';
          mesh_speaker_r.castShadow = true;

    const mesh_speaker_l_inner = new Mesh ( assets['speaker-inner'].geometry, botMaterial );
          mesh_speaker_l_inner.name = 'mesh_speaker_l_inner';
          mesh_speaker_l_inner.position.copy ( slots['speaker-inner'].position );

    const mesh_speaker_r_inner = new Mesh ( assets['speaker-inner'].geometry, botMaterial );
          mesh_speaker_r_inner.name = 'mesh_speaker_r_inner';
          mesh_speaker_r_inner.position.copy ( slots['speaker-inner'].position );

    const loc_light_inner = slots['light-root'];
          loc_light_inner.name = 'loc_light_inner';
          loc_light_inner.add ( mesh_light_casing );
          loc_light_inner.add ( mesh_light_emissive );
          loc_light_inner.scale.set ( 1.1, 1.1, 1.1 );

    const cont_light_anim = new Object3D ();
          cont_light_anim.name = 'cont_light_anim';
          cont_light_anim.add ( loc_light_inner );

    const loc_light_ambient = new Object3D ();
          loc_light_ambient.name = 'loc_light_ambient';
          loc_light_ambient.add ( cont_light_anim );

    const cont_face_anim = new Object3D ();
          cont_face_anim.name = 'cont_face_anim';
          cont_face_anim.add ( mesh_head );
          cont_face_anim.add ( mesh_eyes_emissive );

    const cont_head_anim = new Object3D ();
          cont_head_anim.name = 'cont_head_anim';
          cont_head_anim.add ( cont_face_anim );
          cont_head_anim.add ( loc_light_ambient );

    const loc_head = new Object3D ();
          loc_head.name = 'loc_head';
          loc_head.add ( cont_head_anim );

    const cont_speaker_l_anim = new Object3D ();
          cont_speaker_l_anim.name = 'cont_speaker_l_anim';
          cont_speaker_l_anim.add ( mesh_speaker_l );

    const loc_speaker_l_inner = slots['speaker-l'];
          loc_speaker_l_inner.name = 'loc_speaker_l_inner';
          loc_speaker_l_inner.add ( cont_speaker_l_anim );

    const cont_speaker_l = new Object3D ();
          cont_speaker_l.name = 'cont_speaker_l';
          cont_speaker_l.add ( loc_speaker_l_inner );

    const cont_speaker_r_anim = new Object3D ();
          cont_speaker_r_anim.name = 'cont_speaker_r_anim';
          cont_speaker_r_anim.add ( mesh_speaker_r );

    const loc_speaker_r_inner = slots['speaker-r'];
          loc_speaker_r_inner.name = 'loc_speaker_r_inner';
          loc_speaker_r_inner.add ( cont_speaker_r_anim );

    const cont_speaker_r = new Object3D ();
          cont_speaker_r.name = 'cont_speaker_r';
          cont_speaker_r.add ( loc_speaker_r_inner );

    const cont_body_anim = new Object3D ();
          cont_body_anim.name = 'cont_body_anim';
          cont_body_anim.add ( mesh_body );
          cont_body_anim.add ( cont_speaker_l );
          cont_body_anim.add ( cont_speaker_r );

    const cont_body_inner = slots['body'];
          cont_body_inner.name = 'cont_body_inner';
          cont_body_inner.add ( cont_body_anim );

    const cont_body = new Object3D ();
          cont_body.name = 'cont_body';
          cont_body.add ( cont_body_inner );

    const inner = new Object3D ();
          inner.name = 'inner';
          inner.add ( cont_body );
          inner.add ( loc_head );

          inner.scale.set ( 0.6, 0.6, 0.6 );

    const root = new Object3D ();

          root.add ( inner );

    const parts = {
      mesh_body, mesh_head, mesh_light_casing, mesh_light_emissive, mesh_speaker_l, mesh_speaker_r,
      mesh_speaker_l_inner, mesh_speaker_r_inner,

      cont_speaker_l_anim, cont_speaker_r_anim, cont_speaker_l, cont_speaker_r,
      cont_head_anim, cont_face_anim,

      loc_light_inner, cont_light_anim, loc_head, loc_speaker_r_inner, loc_speaker_l_inner,
      cont_body_anim, cont_body_inner, cont_body,
      loc_light_ambient,

      inner, root
    };

    return {
      root: root,
      parts: parts,
    };
}
