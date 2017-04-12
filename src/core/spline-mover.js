/**
 * Animates objects across multiple splines
 *
 * @param curves - An array with Curves.
 * @param objects - The root Object3D for the procedural objects.
 * @param delaysAfterCurve - How long (in sec) should objects wait after completing the curve. This is an array that
 *                          defines the delay per curve. This can be used for the portals. No delays, if undefined.
 * @param forward - Array specifying whether to traverse the curve in the forward direction (set to 1 if yes, or 0 otherwise).
 * @param options - Options for specifying speed and orientations.
 */
export function SplineMover(curves, objects, delaysAfterCurve, forward, gsm, options) {

  options = Object.assign({
    orientations: undefined,
    orientationLerpFactor: 0.05,
    curveUs: undefined,
  }, options);

  const ts = [];
  const tInc = 1.0 / objects.children.length;
  for (let i = 0; i < objects.children.length; i++) {
    ts[i] = tInc * i;
    objects.children[i].up.set(0, 1, 0);
  }

  let objPreviousCurve = [];
  let objDelays = [];
  for (let i = 0; i < objects.children.length; i++) {
    objPreviousCurve[i] = 0;
    objDelays[i] = 0;
  }

  let totalLength = 0;
  for (let i = 0; i < curves.length; i++) {
    totalLength += curves[i].getLength();
  }
  let cumulativeLength = 0;
  let curveCumulativeLength = [];
  let curveLength = [];
  for (let i = 0; i < curves.length; i++) {
    curveLength.push(curves[i].getLength() / totalLength);
    curveCumulativeLength.push(cumulativeLength + curveLength[i]);
    cumulativeLength = curveCumulativeLength[i];
  }

  const clamp = function (v) {
    return Math.min(1, Math.max(0, v));
  };

  let isPaused = false;
  const pause = function() {

    isPaused = true;

  };
  const play = function() {

    isPaused = false;

  };

  const update = function (event, checkDelays = true) {

    if(isPaused)
      return;

    for (let i = 0; i < objects.children.length; i++) {

      const deltaT = gsm.levelContext.difficulty.trackSpeed * event.dt;
      const t = (ts[i] + deltaT) % 1.0;

      let curveIdx = 0;
      for (let j = 0; j < curves.length; j++) {
        if (t <= curveCumulativeLength[j]) {
          curveIdx = j;
          break;
        }
      }

      if (checkDelays && delaysAfterCurve && delaysAfterCurve[objPreviousCurve[i]] > 0 && curveIdx != objPreviousCurve[i]) {
        objDelays[i] += event.dt;
        if (objDelays[i] < delaysAfterCurve[objPreviousCurve[i]]) {
          continue;
        }
      }

      ts[i] = t;
      objPreviousCurve[i] = curveIdx;
      objDelays[i] = 0;

      let normalizedT = clamp((ts[i] - (curveCumulativeLength[curveIdx] - curveLength[curveIdx])) / curveLength[curveIdx]);
      let lookAheadT = clamp((normalizedT + deltaT) % 1.0);
      if (forward && !forward[curveIdx]) {
        normalizedT = 1 - normalizedT;
        lookAheadT = 1 - lookAheadT;
      }

      let point = null;
      let lookAheadPoint = null;

      point = curves[curveIdx].getPointAt(normalizedT);
      objects.children[i].position.set(point.x, point.y, point.z);
      lookAheadPoint = curves[curveIdx].getPointAt(lookAheadT);
      if(!options.orientations)
        objects.children[i].lookAt(lookAheadPoint);
      else
      {
        let orientationIndex = 0;
        for(let j = 0; j < options.curveUs[curveIdx].length - 1; j++) {

          if(normalizedT > options.curveUs[curveIdx][j] && normalizedT < options.curveUs[curveIdx][j + 1]){

            orientationIndex = j;
            break;

          }

        }

        // if(orientationIndex == 0){
        //   const q = options.orientations[curveIdx][orientationIndex];
        //   objects.children[i].quaternion.set(q.x, q.y, q.z, q.w);
        // }
        // else
        //   objects.children[i].quaternion.slerp(options.orientations[curveIdx][orientationIndex], options.orientationLerpFactor);
        const startQ = options.orientations[curveIdx][orientationIndex];
        const endQ = options.orientations[curveIdx][orientationIndex + 1];
        objects.children[i].quaternion.set(startQ.x, startQ.y, startQ.z, startQ.w);
        const t = (normalizedT - options.curveUs[curveIdx][orientationIndex]) /
          (options.curveUs[curveIdx][orientationIndex + 1] - options.curveUs[curveIdx][orientationIndex]);
        objects.children[i].quaternion.slerp(endQ, clamp(t));
      }
    }
  };

  update({dt: 0}, false);

  return {update, pause, play};
}


