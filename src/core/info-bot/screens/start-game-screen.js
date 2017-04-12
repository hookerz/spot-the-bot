import { Object3D, Mesh } from 'three';
import { GeoText } from '../../geo-text';
import { VRButton } from '../../vr-button';
import { addScreenToInfoBot, textMat, buttonMat, buttonTextMat, buttonTextSize, materials, buttonZOffset} from './index';
import panelA from '../panel-a';
import assets from '../../assets';


export function createStartGameScreen(infoBot, gsm, font, gazeSelector) {
  const screen = new Object3D();

  const startGameText = GeoText('START', font, {material: buttonTextMat, size: buttonTextSize});
        startGameText.name = "Start Game Text";

  const buttonMesh = new Mesh(assets.get("panel-button").children[0].geometry, buttonMat);

  const startButton = VRButton(gazeSelector, () => gsm.startGame(), {textMesh: startGameText, textOffset: buttonZOffset, buttonMesh: buttonMesh});

  const {root, parts, textRoot} = panelA(materials, [startButton]);

  const msgSize = 0.25;

  const informerText1 = GeoText('Your friend joined!', font, {material: textMat, size: msgSize});
        informerText1.position.set(0, 0.6, 0);

  const informerText3 = GeoText("Hit start when you're ready to spot some bots.", font, {material: textMat, size: 0.15});
        informerText3.position.set(0, 0.1 , 0);

  textRoot.add(informerText1);
  //textRoot.add(informerText2);
  textRoot.add(informerText3);

  screen.add(root);

  screen.name = "Start Game Screen";
  screen.userData.animationParts = parts;
  addScreenToInfoBot(infoBot, screen);

  return screen;
}

export default createStartGameScreen;
