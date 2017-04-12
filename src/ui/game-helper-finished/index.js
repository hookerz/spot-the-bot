import Vue from 'vue';
import template from './template.vue';
import { UIEvent } from '../ui-event';
import { GameAction } from '../../core/gamemodes/gamemode-rush';

export default Vue.component('game-helper-finished', {

  mixins: [ template ],

  props: [ 'score', 'connected', 'eventbus' ],

  methods: {

    restart() {

      ga('send', 'event', 'game', 'restart');

      this.eventbus.dispatchEvent({ type: UIEvent.action, action: GameAction.StartGame })

    },

    exit() {

      ga('send', 'event', 'game', 'exit');

      window.location.reload();

    },

  }

});
