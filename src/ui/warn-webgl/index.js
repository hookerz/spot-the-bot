import Vue from 'vue';
import template from './template.vue';
import { store, UIMutation } from '../store';

export default Vue.component('warn-webgl', {

  mixins: [ template ],

  created() {

    const support = detectWebGLSupport();
    this.$store.commit(UIMutation.updateWebGLSupport, support);

  },

});

/**
 * Attempt to detect support for WebGL.
 *
 * @return {Boolean} True if WebGL is supported.
 */
function detectWebGLSupport() {

  // https://github.com/mrdoob/three.js/blob/master/examples/js/Detector.js

  try {

    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));

  } catch (err) {

    return false;

  }

}
