import { Geometry, Vector3, Vector2, Face3 } from 'three';

export function ModifiedExtrudeGeometry(shapes, options ) {

  if ( typeof( shapes ) === "undefined" ) {

    shapes = [];
    return;

  }

  Geometry.call( this );

  this.type = 'ModifiedExtrudeGeometry';

  shapes = Array.isArray( shapes ) ? shapes : [ shapes ];

  this.addShapeList( shapes, options );

  this.computeFaceNormals();

  // can't really use automatic vertex normals
  // as then front and back sides get smoothed too
  // should do separate smoothing just for sides

  //this.computeVertexNormals();

  //console.log( "took", ( Date.now() - startTime ) );

}

ModifiedExtrudeGeometry.prototype = Object.create( Geometry.prototype );
ModifiedExtrudeGeometry.prototype.constructor = ModifiedExtrudeGeometry;

ModifiedExtrudeGeometry.prototype.addShapeList = function (shapes, options ) {

  var sl = shapes.length;

  for ( var s = 0; s < sl; s ++ ) {

    var shape = shapes[ s ];
    this.addShape( shape, options );

  }

};

ModifiedExtrudeGeometry.prototype.addShape = function (shape, options ) {

  var amount = options.amount !== undefined ? options.amount : 100;

  var bevelThickness = options.bevelThickness !== undefined ? options.bevelThickness : 6; // 10
  var bevelSize = options.bevelSize !== undefined ? options.bevelSize : bevelThickness - 2; // 8
  var bevelSegments = options.bevelSegments !== undefined ? options.bevelSegments : 3;

  var bevelEnabled = options.bevelEnabled !== undefined ? options.bevelEnabled : true; // false

  var curveSegments = options.curveSegments !== undefined ? options.curveSegments : 12;

  var steps = options.steps !== undefined ? options.steps : 1;

  var extrudePath = options.extrudePath;
  var extrudePts, extrudeByPath = false;

  // Use default WorldUVGenerator if no UV generators are specified.
  var uvgen = options.UVGenerator !== undefined ? options.UVGenerator : ModifiedExtrudeGeometry.WorldUVGenerator;

  var splineTube, binormal, normal, position2;
  if ( extrudePath ) {

    if(options.extrudePoints)
    {

      extrudePts = options.extrudePoints;
      steps = extrudePts.length - 1;

    }
    else
    {

      extrudePts = extrudePath.getSpacedPoints( steps );

    }

    extrudeByPath = true;
    bevelEnabled = false; // bevels not supported for path extrusion

    // SETUP TNB variables

    // TODO1 - have a .isClosed in spline?

    splineTube = options.frames !== undefined ? options.frames : extrudePath.computeFrenetFrames( steps, false );

    // console.log(splineTube, 'splineTube', splineTube.normals.length, 'steps', steps, 'extrudePts', extrudePts.length);

    binormal = new Vector3();
    normal = new Vector3();
    position2 = new Vector3();

  }

  // Safeguards if bevels are not enabled

  if ( ! bevelEnabled ) {

    bevelSegments = 0;
    bevelThickness = 0;
    bevelSize = 0;

  }

  // Variables initialization

  var ahole, h, hl; // looping of holes
  var scope = this;

  var shapesOffset = this.vertices.length;

  var shapePoints = shape.extractPoints( curveSegments );

  var vertices = shapePoints.shape;
  var holes = shapePoints.holes;

  var reverse = ! ShapeUtils.isClockWise( vertices );

  if ( reverse ) {

    vertices = vertices.reverse();

    // Maybe we should also check if holes are in the opposite direction, just to be safe ...

    for ( h = 0, hl = holes.length; h < hl; h ++ ) {

      ahole = holes[ h ];

      if ( ShapeUtils.isClockWise( ahole ) ) {

        holes[ h ] = ahole.reverse();

      }

    }

    reverse = false; // If vertices are in order now, we shouldn't need to worry about them again (hopefully)!

  }


  var faces = ShapeUtils.triangulateShape( vertices, holes );

  /* Vertices */

  var contour = vertices; // vertices has all points but contour has only points of circumference

  for ( h = 0, hl = holes.length; h < hl; h ++ ) {

    ahole = holes[ h ];

    vertices = vertices.concat( ahole );

  }


  function scalePt2( pt, vec, size ) {

    if ( ! vec ) console.error( "ModifiedExtrudeGeometry: vec does not exist" );

    return vec.clone().multiplyScalar( size ).add( pt );

  }

  var b, bs, t, z,
    vert, vlen = vertices.length,
    face, flen = faces.length;


  // Find directions for point movement


  function getBevelVec( inPt, inPrev, inNext ) {

    // computes for inPt the corresponding point inPt' on a new contour
    //   shifted by 1 unit (length of normalized vector) to the left
    // if we walk along contour clockwise, this new contour is outside the old one
    //
    // inPt' is the intersection of the two lines parallel to the two
    //  adjacent edges of inPt at a distance of 1 unit on the left side.

    var v_trans_x, v_trans_y, shrink_by = 1;		// resulting translation vector for inPt

    // good reading for geometry algorithms (here: line-line intersection)
    // http://geomalgorithms.com/a05-_intersect-1.html

    var v_prev_x = inPt.x - inPrev.x, v_prev_y = inPt.y - inPrev.y;
    var v_next_x = inNext.x - inPt.x, v_next_y = inNext.y - inPt.y;

    var v_prev_lensq = ( v_prev_x * v_prev_x + v_prev_y * v_prev_y );

    // check for collinear edges
    var collinear0 = ( v_prev_x * v_next_y - v_prev_y * v_next_x );

    if ( Math.abs( collinear0 ) > Number.EPSILON ) {

      // not collinear

      // length of vectors for normalizing

      var v_prev_len = Math.sqrt( v_prev_lensq );
      var v_next_len = Math.sqrt( v_next_x * v_next_x + v_next_y * v_next_y );

      // shift adjacent points by unit vectors to the left

      var ptPrevShift_x = ( inPrev.x - v_prev_y / v_prev_len );
      var ptPrevShift_y = ( inPrev.y + v_prev_x / v_prev_len );

      var ptNextShift_x = ( inNext.x - v_next_y / v_next_len );
      var ptNextShift_y = ( inNext.y + v_next_x / v_next_len );

      // scaling factor for v_prev to intersection point

      var sf = (  ( ptNextShift_x - ptPrevShift_x ) * v_next_y -
        ( ptNextShift_y - ptPrevShift_y ) * v_next_x    ) /
        ( v_prev_x * v_next_y - v_prev_y * v_next_x );

      // vector from inPt to intersection point

      v_trans_x = ( ptPrevShift_x + v_prev_x * sf - inPt.x );
      v_trans_y = ( ptPrevShift_y + v_prev_y * sf - inPt.y );

      // Don't normalize!, otherwise sharp corners become ugly
      //  but prevent crazy spikes
      var v_trans_lensq = ( v_trans_x * v_trans_x + v_trans_y * v_trans_y );
      if ( v_trans_lensq <= 2 ) {

        return	new Vector2( v_trans_x, v_trans_y );

      } else {

        shrink_by = Math.sqrt( v_trans_lensq / 2 );

      }

    } else {

      // handle special case of collinear edges

      var direction_eq = false;		// assumes: opposite
      if ( v_prev_x > Number.EPSILON ) {

        if ( v_next_x > Number.EPSILON ) {

          direction_eq = true;

        }

      } else {

        if ( v_prev_x < - Number.EPSILON ) {

          if ( v_next_x < - Number.EPSILON ) {

            direction_eq = true;

          }

        } else {

          if ( Math.sign( v_prev_y ) === Math.sign( v_next_y ) ) {

            direction_eq = true;

          }

        }

      }

      if ( direction_eq ) {

        // console.log("Warning: lines are a straight sequence");
        v_trans_x = - v_prev_y;
        v_trans_y =  v_prev_x;
        shrink_by = Math.sqrt( v_prev_lensq );

      } else {

        // console.log("Warning: lines are a straight spike");
        v_trans_x = v_prev_x;
        v_trans_y = v_prev_y;
        shrink_by = Math.sqrt( v_prev_lensq / 2 );

      }

    }

    return	new Vector2( v_trans_x / shrink_by, v_trans_y / shrink_by );

  }


  var contourMovements = [];

  for ( var i = 0, il = contour.length, j = il - 1, k = i + 1; i < il; i ++, j ++, k ++ ) {

    if ( j === il ) j = 0;
    if ( k === il ) k = 0;

    //  (j)---(i)---(k)
    // console.log('i,j,k', i, j , k)

    contourMovements[ i ] = getBevelVec( contour[ i ], contour[ j ], contour[ k ] );

  }

  var holesMovements = [], oneHoleMovements, verticesMovements = contourMovements.concat();

  for ( h = 0, hl = holes.length; h < hl; h ++ ) {

    ahole = holes[ h ];

    oneHoleMovements = [];

    for ( i = 0, il = ahole.length, j = il - 1, k = i + 1; i < il; i ++, j ++, k ++ ) {

      if ( j === il ) j = 0;
      if ( k === il ) k = 0;

      //  (j)---(i)---(k)
      oneHoleMovements[ i ] = getBevelVec( ahole[ i ], ahole[ j ], ahole[ k ] );

    }

    holesMovements.push( oneHoleMovements );
    verticesMovements = verticesMovements.concat( oneHoleMovements );

  }


  // Loop bevelSegments, 1 for the front, 1 for the back

  for ( b = 0; b < bevelSegments; b ++ ) {

    //for ( b = bevelSegments; b > 0; b -- ) {

    t = b / bevelSegments;
    z = bevelThickness * Math.cos( t * Math.PI / 2 );
    bs = bevelSize * Math.sin( t * Math.PI / 2 );

    // contract shape

    for ( i = 0, il = contour.length; i < il; i ++ ) {

      vert = scalePt2( contour[ i ], contourMovements[ i ], bs );

      v( vert.x, vert.y,  - z );

    }

    // expand holes

    for ( h = 0, hl = holes.length; h < hl; h ++ ) {

      ahole = holes[ h ];
      oneHoleMovements = holesMovements[ h ];

      for ( i = 0, il = ahole.length; i < il; i ++ ) {

        vert = scalePt2( ahole[ i ], oneHoleMovements[ i ], bs );

        v( vert.x, vert.y,  - z );

      }

    }

  }

  bs = bevelSize;

  // Back facing vertices

  for ( i = 0; i < vlen; i ++ ) {

    vert = bevelEnabled ? scalePt2( vertices[ i ], verticesMovements[ i ], bs ) : vertices[ i ];

    if ( ! extrudeByPath ) {

      v( vert.x, vert.y, 0 );

    } else {

      // v( vert.x, vert.y + extrudePts[ 0 ].y, extrudePts[ 0 ].x );

      normal.copy( splineTube.normals[ 0 ] ).multiplyScalar( vert.x );
      binormal.copy( splineTube.binormals[ 0 ] ).multiplyScalar( vert.y );

      position2.copy( extrudePts[ 0 ] ).add( normal ).add( binormal );

      v( position2.x, position2.y, position2.z );

    }

  }

  // Add stepped vertices...
  // Including front facing vertices

  var s;

  for ( s = 1; s <= steps; s ++ ) {

    for ( i = 0; i < vlen; i ++ ) {

      vert = bevelEnabled ? scalePt2( vertices[ i ], verticesMovements[ i ], bs ) : vertices[ i ];

      if ( ! extrudeByPath ) {

        v( vert.x, vert.y, amount / steps * s );

      } else {

        // v( vert.x, vert.y + extrudePts[ s - 1 ].y, extrudePts[ s - 1 ].x );

        normal.copy( splineTube.normals[ s ] ).multiplyScalar( vert.x );
        binormal.copy( splineTube.binormals[ s ] ).multiplyScalar( vert.y );

        position2.copy( extrudePts[ s ] ).add( normal ).add( binormal );

        v( position2.x, position2.y, position2.z );

      }

    }

  }


  // Add bevel segments planes

  //for ( b = 1; b <= bevelSegments; b ++ ) {
  for ( b = bevelSegments - 1; b >= 0; b -- ) {

    t = b / bevelSegments;
    z = bevelThickness * Math.cos ( t * Math.PI / 2 );
    bs = bevelSize * Math.sin( t * Math.PI / 2 );

    // contract shape

    for ( i = 0, il = contour.length; i < il; i ++ ) {

      vert = scalePt2( contour[ i ], contourMovements[ i ], bs );
      v( vert.x, vert.y,  amount + z );

    }

    // expand holes

    for ( h = 0, hl = holes.length; h < hl; h ++ ) {

      ahole = holes[ h ];
      oneHoleMovements = holesMovements[ h ];

      for ( i = 0, il = ahole.length; i < il; i ++ ) {

        vert = scalePt2( ahole[ i ], oneHoleMovements[ i ], bs );

        if ( ! extrudeByPath ) {

          v( vert.x, vert.y,  amount + z );

        } else {

          v( vert.x, vert.y + extrudePts[ steps - 1 ].y, extrudePts[ steps - 1 ].x + z );

        }

      }

    }

  }

  /* Faces */

  // Top and bottom faces

  buildLidFaces();

  // Sides faces

  buildSideFaces();


  /////  Internal functions

  function buildLidFaces() {

    if ( bevelEnabled ) {

      var layer = 0; // steps + 1
      var offset = vlen * layer;

      // Bottom faces

      for ( i = 0; i < flen; i ++ ) {

        face = faces[ i ];
        f3( face[ 2 ] + offset, face[ 1 ] + offset, face[ 0 ] + offset );

      }

      layer = steps + bevelSegments * 2;
      offset = vlen * layer;

      // Top faces

      for ( i = 0; i < flen; i ++ ) {

        face = faces[ i ];
        f3( face[ 0 ] + offset, face[ 1 ] + offset, face[ 2 ] + offset );

      }

    } else {

      // Bottom faces

      for ( i = 0; i < flen; i ++ ) {

        face = faces[ i ];
        f3( face[ 2 ], face[ 1 ], face[ 0 ] );

      }

      // Top faces

      for ( i = 0; i < flen; i ++ ) {

        face = faces[ i ];
        f3( face[ 0 ] + vlen * steps, face[ 1 ] + vlen * steps, face[ 2 ] + vlen * steps );

      }

    }

  }

  // Create faces for the z-sides of the shape

  function buildSideFaces() {

    var layeroffset = 0;
    sidewalls( contour, layeroffset );
    layeroffset += contour.length;

    for ( h = 0, hl = holes.length; h < hl; h ++ ) {

      ahole = holes[ h ];
      sidewalls( ahole, layeroffset );

      //, true
      layeroffset += ahole.length;

    }

  }

  function sidewalls( contour, layeroffset ) {

    var j, k;
    i = contour.length;

    while ( -- i >= 0 ) {

      j = i;
      k = i - 1;
      if ( k < 0 ) k = contour.length - 1;

      //console.log('b', i,j, i-1, k,vertices.length);

      var s = 0, sl = steps  + bevelSegments * 2;

      for ( s = 0; s < sl; s ++ ) {

        var slen1 = vlen * s;
        var slen2 = vlen * ( s + 1 );

        var a = layeroffset + j + slen1,
          b = layeroffset + k + slen1,
          c = layeroffset + k + slen2,
          d = layeroffset + j + slen2;

        f4( a, b, c, d, contour, s, sl, j, k );

      }

    }

  }


  function v( x, y, z ) {

    scope.vertices.push( new Vector3( x, y, z ) );

  }

  function f3( a, b, c ) {

    a += shapesOffset;
    b += shapesOffset;
    c += shapesOffset;

    scope.faces.push( new Face3( a, b, c, null, null, 0 ) );

    var uvs = uvgen.generateTopUV( scope, a, b, c );

    scope.faceVertexUvs[ 0 ].push( uvs );

  }

  function f4( a, b, c, d, wallContour, stepIndex, stepsLength, contourIndex1, contourIndex2 ) {

    a += shapesOffset;
    b += shapesOffset;
    c += shapesOffset;
    d += shapesOffset;

    scope.faces.push( new Face3( a, b, d, null, null, 1 ) );
    scope.faces.push( new Face3( b, c, d, null, null, 1 ) );

    var uvs = uvgen.generateSideWallUV( scope, a, b, c, d );

    scope.faceVertexUvs[ 0 ].push( [ uvs[ 0 ], uvs[ 1 ], uvs[ 3 ] ] );
    scope.faceVertexUvs[ 0 ].push( [ uvs[ 1 ], uvs[ 2 ], uvs[ 3 ] ] );

  }

};

