import Vue from 'vue';
import template from './template.vue';
import { store } from '../store';
import { UIEvent } from '../ui-event';
import { GameAction } from '../../core/gamemodes/gamemode-rush';
import { GameStateManagerEvent } from '../../core/game-state-manager';

// Template Dependencies
import '../game-helper-time-alert';

export default Vue.component('game-helper-running', {

  mixins: [ template ],

  props: [ 'eventbus' ],

  store,

  data() {

    return {

      score: 0,

      roundTime: null,

      haltRecovery: 1,
      haltTimestamp: null,

      passRecovery: 1,
      passTimestamp: null,

      timeAlertID: 0,
      timeAlerts: [],

    };

  },

  computed: {

    muted() { return this.$store.state.muted; },

    time() {

      const raw = this.roundTime;

      if (!raw) return '?';

      let seconds = Math.floor(raw % 60);
      let minutes = Math.floor(raw / 60);

      // sometimes the time can go below zero due to networking
      seconds = Math.max(0, seconds).toString(10);
      minutes = Math.max(0, minutes).toString(10);

      // pad the seconds with zeros
      while (seconds.length < 2) seconds = '0' + seconds;

      // render a clock string
      return `${ minutes }:${ seconds }`;

    }

  },

  created() {

    this.eventbus.addEventListener(GameStateManagerEvent.changed, this.onStateChanged);
    this.eventbus.addEventListener(GameStateManagerEvent.correct, this.onCorrectGuess);
    this.eventbus.addEventListener(GameStateManagerEvent.incorrect, this.onIncorrectGuess);
    this.eventbus.addEventListener(GameStateManagerEvent.remainingSecsChanged, this.onRemainingSecsChanged);

  },

  destroyed() {

    this.eventbus.removeEventListener(GameStateManagerEvent.changed, this.onStateChanged);
    this.eventbus.removeEventListener(GameStateManagerEvent.correct, this.onCorrectGuess);
    this.eventbus.removeEventListener(GameStateManagerEvent.incorrect, this.onIncorrectGuess);
    this.eventbus.removeEventListener(GameStateManagerEvent.remainingSecsChanged, this.onRemainingSecsChanged);

  },

  methods: {

    toggleMuted() {

      if (this.muted) {

        this.$store.commit(UIMutation.mute);
        this.eventbus.dispatchEvent({ type: UIEvent.unmute });


      } else {

        this.$store.commit(UIMutation.mute);
        this.eventbus.dispatchEvent({ type: UIEvent.mute });

      }

    },

    onHalt() {

      this.eventbus.dispatchEvent({ type: UIEvent.action, action: GameAction.PauseTrack });

    },

    onPass() {

      this.eventbus.dispatchEvent({ type: UIEvent.action, action: GameAction.Pass });

    },

    onCorrectGuess(event) {

      const delta = event.bonus;
      const id = this.timeAlertID++;

      this.timeAlerts.push({ delta, id });

    },

    onIncorrectGuess(event) {

      const delta = event.penalty;
      const id = this.timeAlertID++;

      this.timeAlerts.push({ delta, id });

    },

    onTimeAlertDead(id) {

      const index = this.timeAlerts.findIndex(alert => alert.id === id);
      if (index >= 0) this.timeAlerts.splice(index, 1);

    },

    onRemainingSecsChanged(event) {

      this.roundTime = event.time.remainingSecs;

    },

    onStateChanged(event) {

      const { state } = event;

      if (state) {

        this.score = state.catchCount;

        if (this.haltTimestamp !== state.pauseTimestamp) {

          this.haltTimestamp = state.pauseTimestamp;
          TweenLite.from(this, state.pauseCooldown, { haltRecovery: 0, ease: Linear.easeNone })

        }

        if (this.passTimestamp !== event.state.passTimestamp) {

          this.passTimestamp = event.state.passTimestamp;
          TweenLite.from(this, state.passCooldown, { passRecovery: 0, ease: Linear.easeNone })

        }

      }

    }

  }

});
