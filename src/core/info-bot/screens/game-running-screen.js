import { Object3D } from 'three';
import { NumberDisplay, Timer, TimeDisplay} from '../../timer';
import { GeoText } from '../../geo-text';
import { addScreenToInfoBot, textMat, materials } from './index';
import panelB from '../panel-b';

export function createGameRunningScreen(infoBot, gsm, font, digitsGeometry) {
  const screen = new Object3D();

  const {root, parts, nutIcon, hourglassIcon, attachTo} = panelB(materials, true);

  const seperation = 3.0;
  const foundCenter = new Object3D();
  const timerCenter = new Object3D();
  foundCenter.position.set(-seperation, 0, 0.15);
  timerCenter.position.set( seperation, 0, 0.15);
  attachTo.add(foundCenter);
  attachTo.add(timerCenter);

  const numberScale = 2.0;
  const headerScale = 0.5;
  /*
  const timeText = new GeoText("TIME", font, {material: textMat});
  const foundText = new GeoText("FOUND", font, {material: textMat});
  timeText.scale.set(headerScale, headerScale, headerScale);
  foundText.scale.set(headerScale, headerScale, headerScale);
  timeText.position.set(0, 1.0, 0);
  foundText.position.set(0, 1.0, 0);

  foundCenter.add(foundText);
  timerCenter.add(timeText);
  */

  nutIcon.position.set(0.1, 1.2, 0);
  hourglassIcon.position.set(0, 1.2, 0);
  foundCenter.add(nutIcon);
  timerCenter.add(hourglassIcon);

  //const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({color: 0xff0000}));
  //attachTo.add(s);

  const timeDisplay = TimeDisplay(font, digitsGeometry, {material: textMat});
  const timeDisplayObj = timeDisplay.object;
  timeDisplayObj.name = "Time Left Display";
  timeDisplayObj.scale.set(numberScale, numberScale, numberScale);
  timeDisplayObj.position.set(-0.6, -1.65, 0);
  timerCenter.add(timeDisplayObj);


  const botCountDisplay = NumberDisplay(font, digitsGeometry, {material: textMat, pad: false});
  botCountDisplay.name = "Info Bot Catch Count";
  botCountDisplay.position.set(0, -1.65, 0);
  botCountDisplay.scale.set(numberScale, numberScale, numberScale);
  foundCenter.add(botCountDisplay);

  screen.add(root);

  infoBot.userData.botCountDisplay = botCountDisplay;

  screen.name = "Game Running Screen";
  screen.userData.animationParts = parts;
  screen.userData.timeDisplay = timeDisplay;

  addScreenToInfoBot(infoBot, screen);

  return screen;
}
