import { Object3D, Geometry, Curve, LineBasicMaterial, Line, Shape, Matrix4, Mesh, MeshLambertMaterial, MeshBasicMaterial, SphereGeometry, Math as TMath, Vector3} from 'three';
import { setupTrackStaticPortalShadowUniforms, setupStaticPortalShadowUniforms, objectRenderOrder as portalObjectRenderOrder } from './portal';
import { MeshPortalShadowStandardMaterial, MeshPortalShadowLambertMaterial } from './materials/portal-shadow-materials';
import {ModifiedExtrudeGeometry} from './modified-extrude-geometry';


const trackRenderOrder = portalObjectRenderOrder;

export function lineGeo(index, spline, ts, orientations, segments=150) {
    const geometry = new Geometry();
    geometry.vertices = spline.getPoints(segments);
    const material = new LineBasicMaterial({color: 0xFFFFFF});
    const splineObject = new Line(geometry, material);
    splineObject.name = "Track Spline Geo" + (index + 1);
    splineObject.renderOrder = trackRenderOrder;
    return splineObject;
}

export function squareProfile(size=0.05) {
  const shape = new Shape();
  shape.moveTo( -size,  size);
  shape.lineTo(  size,  size);
  shape.lineTo(  size, -size);
  shape.lineTo( -size, -size);
  shape.lineTo( -size,  size);
  return shape;
}

export function circleProfile(r = 0.04, segs=8) {

  const shape = new Shape();

  shape.moveTo(r * Math.cos(0), r * Math.sin(0));
  for (let a = Math.PI / segs; a < 2 * Math.PI; a += Math.PI / segs)
    shape.lineTo(r * Math.cos(a), r * Math.sin(a));

  return shape;

}


export function extrudedGeometry(index, spline, ts, orientations, segments=150, profileShapeFunction=squareProfile) {
  const shape = profileShapeFunction();
  const geo = new ModifiedExtrudeGeometry(shape, {
    curveSegments: 4, // the number of samples from the shapeCurve
    steps: segments, // the number of points on the path...
    extrudePath: spline,
  });
  const mat = new MeshLambertMaterial( { color: 0xffffff } );
  const mesh = new Mesh(geo, mat) ;
  mesh.name = "Track Spline Geo" + (index + 1);
  mesh.renderOrder = trackRenderOrder;

  return mesh;
}

export const SubCurve = function(originalCurve, startT, endT) {
  Curve.call(this);
  this.originalCurve = originalCurve;
  this.startT = startT;
  this.endT = endT;
};

SubCurve.prototype = Object.create( Curve.prototype );
SubCurve.prototype.constructor = SubCurve;
SubCurve.prototype.isSubCurve = true;
SubCurve.prototype.getPoint = function (t) {
  // remap to the sub-curve range
  const newT = TMath.mapLinear(t, 0, 1, this.startT, this.endT);
  return this.originalCurve.getPoint(newT);
};

function clamp(value, min, max) {

  return Math.max(min, Math.min(max, value));

}

