import { Object3D, Mesh } from 'three';
import loadedAssets from '../assets';

export default function ( materials, buttonMeshes) {

  buttonMeshes = buttonMeshes || [];

  const mesh_front = new Mesh ( loadedAssets.get('panel-a-front').children[0].geometry, materials.bgMat );
        mesh_front.name = 'mesh_front';
  const mesh_back = new Mesh ( loadedAssets.get('panel-a-back').children[0].geometry, materials.bgBorderMat);
        mesh_back.name = 'mesh_back';
        mesh_back.scale.set ( 1.02, 1.02, 1.02 );

  const cont_text_root = new Object3D();
        cont_text_root.name = 'cont_text';
        cont_text_root.position.set(0,3.5,0.2); // hacky numbers
        cont_text_root.scale.set(2.5,2.5,2.5); // hacky numbers


  const scale = 0.4;

  const cont_panels_inner = new Object3D ();
        cont_panels_inner.name = 'cont_panels_inner';
        cont_panels_inner.add ( mesh_front );
        cont_panels_inner.add ( mesh_back );
        cont_panels_inner.position.y = 3.6;

  const cont_panels_anim = new Object3D ();
        cont_panels_anim.name = 'cont_panels_anim';
        cont_panels_anim.add ( cont_panels_inner, cont_text_root );
        //cont_panels_anim.add ( new AxisHelper ( 1.0 ) );

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
        //root.add ( new AxisHelper ( 1.0 ) );


  const buttonsAnim = [];
  const buttonsGeo = [];

  if (buttonMeshes.length === 2) {
    //const mesh_button_l = new Mesh(loadedAssets.get('panel-button').children[0].geometry, materials.buttonMat);
    //mesh_button_l.name = 'mesh_button_l';

    const cont_button_l_anim = new Object3D();
    cont_button_l_anim.name = 'cont_button_l_anim';
    cont_button_l_anim.add(buttonMeshes[0]);


    const cont_button_l_layout = new Object3D();
    cont_button_l_layout.name = 'cont_button_l_layout';
    cont_button_l_layout.add(cont_button_l_anim);
    cont_button_l_layout.position.y = 1.0;
    cont_button_l_layout.position.x = -2.4;
    cont_button_l_layout.rotation.z = 0.04;
    cont_button_l_layout.scale.set(0.8, 0.8, 1.0);

    //const mesh_button_r = new Mesh(loadedAssets.get('panel-button').children[0].geometry, materials.buttonMat);
    //mesh_button_r.name = 'mesh_button_r';

    const cont_button_r_anim = new Object3D();
    cont_button_r_anim.name = 'cont_button_r_anim';
    cont_button_r_anim.add(buttonMeshes[1]);

    const cont_button_r_layout = new Object3D();
    cont_button_r_layout.name = 'cont_button_r_layout';
    cont_button_r_layout.add(cont_button_r_anim);
    cont_button_r_layout.position.y = 1.0;
    cont_button_r_layout.position.x = 2.4;
    cont_button_r_layout.rotation.z = -0.04;
    cont_button_r_layout.scale.set(0.8, 0.8, 1.0);

    buttonsAnim.push(cont_button_l_anim, cont_button_r_anim);
    buttonsGeo.push(...buttonMeshes);

    cont_anim.add ( cont_button_l_layout );
    cont_anim.add ( cont_button_r_layout );
  }
  else if (buttonMeshes.length === 1){
    //const mesh_button_c = new Mesh ( loadedAssets.get('panel-button').children[0].geometry, materials.buttonMat );
    //mesh_button_c.name = 'mesh_button_c';

    const cont_button_c_anim = new Object3D ();
    cont_button_c_anim.name = 'cont_button_c_anim';
    cont_button_c_anim.add ( buttonMeshes[0] );

    const cont_button_c_layout = new Object3D ();
    cont_button_c_layout.name = 'cont_button_c_layout';
    cont_button_c_layout.add ( cont_button_c_anim );
    cont_button_c_layout.position.y = 1.0;
    //cont_button_c_layout.rotation.z = -0.04;
    cont_button_c_layout.scale.set ( 0.8, 0.8, 1.0 );

    buttonsAnim.push(cont_button_c_anim);
    buttonsGeo.push(...buttonMeshes);

    cont_anim.add ( cont_button_c_layout );
  }

  const parts = {
    mesh_front, mesh_back,
    cont_panels_anim,
    cont_inner,
    cont_anim,
    cont_root,
    buttons: buttonsAnim,
  };

  return {
    root: cont_root,
    parts: parts,
    textRoot: cont_text_root,
    buttonsGeo: buttonsGeo,
  }
}