ModifiedExtrudeGeometry.WorldUVGenerator = {

  generateTopUV: function ( geometry, indexA, indexB, indexC ) {

    var vertices = geometry.vertices;

    var a = vertices[ indexA ];
    var b = vertices[ indexB ];
    var c = vertices[ indexC ];

    return [
      new Vector2( a.x, a.y ),
      new Vector2( b.x, b.y ),
      new Vector2( c.x, c.y )
    ];

  },

  generateSideWallUV: function ( geometry, indexA, indexB, indexC, indexD ) {

    var vertices = geometry.vertices;

    var a = vertices[ indexA ];
    var b = vertices[ indexB ];
    var c = vertices[ indexC ];
    var d = vertices[ indexD ];

    if ( Math.abs( a.y - b.y ) < 0.01 ) {

      return [
        new Vector2( a.x, 1 - a.z ),
        new Vector2( b.x, 1 - b.z ),
        new Vector2( c.x, 1 - c.z ),
        new Vector2( d.x, 1 - d.z )
      ];

    } else {

      return [
        new Vector2( a.y, 1 - a.z ),
        new Vector2( b.y, 1 - b.z ),
        new Vector2( c.y, 1 - c.z ),
        new Vector2( d.y, 1 - d.z )
      ];

    }

  }
};

