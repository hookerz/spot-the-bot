import { MeshLambertMaterial, MeshBasicMaterial } from 'three';
import { playPartsAnimation } from '../../../animation/utils';
import waveAnim from '../../../animation/infoBot/wave';
import panelShowAnim from '../../../animation/ui/panel-a-show';
import panelHideAnim from '../../../animation/ui/panel-a-hide';
import panelAmbientAnim from '../../../animation/ui/ambient-start';


export const textColor = 0x0078e7;
export const buttonColor = 0x0078e7;
export const buttonTextColor = 0xffffff;
export const bgColor = 0xffffff;
export const bgBorderColor = 0x3487d1;

export const buttonTextSize = 0.5;
export const buttonZOffset = 0.65; // this is stupidly specific to brad's button model

export const textMat       = new MeshBasicMaterial({color: textColor});
export const buttonMat     = new MeshLambertMaterial({color: buttonColor});
export const buttonTextMat = new MeshBasicMaterial({color: buttonTextColor});
export const bgMat         = new MeshBasicMaterial({color: bgColor});
export const bgBorderMat   = new MeshBasicMaterial({color: bgBorderColor});

export const materials = {textMat, buttonMat, buttonTextMat, bgMat, bgBorderMat};

export function addScreenToInfoBot(infoBot, screen) {
  infoBot.userData.rotRoot.add(screen);
  playPartsAnimation(panelAmbientAnim, screen.userData.animationParts);
  screen.visible = false;
}

export function showScreen(infoBot, screen, world) {

  if (infoBot.userData.screenChanging) {
    // when the current animation is done, showScreen will be called with the most recent nextScreenCallArgs
    infoBot.userData.nextScreenCallArgs = [infoBot, screen, world];
    return;
  }

  if (infoBot.userData.currentScreen === screen)
    return;

  // first we need to hide the previous screen if there was one...
  const oldScreen = infoBot.userData.currentScreen;

  infoBot.userData.screenChanging = true;
  infoBot.userData.targetScreen = screen;
  infoBot.userData.screenChangeStartTime = world.currentTimeEvent;

  function showDone() {
    infoBot.userData.screenChanging = false;
    infoBot.userData.targetScreen = null;
    infoBot.userData.currentScreen = screen;
    if (infoBot.userData.nextScreenCallArgs) {
      const args = infoBot.userData.nextScreenCallArgs;
      infoBot.userData.nextScreenCallArgs = null;
      showScreen.apply(undefined, args);
    }
  }

  function showScreenLocal() {
    if (screen === null) {
      return;
    }
    screen.visible = true;
    playPartsAnimation(waveAnim, infoBot.userData.parts);

    if (screen.userData.animationParts) {
      playPartsAnimation(panelShowAnim, screen.userData.animationParts, showDone);
    } else {
      showDone();
    }
  }

  function hideScreen() {
    if (oldScreen === null) {
      showScreenLocal();
      return;
    }

    oldScreen.visible = true;
    if (oldScreen.userData.animationParts) {
      playPartsAnimation(panelHideAnim, oldScreen.userData.animationParts, () => {
        oldScreen.visible = false;
        showScreenLocal();
      });
    } else {
      // snap off
      oldScreen.visible = false;
      showScreenLocal();
    }
  }

  hideScreen();
}
