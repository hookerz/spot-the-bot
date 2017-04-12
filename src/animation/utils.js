import config from '../core/config';

export function killTimelines(timelines) {
    // first kill and drop reference to any running animations...
  if (timelines) {
    for (let i=0; i < timelines.length; i++) {
      if (timelines[i])
        timelines[i].kill();
    }
    timelines.length = 0;
  }
}

export function killRobotTimelines(robot) {
  killTimelines(robot.userData.currentTimelines);
  killTimelines(robot.userData.additiveTimelines);
  robot.userData.additiveTimelines = null;
  robot.userData.currentTimelines = null;
}


export function playAnimationNow(animFunc, robot, blocking=false, nextAnimFunc=undefined, onCompleteCallback=undefined, killAdditive=true) {
  if (!config.animations) {
    if (onCompleteCallback)
      onCompleteCallback();
    if (nextAnimFunc)
      playAnimationNow(nextAnimFunc, robot, false, undefined);
    return;
  }

  if (robot.userData.blockingAnimationPlaying && blocking === false)
    return false;

  robot.userData.nextAnimFunc = nextAnimFunc;
  robot.userData.blockingAnimationPlaying = blocking;

  // first kill and drop reference to any running animations...
  killTimelines(robot.userData.currentTimelines);
  killTimelines(robot.userData.additiveTimelines);

  function onComplete() {
    robot.userData.blockingAnimationPlaying = false;
    // cheesy way to chain animations for now...
    if (robot.userData.nextAnimFunc) {
      killTimelines(robot.userData.currentTimelines);
      killTimelines(robot.userData.additiveTimelines);
      playAnimationNow(nextAnimFunc, robot, false, undefined);
    }
    // if we don't have a nextAnimFunc, we let it keep playing in case its a looping animation

    if(onCompleteCallback)
      onCompleteCallback();
  }

  robot.userData.currentTimelines = animFunc(robot, robot.userData.animationBones, onComplete);
  robot.userData.animationDuration = robot.userData.currentTimelines[0].duration();
  return true;
}

export function playAdditiveAnimation(animFunc, robot, onCompleteCallback=undefined) {
  if (!config.animations) {
    if (onCompleteCallback)
      onCompleteCallback();
    return;
  }

  // first kill and drop reference to any running animations...
  killTimelines(robot.userData.additiveTimelines);

  function onComplete() {
    killTimelines(robot.userData.additiveTimelines);
    robot.userData.additiveTimelines = null;

    if(onCompleteCallback)
      onCompleteCallback();
  }

  robot.userData.additiveTimelines = animFunc(robot, robot.userData.animationBones, onComplete);
  return true;
}

export function playRandomAdditiveAnimation(animFuncs, robot, onCompleteCallback=undefined) {
  const animFunc = animFuncs[Math.floor(Math.random()*animFuncs.length)];
  playAdditiveAnimation(animFunc, robot, onCompleteCallback);
}

export function playRandomAnimationNow(animFuncs, robot, blocking=false, nextAnimFunc=undefined, onCompleteCallback=undefined, killAdditive=true) {
  const animFunc = animFuncs[Math.floor(Math.random()*animFuncs.length)];
  playAnimationNow(animFunc, robot, blocking, nextAnimFunc, onCompleteCallback, killAdditive);
}

export function playPartsAnimation(animFunc, object, onCompleteCallback){
  if (!config.animations) {
    if (onCompleteCallback)
      onCompleteCallback();
    return;
  }

  return animFunc(object, onCompleteCallback);
}
