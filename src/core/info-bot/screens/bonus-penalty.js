import { MeshBasicMaterial, Object3D, Mesh} from 'three';
import { buttonTextMat } from './index';
import { NumberDisplay } from '../../timer';
import assets from '../../assets';


export const TimeChangeType = Object.freeze({
  bonus: 'TimeChangeType.bonus',
  penalty: 'TimeChangeType.penalty',
});


const assetKeys = {
  [TimeChangeType.bonus]: 'icon-bonus',
  [TimeChangeType.penalty]: 'icon-penalty',
};

const bgMaterials = {
  [TimeChangeType.bonus]: new MeshBasicMaterial( {color: 'rgb(102, 196, 87)'} ),
  [TimeChangeType.penalty]: new MeshBasicMaterial( {color: 'rgb(255, 59, 59)'} ),
};



export function createBonusPenaltyPopup(amount, font, digitGeometry) {
  let type = amount > 0 ? TimeChangeType.bonus : TimeChangeType.penalty;
  amount = Math.abs(amount);


  const root = new Object3D();
  root.name = type;
  const sharedScale = new Object3D(); // so the world see the scale 1 for animation purposes...
  root.add(sharedScale);
  const scale = 0.35;
  sharedScale.scale.set(scale, scale, scale);

  const iconGeo = assets.get(assetKeys[type]).children[0].geometry;
  const panelGeo = assets.get('panel-c').children[0].geometry;
  const panelMat = bgMaterials[type];

  const numbersMesh = NumberDisplay(font, digitGeometry, {number: amount, pad: false, places:2, material: buttonTextMat});
   const iconMesh = new Mesh(iconGeo, buttonTextMat);
  iconMesh.name = "Icon mesh";
  const panelMesh = new Mesh(panelGeo, panelMat);
  panelMesh.name = "Panel mesh";

  sharedScale.add(iconMesh);
  sharedScale.add(panelMesh);
  sharedScale.add(numbersMesh);

  root.userData.numberDisplay = numbersMesh;
  root.userData.setAmount = function (value) {
    if (Math.abs(value) > 9) {
      iconMesh.position.set(-0.6, 0, 0);
    } else {
      iconMesh.position.set(-0.45, 0, 0);
    }
    numbersMesh.position.set(0.5, -0.4, 0.1);
    numbersMesh.userData.setNumber(value);
  };
  root.userData.setAmount(amount);
  // hide to start
  root.visible = false;

  return root;
}

