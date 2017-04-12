import Vue from 'vue';
import template from './template.vue';
import assets from '../../core/assets';
import { AudioContext } from 'three';
import { UIEvent } from '../ui-event';
import { store, UIMutation } from '../store';
import { visibility } from '../../util/visibility';

export default Vue.component('ui-music', {

  mixins: [ template ],

  props: [ 'eventbus' ],

  store,

  data() {

    return {
      context: AudioContext.getContext(),
      hidden: false
    };

  },

  computed: {

    muted() { return this.$store.state.muted; }

  },

  created() {

    this.createGain();
    this.updateGain();

    // mute the music when the tab isnt visible
    visibility.addEventListener('visibilitychange', this.onVisibilityChange);

    this.source.start(0);

  },

  destroyed() {

    visibility.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.source.stop();

  },

  methods: {

    toggle() {

      if (this.muted) {

        this.$store.commit(UIMutation.unmute);
        this.eventbus.dispatchEvent({ type: UIEvent.unmute });

        ga('send', 'event', 'sound', 'click', 'unmute');

      } else {

        this.$store.commit(UIMutation.mute);
        this.eventbus.dispatchEvent({ type: UIEvent.mute });

        ga('send', 'event', 'sound', 'click', 'mute');

      }

    },

    createGain() {

      const source = this.context.createBufferSource();

      source.buffer = assets.get('music');
      source.loop = true;

      this.source = source;

      const gainnode = this.context.createGain();

      source.connect(gainnode);
      gainnode.connect(this.context.destination);

      this.gain = gainnode.gain;

    },

    updateGain() {

      this.gain.value = (this.muted || this.hidden) ? 0.0 : 0.5;

    },

    onVisibilityChange(event) {

      this.hidden = event.hidden;
      this.updateGain();

    }

  },

  watch: {

    muted() { this.updateGain(); },

  }

});
