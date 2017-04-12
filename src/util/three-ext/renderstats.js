// adapted from here: https://github.com/jeromeetienne/threex.rendererstats/blob/master/threex.rendererstats.js
import {WebGLRenderer} from 'three'

/**
 * provide info on THREE.WebGLRenderer
 *
 * @param {Object} renderer the renderer to update
 * @param {Object} Camera the camera to update
*/
export const RendererStats	= function (){

	const msMin	= 100;
	const msMax	= 0;

	const container	= document.createElement( 'div' );
	container.style.cssText = 'width:150px;opacity:0.9;cursor:pointer';

	const msDiv	= document.createElement( 'div' );
	msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#200;';
	container.appendChild( msDiv );

	const msText	= document.createElement( 'div' );
	msText.style.cssText = 'color:#f00;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
	msText.innerHTML= 'WebGLRenderer';
	msDiv.appendChild( msText );

	const msTexts	= [];
	const nLines	= 9;
	for(let i = 0; i < nLines; i++){
		msTexts[i]	= document.createElement( 'div' );
		msTexts[i].style.cssText = 'color:#f00;background-color:#311;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
		msDiv.appendChild( msTexts[i] );
		msTexts[i].innerHTML= '-';
	}


	let lastTime	= Date.now();
	return {
		domElement: container,

		update: function(webGLRenderer){
			// sanity check
			//console.assert(webGLRenderer instanceof WebGLRenderer);

			// refresh only 30time per second
			if( Date.now() - lastTime < 1000/30 )	return;
			lastTime	= Date.now();

			let i = 0;
			msTexts[i++].textContent = "== Memory =====";
			msTexts[i++].textContent = "Programs: "	+ webGLRenderer.info.programs.length;
			msTexts[i++].textContent = "Geometries: "+webGLRenderer.info.memory.geometries;
			msTexts[i++].textContent = "Textures: "	+ webGLRenderer.info.memory.textures;

			msTexts[i++].textContent = "== Render =====";
			msTexts[i++].textContent = "Calls: "	+ webGLRenderer.info.render.calls;
			msTexts[i++].textContent = "Vertices: "	+ webGLRenderer.info.render.vertices;
			msTexts[i++].textContent = "Faces: "	+ webGLRenderer.info.render.faces;
			msTexts[i++].textContent = "Points: "	+ webGLRenderer.info.render.points;
		}
	}
};

export default RendererStats;
