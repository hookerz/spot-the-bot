import { Object3D } from 'three';
import { GeoText } from '../../geo-text';
import { addScreenToInfoBot, textMat, materials} from './index';
import panelA from '../panel-a';

export function createWaitingForPlayersScreen(infoBot, gsm, font) {
  const screen = new Object3D();
  const networkInterface = gsm.networkInterface;

  const waitingForHelperText = GeoText('Waiting for a friend to join you.', font, {material: textMat, size: .2});
        waitingForHelperText.position.set(0, 0.7, 0);
        waitingForHelperText.name = "Waiting for Helper Text";

  const virtualRoomNumberLabel = GeoText("ROOM CODE", font, {material: textMat, size: 0.22});
        virtualRoomNumberLabel.position.set(0, 0.2 , 0);
        virtualRoomNumberLabel.name = "Room Code Label Text";

  const virtualRoomNumber = GeoText(networkInterface.room.toString(), font, {material: textMat, size:.6});
        virtualRoomNumber.position.set(0, -0.35, 0);
        virtualRoomNumber.name = "Room Number Text";

  const {root, parts, textRoot} = panelA(materials, 0);

  textRoot.add(waitingForHelperText);
  textRoot.add(virtualRoomNumberLabel);
  textRoot.add(virtualRoomNumber);
  screen.add(root);

  screen.name = "Waiting Screen";
  screen.userData.animationParts = parts;
  addScreenToInfoBot(infoBot, screen);

  return screen;
}

export default createWaitingForPlayersScreen;
