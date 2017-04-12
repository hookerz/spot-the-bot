import Vue from 'vue';
import template from './template.vue';
import config from '../../core/config';
import { visibility } from '../../util/visibility';

export default Vue.component('warn-portrait', {

  mixins: [ template ],

  data() {

    return { landscape: false };

  },

  created() {

    if (config.moble === false) return;

    const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;

    if (orientation) {
      window.addEventListener('orientationchange', this.updateOrientation);
    } else {
      window.addEventListener('resize', this.updateOrientation);
    }

    // the orientation might change while the screen is locked
    visibility.addEventListener('visibilitychange', this.updateOrientation);

    this.updateOrientation();

  },

  destroyed() {

    if (orientation) {
      window.removeEventListener('orientationchange', this.updateOrientation);
    } else {
      window.removeEventListener('resize', this.updateOrientation);
    }

    visibility.removeEventListener('visibilitychange', this.updateOrientation);

  },

  methods: {

    updateOrientation() {

      const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;

      if (orientation) {
        this.landscape = orientation.type.includes('landscape');
      } else {
        this.landscape = window.innerWidth > window.innerHeight;
      }

    },

  },

  watch: {

    // hide the keyboard if we need to show the portrait warning
    landscape() { if (this.landscape) document.activeElement.blur() }

  }

});