var ShapeUtils = {

  // calculate area of the contour polygon

  area: function ( contour ) {

    var n = contour.length;
    var a = 0.0;

    for ( var p = n - 1, q = 0; q < n; p = q ++ ) {

      a += contour[ p ].x * contour[ q ].y - contour[ q ].x * contour[ p ].y;

    }

    return a * 0.5;

  },

  triangulate: ( function () {

    /**
     * This code is a quick port of code written in C++ which was submitted to
     * flipcode.com by John W. Ratcliff  // July 22, 2000
     * See original code and more information here:
     * http://www.flipcode.com/archives/Efficient_Polygon_Triangulation.shtml
     *
     * ported to actionscript by Zevan Rosser
     * www.actionsnippet.com
     *
     * ported to javascript by Joshua Koo
     * http://www.lab4games.net/zz85/blog
     *
     */

    function snip( contour, u, v, w, n, verts ) {

      var p;
      var ax, ay, bx, by;
      var cx, cy, px, py;

      ax = contour[ verts[ u ] ].x;
      ay = contour[ verts[ u ] ].y;

      bx = contour[ verts[ v ] ].x;
      by = contour[ verts[ v ] ].y;

      cx = contour[ verts[ w ] ].x;
      cy = contour[ verts[ w ] ].y;

      if ( ( bx - ax ) * ( cy - ay ) - ( by - ay ) * ( cx - ax ) <= 0 ) return false;

      var aX, aY, bX, bY, cX, cY;
      var apx, apy, bpx, bpy, cpx, cpy;
      var cCROSSap, bCROSScp, aCROSSbp;

      aX = cx - bx;  aY = cy - by;
      bX = ax - cx;  bY = ay - cy;
      cX = bx - ax;  cY = by - ay;

      for ( p = 0; p < n; p ++ ) {

        px = contour[ verts[ p ] ].x;
        py = contour[ verts[ p ] ].y;

        if ( ( ( px === ax ) && ( py === ay ) ) ||
          ( ( px === bx ) && ( py === by ) ) ||
          ( ( px === cx ) && ( py === cy ) ) )	continue;

        apx = px - ax;  apy = py - ay;
        bpx = px - bx;  bpy = py - by;
        cpx = px - cx;  cpy = py - cy;

        // see if p is inside triangle abc

        aCROSSbp = aX * bpy - aY * bpx;
        cCROSSap = cX * apy - cY * apx;
        bCROSScp = bX * cpy - bY * cpx;

        if ( ( aCROSSbp >= - Number.EPSILON ) && ( bCROSScp >= - Number.EPSILON ) && ( cCROSSap >= - Number.EPSILON ) ) return false;

      }

      return true;

    }

    // takes in an contour array and returns

    return function triangulate( contour, indices ) {

      var n = contour.length;

      if ( n < 3 ) return null;

      var result = [],
        verts = [],
        vertIndices = [];

      /* we want a counter-clockwise polygon in verts */

      var u, v, w;

      if ( ShapeUtils.area( contour ) > 0.0 ) {

        for ( v = 0; v < n; v ++ ) verts[ v ] = v;

      } else {

        for ( v = 0; v < n; v ++ ) verts[ v ] = ( n - 1 ) - v;

      }

      var nv = n;

      /*  remove nv - 2 vertices, creating 1 triangle every time */

      var count = 2 * nv;   /* error detection */

      for ( v = nv - 1; nv > 2; ) {

        /* if we loop, it is probably a non-simple polygon */

        if ( ( count -- ) <= 0 ) {

          //** Triangulate: ERROR - probable bad polygon!

          //throw ( "Warning, unable to triangulate polygon!" );
          //return null;
          // Sometimes warning is fine, especially polygons are triangulated in reverse.
          console.warn( 'ShapeUtils: Unable to triangulate polygon! in triangulate()' );

          if ( indices ) return vertIndices;
          return result;

        }

        /* three consecutive vertices in current polygon, <u,v,w> */

        u = v; 	 	if ( nv <= u ) u = 0;     /* previous */
        v = u + 1;  if ( nv <= v ) v = 0;     /* new v    */
        w = v + 1;  if ( nv <= w ) w = 0;     /* next     */

        if ( snip( contour, u, v, w, nv, verts ) ) {

          var a, b, c, s, t;

          /* true names of the vertices */

          a = verts[ u ];
          b = verts[ v ];
          c = verts[ w ];

          /* output Triangle */

          result.push( [ contour[ a ],
            contour[ b ],
            contour[ c ] ] );


          vertIndices.push( [ verts[ u ], verts[ v ], verts[ w ] ] );

          /* remove v from the remaining polygon */

          for ( s = v, t = v + 1; t < nv; s ++, t ++ ) {

            verts[ s ] = verts[ t ];

          }

          nv --;

          /* reset error detection counter */

          count = 2 * nv;

        }

      }

      if ( indices ) return vertIndices;
      return result;

    }

  } )(),

  triangulateShape: function ( contour, holes ) {

    function removeDupEndPts(points) {

      var l = points.length;

      if ( l > 2 && points[ l - 1 ].equals( points[ 0 ] ) ) {

        points.pop();

      }

    }

    removeDupEndPts( contour );
    holes.forEach( removeDupEndPts );

    function point_in_segment_2D_colin( inSegPt1, inSegPt2, inOtherPt ) {

      // inOtherPt needs to be collinear to the inSegment
      if ( inSegPt1.x !== inSegPt2.x ) {

        if ( inSegPt1.x < inSegPt2.x ) {

          return	( ( inSegPt1.x <= inOtherPt.x ) && ( inOtherPt.x <= inSegPt2.x ) );

        } else {

          return	( ( inSegPt2.x <= inOtherPt.x ) && ( inOtherPt.x <= inSegPt1.x ) );

        }

      } else {

        if ( inSegPt1.y < inSegPt2.y ) {

          return	( ( inSegPt1.y <= inOtherPt.y ) && ( inOtherPt.y <= inSegPt2.y ) );

        } else {

          return	( ( inSegPt2.y <= inOtherPt.y ) && ( inOtherPt.y <= inSegPt1.y ) );

        }

      }

    }

    function intersect_segments_2D( inSeg1Pt1, inSeg1Pt2, inSeg2Pt1, inSeg2Pt2, inExcludeAdjacentSegs ) {

      var seg1dx = inSeg1Pt2.x - inSeg1Pt1.x,   seg1dy = inSeg1Pt2.y - inSeg1Pt1.y;
      var seg2dx = inSeg2Pt2.x - inSeg2Pt1.x,   seg2dy = inSeg2Pt2.y - inSeg2Pt1.y;

      var seg1seg2dx = inSeg1Pt1.x - inSeg2Pt1.x;
      var seg1seg2dy = inSeg1Pt1.y - inSeg2Pt1.y;

      var limit		= seg1dy * seg2dx - seg1dx * seg2dy;
      var perpSeg1	= seg1dy * seg1seg2dx - seg1dx * seg1seg2dy;

      if ( Math.abs( limit ) > Number.EPSILON ) {

        // not parallel

        var perpSeg2;
        if ( limit > 0 ) {

          if ( ( perpSeg1 < 0 ) || ( perpSeg1 > limit ) ) 		return [];
          perpSeg2 = seg2dy * seg1seg2dx - seg2dx * seg1seg2dy;
          if ( ( perpSeg2 < 0 ) || ( perpSeg2 > limit ) ) 		return [];

        } else {

          if ( ( perpSeg1 > 0 ) || ( perpSeg1 < limit ) ) 		return [];
          perpSeg2 = seg2dy * seg1seg2dx - seg2dx * seg1seg2dy;
          if ( ( perpSeg2 > 0 ) || ( perpSeg2 < limit ) ) 		return [];

        }

        // i.e. to reduce rounding errors
        // intersection at endpoint of segment#1?
        if ( perpSeg2 === 0 ) {

          if ( ( inExcludeAdjacentSegs ) &&
            ( ( perpSeg1 === 0 ) || ( perpSeg1 === limit ) ) )		return [];
          return [ inSeg1Pt1 ];

        }
        if ( perpSeg2 === limit ) {

          if ( ( inExcludeAdjacentSegs ) &&
            ( ( perpSeg1 === 0 ) || ( perpSeg1 === limit ) ) )		return [];
          return [ inSeg1Pt2 ];

        }
        // intersection at endpoint of segment#2?
        if ( perpSeg1 === 0 )		return [ inSeg2Pt1 ];
        if ( perpSeg1 === limit )	return [ inSeg2Pt2 ];

        // return real intersection point
        var factorSeg1 = perpSeg2 / limit;
        return	[ { x: inSeg1Pt1.x + factorSeg1 * seg1dx,
          y: inSeg1Pt1.y + factorSeg1 * seg1dy } ];

      } else {

        // parallel or collinear
        if ( ( perpSeg1 !== 0 ) ||
          ( seg2dy * seg1seg2dx !== seg2dx * seg1seg2dy ) ) 			return [];

        // they are collinear or degenerate
        var seg1Pt = ( ( seg1dx === 0 ) && ( seg1dy === 0 ) );	// segment1 is just a point?
        var seg2Pt = ( ( seg2dx === 0 ) && ( seg2dy === 0 ) );	// segment2 is just a point?
        // both segments are points
        if ( seg1Pt && seg2Pt ) {

          if ( ( inSeg1Pt1.x !== inSeg2Pt1.x ) ||
            ( inSeg1Pt1.y !== inSeg2Pt1.y ) )		return [];	// they are distinct  points
          return [ inSeg1Pt1 ];                 						// they are the same point

        }
        // segment#1  is a single point
        if ( seg1Pt ) {

          if ( ! point_in_segment_2D_colin( inSeg2Pt1, inSeg2Pt2, inSeg1Pt1 ) )		return [];		// but not in segment#2
          return [ inSeg1Pt1 ];

        }
        // segment#2  is a single point
        if ( seg2Pt ) {

          if ( ! point_in_segment_2D_colin( inSeg1Pt1, inSeg1Pt2, inSeg2Pt1 ) )		return [];		// but not in segment#1
          return [ inSeg2Pt1 ];

        }

        // they are collinear segments, which might overlap
        var seg1min, seg1max, seg1minVal, seg1maxVal;
        var seg2min, seg2max, seg2minVal, seg2maxVal;
        if ( seg1dx !== 0 ) {

          // the segments are NOT on a vertical line
          if ( inSeg1Pt1.x < inSeg1Pt2.x ) {

            seg1min = inSeg1Pt1; seg1minVal = inSeg1Pt1.x;
            seg1max = inSeg1Pt2; seg1maxVal = inSeg1Pt2.x;

          } else {

            seg1min = inSeg1Pt2; seg1minVal = inSeg1Pt2.x;
            seg1max = inSeg1Pt1; seg1maxVal = inSeg1Pt1.x;

          }
          if ( inSeg2Pt1.x < inSeg2Pt2.x ) {

            seg2min = inSeg2Pt1; seg2minVal = inSeg2Pt1.x;
            seg2max = inSeg2Pt2; seg2maxVal = inSeg2Pt2.x;

          } else {

            seg2min = inSeg2Pt2; seg2minVal = inSeg2Pt2.x;
            seg2max = inSeg2Pt1; seg2maxVal = inSeg2Pt1.x;

          }

        } else {

          // the segments are on a vertical line
          if ( inSeg1Pt1.y < inSeg1Pt2.y ) {

            seg1min = inSeg1Pt1; seg1minVal = inSeg1Pt1.y;
            seg1max = inSeg1Pt2; seg1maxVal = inSeg1Pt2.y;

          } else {

            seg1min = inSeg1Pt2; seg1minVal = inSeg1Pt2.y;
            seg1max = inSeg1Pt1; seg1maxVal = inSeg1Pt1.y;

          }
          if ( inSeg2Pt1.y < inSeg2Pt2.y ) {

            seg2min = inSeg2Pt1; seg2minVal = inSeg2Pt1.y;
            seg2max = inSeg2Pt2; seg2maxVal = inSeg2Pt2.y;

          } else {

            seg2min = inSeg2Pt2; seg2minVal = inSeg2Pt2.y;
            seg2max = inSeg2Pt1; seg2maxVal = inSeg2Pt1.y;

          }

        }
        if ( seg1minVal <= seg2minVal ) {

          if ( seg1maxVal <  seg2minVal )	return [];
          if ( seg1maxVal === seg2minVal )	{

            if ( inExcludeAdjacentSegs )		return [];
            return [ seg2min ];

          }
          if ( seg1maxVal <= seg2maxVal )	return [ seg2min, seg1max ];
          return	[ seg2min, seg2max ];

        } else {

          if ( seg1minVal >  seg2maxVal )	return [];
          if ( seg1minVal === seg2maxVal )	{

            if ( inExcludeAdjacentSegs )		return [];
            return [ seg1min ];

          }
          if ( seg1maxVal <= seg2maxVal )	return [ seg1min, seg1max ];
          return	[ seg1min, seg2max ];

        }

      }

    }

    function isPointInsideAngle( inVertex, inLegFromPt, inLegToPt, inOtherPt ) {

      // The order of legs is important

      // translation of all points, so that Vertex is at (0,0)
      var legFromPtX	= inLegFromPt.x - inVertex.x,  legFromPtY	= inLegFromPt.y - inVertex.y;
      var legToPtX	= inLegToPt.x	- inVertex.x,  legToPtY		= inLegToPt.y	- inVertex.y;
      var otherPtX	= inOtherPt.x	- inVertex.x,  otherPtY		= inOtherPt.y	- inVertex.y;

      // main angle >0: < 180 deg.; 0: 180 deg.; <0: > 180 deg.
      var from2toAngle	= legFromPtX * legToPtY - legFromPtY * legToPtX;
      var from2otherAngle	= legFromPtX * otherPtY - legFromPtY * otherPtX;

      if ( Math.abs( from2toAngle ) > Number.EPSILON ) {

        // angle != 180 deg.

        var other2toAngle		= otherPtX * legToPtY - otherPtY * legToPtX;
        // console.log( "from2to: " + from2toAngle + ", from2other: " + from2otherAngle + ", other2to: " + other2toAngle );

        if ( from2toAngle > 0 ) {

          // main angle < 180 deg.
          return	( ( from2otherAngle >= 0 ) && ( other2toAngle >= 0 ) );

        } else {

          // main angle > 180 deg.
          return	( ( from2otherAngle >= 0 ) || ( other2toAngle >= 0 ) );

        }

      } else {

        // angle == 180 deg.
        // console.log( "from2to: 180 deg., from2other: " + from2otherAngle  );
        return	( from2otherAngle > 0 );

      }

    }


    function removeHoles( contour, holes ) {

      var shape = contour.concat(); // work on this shape
      var hole;

      function isCutLineInsideAngles( inShapeIdx, inHoleIdx ) {

        // Check if hole point lies within angle around shape point
        var lastShapeIdx = shape.length - 1;

        var prevShapeIdx = inShapeIdx - 1;
        if ( prevShapeIdx < 0 )			prevShapeIdx = lastShapeIdx;

        var nextShapeIdx = inShapeIdx + 1;
        if ( nextShapeIdx > lastShapeIdx )	nextShapeIdx = 0;

        var insideAngle = isPointInsideAngle( shape[ inShapeIdx ], shape[ prevShapeIdx ], shape[ nextShapeIdx ], hole[ inHoleIdx ] );
        if ( ! insideAngle ) {

          // console.log( "Vertex (Shape): " + inShapeIdx + ", Point: " + hole[inHoleIdx].x + "/" + hole[inHoleIdx].y );
          return	false;

        }

        // Check if shape point lies within angle around hole point
        var lastHoleIdx = hole.length - 1;

        var prevHoleIdx = inHoleIdx - 1;
        if ( prevHoleIdx < 0 )			prevHoleIdx = lastHoleIdx;

        var nextHoleIdx = inHoleIdx + 1;
        if ( nextHoleIdx > lastHoleIdx )	nextHoleIdx = 0;

        insideAngle = isPointInsideAngle( hole[ inHoleIdx ], hole[ prevHoleIdx ], hole[ nextHoleIdx ], shape[ inShapeIdx ] );
        if ( ! insideAngle ) {

          // console.log( "Vertex (Hole): " + inHoleIdx + ", Point: " + shape[inShapeIdx].x + "/" + shape[inShapeIdx].y );
          return	false;

        }

        return	true;

      }

      function intersectsShapeEdge( inShapePt, inHolePt ) {

        // checks for intersections with shape edges
        var sIdx, nextIdx, intersection;
        for ( sIdx = 0; sIdx < shape.length; sIdx ++ ) {

          nextIdx = sIdx + 1; nextIdx %= shape.length;
          intersection = intersect_segments_2D( inShapePt, inHolePt, shape[ sIdx ], shape[ nextIdx ], true );
          if ( intersection.length > 0 )		return	true;

        }

        return	false;

      }

      var indepHoles = [];

      function intersectsHoleEdge( inShapePt, inHolePt ) {

        // checks for intersections with hole edges
        var ihIdx, chkHole,
          hIdx, nextIdx, intersection;
        for ( ihIdx = 0; ihIdx < indepHoles.length; ihIdx ++ ) {

          chkHole = holes[ indepHoles[ ihIdx ]];
          for ( hIdx = 0; hIdx < chkHole.length; hIdx ++ ) {

            nextIdx = hIdx + 1; nextIdx %= chkHole.length;
            intersection = intersect_segments_2D( inShapePt, inHolePt, chkHole[ hIdx ], chkHole[ nextIdx ], true );
            if ( intersection.length > 0 )		return	true;

          }

        }
        return	false;

      }

      var holeIndex, shapeIndex,
        shapePt, holePt,
        holeIdx, cutKey, failedCuts = [],
        tmpShape1, tmpShape2,
        tmpHole1, tmpHole2;

      for ( var h = 0, hl = holes.length; h < hl; h ++ ) {

        indepHoles.push( h );

      }

      var minShapeIndex = 0;
      var counter = indepHoles.length * 2;
      while ( indepHoles.length > 0 ) {

        counter --;
        if ( counter < 0 ) {

          console.log( "Infinite Loop! Holes left:" + indepHoles.length + ", Probably Hole outside Shape!" );
          break;

        }

        // search for shape-vertex and hole-vertex,
        // which can be connected without intersections
        for ( shapeIndex = minShapeIndex; shapeIndex < shape.length; shapeIndex ++ ) {

          shapePt = shape[ shapeIndex ];
          holeIndex	= - 1;

          // search for hole which can be reached without intersections
          for ( var h = 0; h < indepHoles.length; h ++ ) {

            holeIdx = indepHoles[ h ];

            // prevent multiple checks
            cutKey = shapePt.x + ":" + shapePt.y + ":" + holeIdx;
            if ( failedCuts[ cutKey ] !== undefined )			continue;

            hole = holes[ holeIdx ];
            for ( var h2 = 0; h2 < hole.length; h2 ++ ) {

              holePt = hole[ h2 ];
              if ( ! isCutLineInsideAngles( shapeIndex, h2 ) )		continue;
              if ( intersectsShapeEdge( shapePt, holePt ) )		continue;
              if ( intersectsHoleEdge( shapePt, holePt ) )		continue;

              holeIndex = h2;
              indepHoles.splice( h, 1 );

              tmpShape1 = shape.slice( 0, shapeIndex + 1 );
              tmpShape2 = shape.slice( shapeIndex );
              tmpHole1 = hole.slice( holeIndex );
              tmpHole2 = hole.slice( 0, holeIndex + 1 );

              shape = tmpShape1.concat( tmpHole1 ).concat( tmpHole2 ).concat( tmpShape2 );

              minShapeIndex = shapeIndex;

              // Debug only, to show the selected cuts
              // glob_CutLines.push( [ shapePt, holePt ] );

              break;

            }
            if ( holeIndex >= 0 )	break;		// hole-vertex found

            failedCuts[ cutKey ] = true;			// remember failure

          }
          if ( holeIndex >= 0 )	break;		// hole-vertex found

        }

      }

      return shape; 			/* shape with no holes */

    }


    var i, il, f, face,
      key, index,
      allPointsMap = {};

    // To maintain reference to old shape, one must match coordinates, or offset the indices from original arrays. It's probably easier to do the first.

    var allpoints = contour.concat();

    for ( var h = 0, hl = holes.length; h < hl; h ++ ) {

      Array.prototype.push.apply( allpoints, holes[ h ] );

    }

    //console.log( "allpoints",allpoints, allpoints.length );

    // prepare all points map

    for ( i = 0, il = allpoints.length; i < il; i ++ ) {

      key = allpoints[ i ].x + ":" + allpoints[ i ].y;

      if ( allPointsMap[ key ] !== undefined ) {

        console.warn( "ShapeUtils: Duplicate point", key, i );

      }

      allPointsMap[ key ] = i;

    }

    // remove holes by cutting paths to holes and adding them to the shape
    var shapeWithoutHoles = removeHoles( contour, holes );

    var triangles = ShapeUtils.triangulate( shapeWithoutHoles, false ); // True returns indices for points of spooled shape
    //console.log( "triangles",triangles, triangles.length );

    // check all face vertices against all points map

    for ( i = 0, il = triangles.length; i < il; i ++ ) {

      face = triangles[ i ];

      for ( f = 0; f < 3; f ++ ) {

        key = face[ f ].x + ":" + face[ f ].y;

        index = allPointsMap[ key ];

        if ( index !== undefined ) {

          face[ f ] = index;

        }

      }

    }

    return triangles.concat();

  },

  isClockWise: function ( pts ) {

    return ShapeUtils.area( pts ) < 0;

  }

};

