import Vue from 'vue';
import template from './template.vue';
import { store } from '../store';
import { UIEvent } from '../ui-event';
import { GameStateManagerEvent, GameEndedReason } from '../../core/game-state-manager';

// Template Dependencies
import '../game-helper-ready';
import '../game-helper-running';
import '../game-helper-finished';

export default Vue.component('game-helper', {

  mixins: [ template ],

  props: [ 'eventbus' ],

  store,

  data() {

    return {
      connected: true,
      score: null,
      started: false,
      finished: false,
    };

  },

  created() {

    if (this.$store.state.muted) {

      this.eventbus.dispatchEvent({ type: UIEvent.mute });

    } else {

      this.eventbus.dispatchEvent({ type: UIEvent.unmute });

    }

    this.eventbus.addEventListener(GameStateManagerEvent.gameStarted, this.onGameStarted);
    this.eventbus.addEventListener(GameStateManagerEvent.gameEnded, this.onGameEnded);
    this.eventbus.addEventListener(GameStateManagerEvent.networkError, this.onNetworkError);

  },

  destroyed() {

    this.eventbus.removeEventListener(GameStateManagerEvent.gameStarted, this.onGameStarted);
    this.eventbus.removeEventListener(GameStateManagerEvent.gameEnded, this.onGameEnded);
    this.eventbus.removeEventListener(GameStateManagerEvent.networkError, this.onNetworkError);

  },

  methods: {

    exit() {

      window.location.reload()

    },

    onGameStarted() {

      this.started = true;
      this.finished = false;

    },

    onGameEnded(event) {

      if (event.reason === GameEndedReason.playerDisconnected) {
        this.connected = false;
      } else {
        this.finished = true;
      }

      if (event.state) this.score = event.state.catchCount;
    },

    onNetworkError() {

      this.connected = false;

    }

  }

});
