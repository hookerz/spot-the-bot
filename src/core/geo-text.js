import {Object3D, Mesh, MeshBasicMaterial, TextGeometry, Vector3, BufferGeometry} from 'three';

// from GeometryUtils in examples...
const triangleArea = function () {
  const vector1 = new Vector3();
  const vector2 = new Vector3();

  return function ( vectorA, vectorB, vectorC ) {

    vector1.subVectors( vectorB, vectorA );
    vector2.subVectors( vectorC, vectorA );
    vector1.cross( vector2 );

    return 0.5 * vector1.length();
  };
}();

export function GeoText(text, font, options, camera=undefined) {

  options = Object.assign({
    size: 1,
    height: 0,
    curveSegments: 3,
    bevelThickness: .000002,
    bevelSize: 0.000005,
    bevelEnabled: false,
    color: 0xffffff,
    useBufferGeometry: true,
  }, options);

  const root = new Object3D();
  root.name = text + " Text";

  const mat = options.material || new MeshBasicMaterial({color: options.color});

  let textGeo = new TextGeometry(text, {

    font: font,

    size: options.size,
    height: options.height,
    curveSegments: options.curveSegments,

    bevelThickness: options.bevelThickness,
    bevelSize: options.bevelSize,
    bevelEnabled: options.bevelEnabled,

    material: 0,
    extrudeMaterial: 1

  });

  textGeo.computeVertexNormals();

  // "fix" side normals by removing z-component of normals for side faces
  // (this doesn't work well for beveled geometry as then we lose nice curvature around z-axis)

  if (!options.bevelEnabled) {

    let triangleAreaHeuristics = 0.1 * ( options.height * options.size );

    for (let  i = 0; i < textGeo.faces.length; i++) {

      let face = textGeo.faces[i];

      if (face.materialIndex == 1) {

        for (let  j = 0; j < face.vertexNormals.length; j++) {

          face.vertexNormals[j].z = 0;
          face.vertexNormals[j].normalize();
        }

        const va = textGeo.vertices[face.a];
        const vb = textGeo.vertices[face.b];
        const vc = textGeo.vertices[face.c];

        let s = triangleArea(va, vb, vc);
        if (s > triangleAreaHeuristics) {
          for (let  j = 0; j < face.vertexNormals.length; j++) {
            face.vertexNormals[j].copy(face.normal);
          }
        }
      }
    }
  }

  if (options.useBufferGeometry)
    textGeo = new BufferGeometry().fromGeometry(textGeo);

  textGeo.computeBoundingBox();

  const textMesh = new Mesh(textGeo, mat);
  textMesh.name = "Virtual Text Mesh";


  if (camera) {

    let vFOV = camera.fov * Math.PI / 180;        // convert vertical fov to radians
    let height = 2 * Math.tan(vFOV / 2) * Math.abs(options.z-camera.position.z); // visible height

    let aspect = window.innerWidth / window.innerHeight;
    let width = height * aspect;
    textMesh.scale.x = (width / (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x)) / window.devicePixelRatio;
    textMesh.scale.y = textMesh.scale.x;
    textMesh.position.x *= textMesh.scale.x;

  }
  const halfSize = textGeo.boundingBox.getSize().multiplyScalar(0.5);

  // by default the text geometry is generated with an origin of the upper left..
  // return offset so the text is center
  textMesh.position.set(-halfSize.x, -halfSize.y, -halfSize.z);

  root.add(textMesh);
  root.userData.textMesh = textMesh;

  return root;
}


