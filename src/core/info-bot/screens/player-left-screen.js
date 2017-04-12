import { Object3D, Mesh } from 'three';
import { GeoText } from '../../geo-text';
import { VRButton } from '../../vr-button';
import { addScreenToInfoBot, textMat, buttonMat, buttonTextMat, buttonTextSize, materials, buttonZOffset} from './index';
import panelA from '../panel-a';
import assets from '../../assets';


export function createPlayerLeftScreen(infoBot, gsm, font, gazeSelector) {
  const screen = new Object3D();

  const mainMenuText = GeoText('EXIT VR', font, {material: buttonTextMat, size: buttonTextSize});
        mainMenuText.name = "Main Menu Text";

  const buttonMesh = new Mesh(assets.get("panel-button").children[0].geometry, buttonMat);

  const mainMenuButton = VRButton(gazeSelector, () => gsm.exitToMainMenu(), {textMesh: mainMenuText, textOffset: buttonZOffset, buttonMesh: buttonMesh});

  const {root, parts, textRoot} = panelA(materials, [mainMenuButton]);

  const leftText1 = GeoText('Your friend left the room.', font, {material: textMat, size: 0.25});
        leftText1.position.set(0, 0.6, 0);

  const leftText2 = GeoText('Start a new game to play again.', font, {material: textMat, size: 0.20});
        leftText2.position.set(0, 0.1, 0);

  textRoot.add(leftText1);
  textRoot.add(leftText2);

  screen.add(root);

  screen.name = "Player Left Screen";
  screen.userData.animationParts = parts;
  addScreenToInfoBot(infoBot, screen);

  return screen;
}

export default createPlayerLeftScreen;
