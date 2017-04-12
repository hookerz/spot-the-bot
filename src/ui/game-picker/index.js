import Vue from 'vue';
import template from './template.vue';
import { UIEvent } from '../ui-event';
import { store, UIMutation } from '../store';
import { SoundManagerEvent } from '../../core/sound-manager';

export default Vue.component('game-picker', {

  mixins: [ template ],

  props: [ 'eventbus', 'network' ],

  store,

  computed: {

    canPresentVR() {

      const display = this.$store.state.webvrDisplay;
      return display && display.capabilities.canPresent;

    },

    presenting() { return this.$store.state.webvrPresenting; }

  },

  created() {

    if (this.$store.state.muted) {

      this.eventbus.dispatchEvent({ type: UIEvent.mute });

    } else {

      this.eventbus.dispatchEvent({ type: UIEvent.unmute });

    }

    // listen for mute/unmute events from the VR mute button
    this.eventbus.addEventListener(SoundManagerEvent.muted, this.onGameMuted);
    this.eventbus.addEventListener(SoundManagerEvent.unmuted, this.onGameUnmuted);

  },

  destroyed() {

    // listen for mute/unmute events from the VR mute button
    this.eventbus.removeEventListener(SoundManagerEvent.muted, this.onGameMuted);
    this.eventbus.removeEventListener(SoundManagerEvent.unmuted, this.onGameUnmuted);

  },

  methods: {

    leave() {

      window.location.reload();

    },

    enterVR() {

      ga('send', 'event', 'vr', 'click', 'enter-vr');

      this.eventbus.dispatchEvent({ type: UIEvent.enterVR });

    },

    exitVR() {

      ga('send', 'event', 'vr', 'click', 'exit-vr');

      this.eventbus.dispatchEvent({ type: UIEvent.exitVR });

    },

    onGameMuted() {

      this.$store.commit(UIMutation.mute);

    },

    onGameUnmuted() {

      this.$store.commit(UIMutation.unmute);

    },

  }

});
