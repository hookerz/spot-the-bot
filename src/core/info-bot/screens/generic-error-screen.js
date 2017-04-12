import { Object3D, Mesh } from 'three';
import { GeoText } from '../../geo-text';
import { VRButton } from '../../vr-button';
import { addScreenToInfoBot, textMat, buttonMat, buttonTextMat, buttonTextSize, materials, buttonZOffset} from './index';
import panelA from '../panel-a';
import assets from '../../assets';


export function createGenericErrorScreen(infoBot, gsm, font, gazeSelector) {
  const screen = new Object3D();

  const mainMenuText = GeoText('EXIT VR', font, {material: buttonTextMat, size: buttonTextSize});
        mainMenuText.name = "Main Menu Text";

  const buttonMesh = new Mesh(assets.get("panel-button").children[0].geometry, buttonMat);

  const mainMenuButton = VRButton(gazeSelector, () => gsm.exitToMainMenu(), {textMesh: mainMenuText, textOffset: buttonZOffset, buttonMesh: buttonMesh});

  const {root, parts, textRoot} = panelA(materials, [mainMenuButton]);

  const errorText1 = GeoText('Oops! An error has occurred.', font, {material: textMat, size: 0.25});
        errorText1.position.set(0, 0.6, 0);

  const errorText2 = GeoText('Please try again.', font, {material: textMat, size: 0.20});
        errorText2.position.set(0, 0.1, 0);

  textRoot.add(errorText1);
  textRoot.add(errorText2);

  screen.add(root);

  screen.name = "Generic Error Screen";
  screen.userData.animationParts = parts;
  addScreenToInfoBot(infoBot, screen);

  return screen;
}

export default createGenericErrorScreen;
