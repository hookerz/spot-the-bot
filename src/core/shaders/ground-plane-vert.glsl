#include <common>
#include <color_pars_vertex>
#include <packing>
#include <lights_pars>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>
#include <uv_pars_vertex>

varying vec4 worldPosition;

void main() {

  #include <color_vertex>
  #include <begin_vertex>
  #include <project_vertex>
  worldPosition = modelMatrix * vec4( transformed, 1.0 );

  #include <shadowmap_vertex>
  #include <fog_vertex>
  #include <uv_vertex>
}
