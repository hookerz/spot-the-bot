import Vue from 'vue';
import template from './template.vue';
import assets from '../../core/assets.js';

export default Vue.component('ui-load', {

  mixins: [ template ],

  props: [ 'manifest' ],

  methods: {

    enter(el, done) {

      const container = this.$refs['spinner-container'];
      const timeline = new TimelineLite({ onComplete: done });


      timeline.set(container, {

        transform: 'translateY(-40vh)'

      });

      timeline.to(container, 0.6, {

        transform: 'translateY(0vh)',
        ease: Elastic.easeOut.config ( 0.7, 0.6 ),
        force3D: true,
        onComplete: done,

      }, 0.5);

      timeline.fromTo (container, 0.12, { autoAlpha: 0 }, { autoAlpha: 1, ease: Power1.easeOut }, 0.5 + 0.0 );

    },

    leave(el, done) {

      const container = this.$refs['spinner-container'];
      const timeline = new TimelineLite({ onComplete: done });

      timeline.to(container, 0.4, {

        transform: 'translateY(-80vh)',
        ease: Back.easeIn.config(0.8),

      });

      timeline.to(container, 0.3, {

        autoAlpha: 0.0,
        ease: Power1.easeOut

      }, 0.2);

    },

    loadManifest() {

      assets.load(this.manifest, this.onLoadComplete, this.onLoadProgress, this.onLoadError);

      TweenMax.to(this.$refs.spinner, 0.8, {

        rotation: '+=60',
        repeat: -1,
        ease: Power4.easeInOut,
        onRepeat: this.onSpinnerRepeat

      });

    },

    onLoadProgress() {

    },

    onLoadComplete() {

      this.complete = true;

    },

    onLoadError() {

    },

    onSpinnerRepeat() {

      if (this.complete === true) {

        TweenMax.killTweensOf(this.$refs.spinner);
        Vue.nextTick(() => this.$emit('complete'));

      }

    },

  },

});
