import { EventDispatcher } from 'three';

export const visibility = new EventDispatcher();

function addVisibilityListener() {

  let prop, event;

  if (typeof document.hidden !== 'undefined') {
    prop = 'hidden';
    event = 'visibilitychange';
  } else if (typeof document.msHidden !== 'undefined') {
    prop = 'msHidden';
    event = 'msvisibilitychange';
  } else if (typeof document.webkitHidden !== 'undefined') {
    prop = 'webkitHidden';
    event = 'webkitvisibilitychange';
  } else {
    return console.warning('unable to find visibility event');
  }

  document.addEventListener(event, () => {
    const hidden = !!document[prop];
    visibility.dispatchEvent({ type: 'visibilitychange', hidden });
  });

}

addVisibilityListener();
