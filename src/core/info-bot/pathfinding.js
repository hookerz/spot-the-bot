import { Vector3 } from 'three';
import config from '../config';
import Debug from 'debug';

const debug = Debug('app:pathfinder');

const angleStep = Math.PI * 2.0 / 10.0;
export const outerPoints = [
  {position: new Vector3(Math.sin(angleStep * 0.2), 0, -Math.cos(angleStep * 0.2)), connections: [], angle: angleStep * 0.2, ring: 'outer', index: 0},
  {position: new Vector3(Math.sin(angleStep * 1.6), 0, -Math.cos(angleStep * 1.6)), connections: [], angle: angleStep * 1.6, ring: 'outer', index: 1},
  {position: new Vector3(Math.sin(angleStep * 2.3), 0, -Math.cos(angleStep * 2.3)), connections: [], angle: angleStep * 2.3, ring: 'outer', index: 2},
  {position: new Vector3(Math.sin(angleStep * 3.1), 0, -Math.cos(angleStep * 3.1)), connections: [], angle: angleStep * 3.1, ring: 'outer', index: 3},
  {position: new Vector3(Math.sin(angleStep * 4.3), 0, -Math.cos(angleStep * 4.3)), connections: [], angle: angleStep * 4.3, ring: 'outer', index: 4},
  {position: new Vector3(Math.sin(angleStep * 5.0), 0, -Math.cos(angleStep * 5.0)), connections: [], angle: angleStep * 5.0, ring: 'outer', index: 5},
  {position: new Vector3(Math.sin(angleStep * 5.7), 0, -Math.cos(angleStep * 5.7)), connections: [], angle: angleStep * 5.7, ring: 'outer', index: 6},
  {position: new Vector3(Math.sin(angleStep * 7.0), 0, -Math.cos(angleStep * 7.0)), connections: [], angle: angleStep * 7.0, ring: 'outer', index: 7},
  {position: new Vector3(Math.sin(angleStep * 8.0), 0, -Math.cos(angleStep * 8.0)), connections: [], angle: angleStep * 8.0, ring: 'outer', index: 8},
  {position: new Vector3(Math.sin(angleStep * 9.3), 0, -Math.cos(angleStep * 9.3)), connections: [], angle: angleStep * 9.3, ring: 'outer', index: 9},
];

export const innerPoints = [
  {position: new Vector3(Math.sin(angleStep * 0.0), 0, -Math.cos(angleStep * 0.0)), connections: [], angle: angleStep * 0.0, ring: 'inner', index: 0},
  {position: new Vector3(Math.sin(angleStep * 2.0), 0, -Math.cos(angleStep * 2.0)), connections: [], angle: angleStep * 2.0, ring: 'inner', index: 1},
  {position: new Vector3(Math.sin(angleStep * 4.0), 0, -Math.cos(angleStep * 4.0)), connections: [], angle: angleStep * 4.0, ring: 'inner', index: 2},
  {position: new Vector3(Math.sin(angleStep * 6.0), 0, -Math.cos(angleStep * 6.0)), connections: [], angle: angleStep * 6.0, ring: 'inner', index: 3},
  {position: new Vector3(Math.sin(angleStep * 8.0), 0, -Math.cos(angleStep * 8.0)), connections: [], angle: angleStep * 8.0, ring: 'inner', index: 4},
];

export const rings = {
  'inner': innerPoints,
  'outer': outerPoints,
};

export const allPoints = outerPoints.concat(innerPoints);

// building the graph really manually here...
outerPoints[0].connections.push(outerPoints[1], outerPoints[9], innerPoints[0]);
outerPoints[1].connections.push(outerPoints[2], outerPoints[0], innerPoints[1]);
outerPoints[2].connections.push(outerPoints[3], outerPoints[1], innerPoints[1]);
outerPoints[3].connections.push(outerPoints[4], outerPoints[2], innerPoints[1]);
outerPoints[4].connections.push(outerPoints[5], outerPoints[3]);
outerPoints[5].connections.push(outerPoints[6], outerPoints[4]);
outerPoints[6].connections.push(outerPoints[7], outerPoints[5], innerPoints[3]);
outerPoints[7].connections.push(outerPoints[8], outerPoints[6], innerPoints[4]);
outerPoints[8].connections.push(outerPoints[9], outerPoints[7], innerPoints[4]);
outerPoints[9].connections.push(outerPoints[0], outerPoints[8], innerPoints[0]);

innerPoints[0].connections.push(innerPoints[1], innerPoints[4], outerPoints[0]);
innerPoints[1].connections.push(innerPoints[2], innerPoints[0], outerPoints[2]);
innerPoints[2].connections.push(innerPoints[3], innerPoints[1]);
innerPoints[3].connections.push(innerPoints[4], innerPoints[2], outerPoints[6]);
innerPoints[4].connections.push(innerPoints[0], innerPoints[3], outerPoints[8]);

