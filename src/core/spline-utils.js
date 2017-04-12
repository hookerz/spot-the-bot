import { CatmullRomCurve3 } from 'three';
import { arrayOfArrayToArrayOfVector3, eulerDegToQuaternion } from './math-utils';

export function createSplinesFromJsonData(data) {

  let curves = [];
  let curveTs = [];
  let curveUs = [];
  let orientations = [];
  let delays = [];

  let arrayOfArrayOfVectors = [];
  for(let i = 0; i<data.points.length; i++)
  {

    arrayOfArrayOfVectors[i] = arrayOfArrayToArrayOfVector3(data.points[i]);
    curves.push(new CatmullRomCurve3(arrayOfArrayOfVectors[i]));
    curves[i].closed = false;
    delays.push(0);

  }

  for (let i = 0; i < data.eulers.length; i++) {

    orientations[i] = eulerDegToQuaternion(arrayOfArrayToArrayOfVector3(data.eulers[i]));

  }

  for (let i = 0; i < curves.length; i++) {

    curveUs[i] = [];
    curveTs[i] = [];
    let currentU = 0;
    for (let j = 0; j < curves[i].points.length; j++) {

      let dist = Infinity;
      while (true) {

        const pt = curves[i].getPointAt(currentU);
        dist = pt.distanceTo(curves[i].points[j]);

        if (currentU > 1 || dist <= 0.05)
          break;

        currentU = Math.min(1, (currentU + 0.001));

      }
      curveUs[i][j] = currentU;

    }

  }

  return {curves: curves, curveUs: curveUs, orientations: orientations};

}
