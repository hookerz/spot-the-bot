import { Object3D, Mesh } from 'three';
import { GeoText } from '../../geo-text';
import { VRButton } from '../../vr-button';
import { NumberDisplay } from '../../timer';
import { addScreenToInfoBot, textMat, buttonMat, buttonTextMat, buttonTextSize, materials, buttonZOffset} from './index';
import panelA from '../panel-a';
import assets from '../../assets';

export function createGameOverScreen(infoBot, gsm, font, digitsGeometry, gazeSelector) {
  const screen = new Object3D();

  const bMesh = assets.get("panel-button").children[0];

  const playAgainText = GeoText('PLAY AGAIN', font, {material: buttonTextMat, size: buttonTextSize});
  const playAgainButtonMesh = new Mesh(bMesh.geometry, buttonMat);
  const playAgainButton = VRButton(gazeSelector, () => gsm.startGame(), {textMesh: playAgainText, buttonMesh: playAgainButtonMesh, textOffset: buttonZOffset});

  const mainMenuText = GeoText('EXIT VR', font, {material: buttonTextMat, size: buttonTextSize});
  const mainMenuButtonMesh = new Mesh(bMesh.geometry, buttonMat);
  const mainMenuButton = VRButton(gazeSelector, () => gsm.exitToMainMenu(), {textMesh: mainMenuText, buttonMesh: mainMenuButtonMesh, textOffset: buttonZOffset});


  const {root, parts, textRoot} = panelA(materials, [playAgainButton, mainMenuButton]);

  const msgSize = 0.2;
  const youFoundText = GeoText('You Found', font, {material: textMat, size: msgSize});
  youFoundText.position.set(0, 1.0, 0);

  const botCountDisplay = NumberDisplay(font, digitsGeometry, {material: textMat, size: .2, pad: false});
  botCountDisplay.name = "Info Bot Catch Count";
  botCountDisplay.position.set(0, 0, 0);
  botCountDisplay.scale.set(1, 1, 1); // fix up number dispay to support font size that matches GeoText

  const robotsTextPlural = GeoText('Bots!', font, {material: textMat, size: msgSize});
  robotsTextPlural.position.set(0, -0.3, 0);

  const robotsTextSingular = GeoText('Bot!', font, {material: textMat, size: msgSize});
  robotsTextSingular.position.set(0, -0.3, 0);


  textRoot.add(youFoundText);
  textRoot.add(botCountDisplay);
  textRoot.add(robotsTextPlural);
  textRoot.add(robotsTextSingular);

  screen.add(root);

  // this is pretty lame
  screen.userData.setCatchCount = function (number) {
    botCountDisplay.userData.setNumber(number);
    const one = number === 1;
    robotsTextSingular.visible = one;
    robotsTextPlural.visible = !one;
  };

  screen.name = "Game Over Screen";
  screen.userData.animationParts = parts;
  addScreenToInfoBot(infoBot, screen);

  return screen;
}