export function applyRadius(pts, radius) {
  for (let i=0; i < pts.length; i++) {
    pts[i].position.multiplyScalar(radius);
  }
}


// some pre-allocated arrays for simple cases
const single = new Array(1);
const double = new Array(2);
// these are used for the left/right ring searching and tracking
const forwardPath = new Array(16);
const backwardPath = new Array(16);
const dirPaths = [forwardPath, backwardPath];

export function ringSearch(goal, curPosition) {
  // ASSUME: dirPaths[i][-1] is the start point for the search

  const goalIsFunc = typeof goal === "function";
  while (true) {
    // NOTE: purposefully only check the first two connections (this is really specific to our ring setup)
    let foundCount = 0;
    let foundIndex = -1;
    for (let i=0; i < 2; i++) {
      const path = dirPaths[i];
      const next = path[path.length - 1].connections[i];
      path.push(next);

      if (goalIsFunc) {
        if (goal(next)) {
          foundCount += 1;
          foundIndex = i;
        }
      } else {
        if (goal === next) {
          foundCount += 1;
          foundIndex = i;
        }
      }
    }

    if (foundCount == 1)
        return foundIndex;

    // both directions ended in the goal node with the same number of steps
    // tie break by path distance form current bot position
    // this prevents memorizing this function, so we might want to consider a way return both paths
    if (foundCount == 2) {
      const d0 = pathDistance(curPosition, dirPaths[0]);
      const d1 = pathDistance(curPosition, dirPaths[1]);
      if (d0 < d1)
        return 0;
      else
        return 1;
    }
  }
}

function copyDirPath(from) {
  const to = from == 0 ? 1 : 0;
  dirPaths[to].length = dirPaths[from].length;
  for (let x=0; x < dirPaths[from].length; x++) {
    dirPaths[to][x] = dirPaths[from][x];
  }
}

export function isTransitionPoint(pt) {
  return pt.connections.length === 3;
}

export function dumpPath(path) {
  let p = "[";
  for (let i=0; i < path.length; i++) {
    p += path[i].ring + "(" + path[i].index + ") -> ";
  }
  p += "]";
  if (config.log) debug(p);
}

export function pathDistance(curPosition, path) {
  let dist = curPosition.distanceTo(path[0]);
  for (let i=1; i < path.length; i++) {
    dist += path[i].position.distanceTo(path[i-1].position);
  }
  return dist;
}


export function pathToGoal(start, goal, curPosition) {
  //debug("pathToGoal called:", start.index, start.ring, goal.index, goal.ring);

  if (start === goal) {
    single[0] = start;
    return single;
  }

  if (start.connections.indexOf(goal) != -1) {
    double[0] = start;
    double[1] = goal;
    //dumpPath(double);
    return double;
  }

  // using dirPaths as a way to avoid allocations...but it makes things slightly more complicated
  dirPaths[0].length = 0;
  dirPaths[1].length = 0;
  dirPaths[0].push(start);
  dirPaths[1].push(start);

  if (start.ring != goal.ring) {
    //debug("goal is on a different ring");
    let newRingPt = null;
    if (isTransitionPoint(start)) {
      const path = dirPaths[0];
      newRingPt = path[path.length - 1].connections[2];
      dirPaths[0].push(newRingPt); // add transition
      dirPaths[1].push(newRingPt); // add transition
    } else {
      // find the closest transition point to get to other ring
      const index = ringSearch(isTransitionPoint, curPosition);
      copyDirPath(index); // put the same path in both dirPaths arrays (trying to avoid allocations)...
      const path = dirPaths[index];
      newRingPt = path[path.length - 1].connections[2];
      dirPaths[0].push(newRingPt); // add transition
      dirPaths[1].push(newRingPt); // add transition
    }
    if (newRingPt === goal) {
      return dirPaths[0];
    }
  }

  const index = ringSearch(goal, curPosition);
  return dirPaths[index];
}

// DEBUG STUFF
/*
window.pathToGoal = pathToGoal;
window.outerPoints = outerPoints;
window.innerPoints = innerPoints;
window.dumpPath = dumpPath;
window.testAllPaths = function () {
  for (let i=0; i < allPoints.length; i++) {
    for (let j=i; j < allPoints.length; j++) {
      console.debug(pathToGoal(allPoints[i], allPoints[j], allPoints[i].position));
      console.debug(pathToGoal(allPoints[j], allPoints[i], allPoints[j].position));
    }
  }
};
//*/



