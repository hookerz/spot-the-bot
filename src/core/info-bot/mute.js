import {CylinderBufferGeometry, Object3D, Mesh} from 'three';
import loadedAssets from '../assets';

const DEGTORAD = Math.PI / 180.0;

export default function (materials) {

  const s0 = 0.4;
  const s1 = 0.36;
  const s2 = 0.3;
  const segs = 32;

  const mesh_back = new Mesh ( new CylinderBufferGeometry ( s0, s0, 0.01, segs, 1 ), materials.bgBorderMat );
        mesh_back.name = "mute_back";
        mesh_back.rotation.x = DEGTORAD * 90;

  const mesh_front = new Mesh ( new CylinderBufferGeometry ( s1, s1, 0.01, segs, 1 ), materials.bgMat );
        mesh_front.name = "mute_front;";
        mesh_front.position.z = 0.02;
        mesh_front.rotation.x = DEGTORAD * 90;

  const mesh_btn = new Mesh (new CylinderBufferGeometry ( s2, s2, 0.1, segs, 1 ), materials.buttonMat );
        mesh_btn.name = "mute_btn";
        mesh_btn.rotation.x = DEGTORAD * 90;

  const scale_icon = 0.35;

  const mesh_icon_base = new Mesh ( loadedAssets.get('sound-on').children[0].geometry, materials.buttonTextMat );
        mesh_icon_base.name = "mesh_icon_base";
        mesh_icon_base.position.z = 0.04;
        mesh_icon_base.scale.set ( scale_icon, scale_icon, scale_icon );

  const mesh_icon_base_off = new Mesh ( loadedAssets.get('sound-off').children[0].geometry, materials.buttonTextMat );
        mesh_icon_base_off.name = "mesh_icon_base_off";
        mesh_icon_base_off.position.z = 0.04;
        mesh_icon_base_off.scale.set ( scale_icon, scale_icon, scale_icon );

  const cont_btn = new Object3D ();
        cont_btn.name = "cont_btn";
        cont_btn.position.z = 0.04;
        cont_btn.add ( mesh_btn );
        cont_btn.add ( mesh_icon_base );
        cont_btn.add ( mesh_icon_base_off );

  const cont_inner = new Object3D ();
        cont_inner.name = "cont_inner";
        cont_inner.add ( mesh_back );
        cont_inner.add ( mesh_front );
        cont_inner.add ( cont_btn );

  const root = new Object3D ();
        root.name = "mute_root";
        root.add ( cont_inner );

  return {
    root,
    muteOffMesh: mesh_icon_base_off,
    buttonMesh: mesh_btn,
  }

}
