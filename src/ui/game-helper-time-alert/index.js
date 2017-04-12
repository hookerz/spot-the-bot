import Vue from 'vue';
import template from './template.vue';

export default Vue.component('game-helper-time-alert', {

  mixins: [ template ],

  props: [ 'id', 'delta' ],

  data() {

    return { age: 0 }

  },

  computed: {

    signedDelta() {

      return (this.delta > 0) ? ('+' + this.delta) : ('' + this.delta);

    },

    cssClasses() {

      return {

        'game-helper-bonus': (this.delta > 0),
        'game-helper-penalty': (this.delta < 0),

      };

    },

    cssStyles() {

      return {

        bottom: (this.age * 50) + '%',
        opacity: (100 - (this.age * 100)) + '%',

      };

    }

  },

  created() {

    const duration = 1;
    const onComplete = () => { this.$emit('dead', this.id); };

    TweenMax.to(this, duration, { age: 1, onComplete });

  },

  destroyed() {

    TweenMax.killTweensOf(this);

  },

});
