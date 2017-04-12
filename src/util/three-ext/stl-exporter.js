import { Vector3, Matrix3, Geometry, Mesh } from 'three';

/**
 * @author kovacsv / http://kovacsv.hu/
 * @author mrdoob / http://mrdoob.com/
 */

function isVisible(object) {
  while (object) {
    if (object.visible === false)
      return false;
    object = object.parent;
  }
  return true;
}

export const STLExporter = function () {};

STLExporter.prototype = {

	constructor: STLExporter,

	parse: ( function () {

		var vector = new Vector3();
		var normalMatrixWorld = new Matrix3();

		return function parse( scene ) {

			var output = '';

			output += 'solid exported\n';

			scene.traverse( function ( object ) {

				if ( object instanceof Mesh && isVisible(object)) { // small change to export visible objects only

					var geometry = object.geometry;
					var matrixWorld = object.matrixWorld;

					if ( geometry instanceof Geometry ) {

						var vertices = geometry.vertices;
						var faces = geometry.faces;

						normalMatrixWorld.getNormalMatrix( matrixWorld );

						for ( var i = 0, l = faces.length; i < l; i ++ ) {

							var face = faces[ i ];

							vector.copy( face.normal ).applyMatrix3( normalMatrixWorld ).normalize();

							output += '\tfacet normal ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
							output += '\t\touter loop\n';

							var indices = [ face.a, face.b, face.c ];

							for ( var j = 0; j < 3; j ++ ) {

								vector.copy( vertices[ indices[ j ] ] ).applyMatrix4( matrixWorld );

								output += '\t\t\tvertex ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';

							}

							output += '\t\tendloop\n';
							output += '\tendfacet\n';

						}

					}

				}

			} );

			output += 'endsolid exported\n';

			return output;

		};

	}() )

};
export const stlExporter = new STLExporter();
export default STLExporter;

window.stlExporter = stlExporter;

export function exportScene(scene)
{
  const contents = stlExporter.parse(scene);

  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  window.requestFileSystem(window.TEMPORARY, contents.length*2, function(fs) {
    fs.root.getFile('export.stl', {create: true}, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {

          fileWriter.addEventListener("writeend", function() {
                // navigate to file, will download
                window.open(fileEntry.toURL(), '_blank');
            }, false);

            let blob = new Blob([contents], {type: 'text/plain'});
            fileWriter.write(blob);
        }, function() {});
    }, function() {});
  }, function() {});
}

window.exportScene = exportScene;