export function createTrackGeometryWithShadowTracks(splines, splinePortals, pointsBySpline, meshOverrides, tubeRadius = 0.05, radialSegments = 3) {

  // this custom material will shadow the spline if it is inside one of the two assigned portals per-pixel in the shader
  const shadowMat = new MeshPortalShadowLambertMaterial({ color: 0xffffff, checkTwoPortals: true});
  const profileShape = circleProfile(tubeRadius, radialSegments);
  const splineGeometryParent = new Object3D();
  splineGeometryParent.name = "Track Geometry Parent";

  const dummySphere = function (radius, color, position, yOffset = 0) {

    const geometry = new SphereGeometry(radius, 32, 32);
    const material = new MeshBasicMaterial({color: color});
    const sphere = new Mesh(geometry, material);
    sphere.position.set(position.x, position.y + yOffset, position.z);

    return sphere;

  };

  const simpleSplineSteps = function (spline, count) {
    const res = [];
    const step = 1.0 / (count-1);
    for (let i = 0; i < count; i++) {
      res.push(i * step);
    }
    return res;
  };

  const splineSteps = function (spline, splineUs, nSteps, options) {
    options = Object.assign({
      showPoints: false,
      addDetail: false,
      nDetailPoints: 5,
      detailIncrement: 0.01,
    }, options);

    // Remove duplicates from splineUs

    let temp = [];
    let lastT = undefined;
    for (let i = 0; i < splineUs.length; i++) {
      if (splineUs[i] == lastT)
        continue;
      temp.push(splineUs[i]);
      lastT = splineUs[i];
    }
    splineUs = temp;

    // Add further detail to splineUs

    temp = [];
    for (let i = 0; i < splineUs.length; i++) {
      if (options.addDetail) {
        for (let j = options.nDetailPoints; j > 0; j--) {
          const u = splineUs[i] - j * options.detailIncrement;
          if (u >= 0 && (i == 0 || u > splineUs[i - 1])) {
            temp.push(u);
            if (options.showPoints)
              splineGeometryParent.add(dummySphere(.025, 0x33cc33, spline.getPointAt(u), 0.1));
          }
        }
      }
      temp.push(splineUs[i]);
      if (options.showPoints)
        splineGeometryParent.add(dummySphere(.05, 0xff0000, spline.getPointAt(splineUs[i]), 0.1));
      if (options.addDetail) {
        for (let j = 1; j <= options.nDetailPoints; j++) {
          const u = splineUs[i] + j * options.detailIncrement;
          if (u <= 1 && (i == splineUs.length - 1 || u < splineUs[i + 1])) {
            temp.push(u);
            if (options.showPoints)
              splineGeometryParent.add(dummySphere(.025, 0x33cc33, spline.getPointAt(u), 0.1));
          }
        }
      }
    }

    splineUs = temp;

    // Create incremental Us and merge with splineUs

    const incSteps = [];

    for (let d = 0; d <= nSteps; d++) {
      incSteps.push(d / nSteps);
    }

    const steps = [];

    let ui = 0;
    for (let i = 0; i < incSteps.length; i++) {
      if (ui < splineUs.length - 1) {
        while (splineUs[ui] < incSteps[i]) {
          steps.push(splineUs[ui]);
          ui++;
        }
        while (splineUs[ui] == incSteps[i])
          ui++;
      }
      steps.push(incSteps[i]);
      if (options.showPoints)
        splineGeometryParent.add(dummySphere(.025, 0x0000ff, spline.getPointAt(steps[steps.length - 1]), 0.1));
    }

    return steps;
  };

  const getPathPoints = function (path, steps) {
    let points = [];
    for (let d = 0; d < steps.length; d++) {
      points.push(path.getPointAt(steps[d]));
    }
    return points;
  };

  const getFrenetFrames = function (path, steps) {

    // see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

    let normal = new Vector3();

    let tangents = [];
    let normals = [];
    let binormals = [];

    let vec = new Vector3();
    let mat = new Matrix4();

    let i, u, theta;

    // compute the tangent vectors for each segment on the curve

    for (i = 0; i < steps.length; i++) {
      tangents[i] = path.getTangentAt(steps[i]);
      tangents[i].normalize();
    }

    // select an initial normal vector perpendicular to the first tangent vector,
    // and in the direction of the minimum tangent xyz component

    normals[0] = new Vector3();
    binormals[0] = new Vector3();
    let min = Number.MAX_VALUE;
    let tx = Math.abs(tangents[0].x);
    let ty = Math.abs(tangents[0].y);
    let tz = Math.abs(tangents[0].z);

    if (tx <= min) {
      min = tx;
      normal.set(1, 0, 0);
    }

    if (ty <= min) {
      min = ty;
      normal.set(0, 1, 0);
    }

    if (tz <= min) {
      normal.set(0, 0, 1);
    }

    vec.crossVectors(tangents[0], normal).normalize();

    normals[0].crossVectors(tangents[0], vec);
    binormals[0].crossVectors(tangents[0], normals[0]);

    // compute the slowly-varying normal and binormal vectors for each segment on the curve

    for (i = 1; i < steps.length; i++) {
      normals[i] = normals[i - 1].clone();
      binormals[i] = binormals[i - 1].clone();
      vec.crossVectors(tangents[i - 1], tangents[i]);

      if (vec.length() > Number.EPSILON) {
        vec.normalize();
        theta = Math.acos(clamp(tangents[i - 1].dot(tangents[i]), -1, 1)); // clamp for floating pt errors
        normals[i].applyMatrix4(mat.makeRotationAxis(vec, theta));
      }
      binormals[i].crossVectors(tangents[i], normals[i]);
    }

    return {
      tangents: tangents,
      normals: normals,
      binormals: binormals
    };
  };

  for (let i=0; i < splines.length; i++) {

    const mainCurve = splines[i];
    const p1 = splinePortals[i][0];
    const p2 = splinePortals[i][1];
    const trackPoints = pointsBySpline[i];
    let mesh = meshOverrides[i]; // mesh override skips the extrude step
    if (!mesh) {
      const steps = simpleSplineSteps(mainCurve, trackPoints);
      const mainGeometry = new ModifiedExtrudeGeometry(profileShape, {
        curveSegments: 4,
        extrudePath: mainCurve,
        extrudePoints: getPathPoints(mainCurve, steps),
        frames: getFrenetFrames(mainCurve, steps)
      });

      mesh = new Mesh(mainGeometry, shadowMat.clone());
    }
    else
    {
      mesh.material = shadowMat.clone();
    }
    mesh.name = "Track " + i;
    mesh.receiveShadow = false;
    splineGeometryParent.add(mesh);
    setupTrackStaticPortalShadowUniforms(mesh, p1, p2);
  }

  return splineGeometryParent;
}


export function buildTrackGeo(splines, ts, orientations, geoBuilder=extrudedGeometry) {
  const splineGeometryParent = new Object3D();
  splineGeometryParent.name = "Track Geometry Parent";

  for (let i=0; i < splines.length; i++) {
    const geo = geoBuilder(i, splines[i], ts[i], orientations[i]);
    splineGeometryParent.add(geo);
  }

  return splineGeometryParent;
}
