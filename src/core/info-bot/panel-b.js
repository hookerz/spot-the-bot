import {Object3D, Mesh} from 'three';
import loadedAssets from '../assets';

export default function ( materials, icons=true ) {

  const mesh_front = new Mesh ( loadedAssets.get('panel-b-front').children[0].geometry, materials.bgMat );
        mesh_front.name = 'mesh_front';

  const mesh_back = new Mesh ( loadedAssets.get('panel-b-back').children[0].geometry, materials.bgBorderMat);
        mesh_back.name = 'mesh_back';
        mesh_back.scale.set ( 1.02, 1.02, 1.02 );

  const scale = 0.4;

  const cont_panels_inner = new Object3D ();
        cont_panels_inner.name = 'cont_panels_inner';
        cont_panels_inner.add ( mesh_front );
        cont_panels_inner.add ( mesh_back );
        cont_panels_inner.position.y = 3.6;

  let mesh_icon_nut = null;
  let mesh_icon_hourglass = null;
  if (icons) {
    mesh_icon_nut = new Mesh(loadedAssets.get('score-nut').children[0].geometry, materials.textMat);
    mesh_icon_nut.name = 'score-nut';
    mesh_icon_nut.scale.set(1.5, 1.5, 1.5);
    //mesh_icon_nut.position.set(0.0, 0, 0.1);
    //cont_panels_inner.add ( mesh_icon_nut );

    mesh_icon_hourglass = new Mesh(loadedAssets.get('score-hourglass').children[0].geometry, materials.textMat);
    mesh_icon_hourglass.name = 'score-hourglass';
    mesh_icon_hourglass.scale.set(1.5, 1.5, 1.5);
    //mesh_icon_hourglass.position.set(0.0, 0, 0.1);
    //cont_panels_inner.add ( mesh_icon_hourglass );
  }

  const cont_panels_anim = new Object3D ();
        cont_panels_anim.name = 'cont_panels_anim';
        cont_panels_anim.add ( cont_panels_inner );

  const cont_anim = new Object3D ();
        cont_anim.name = 'cont_anim';
        cont_anim.add ( cont_panels_anim );


  const cont_inner = new Object3D ();
        cont_inner.name = 'cont_inner';
        cont_inner.scale.set ( scale, scale, scale );
        cont_inner.add ( cont_anim );
        cont_inner.position.y = 0.6;

  const cont_root = new Object3D ();
        cont_root.name = 'cont_root';
        cont_root.add ( cont_inner );

  const parts = {
    mesh_front, mesh_back,
    cont_panels_anim,
    cont_inner,
    cont_anim,
    cont_root,
    buttons: [],
  };

  return {
    root: cont_root,
    parts: parts,
    nutIcon: mesh_icon_nut,
    hourglassIcon: mesh_icon_hourglass,
    attachTo: cont_panels_inner,
  }
}
