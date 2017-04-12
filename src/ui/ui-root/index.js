import Vue from 'vue';
import template from './template.vue';
import { UIEvent } from '../ui-event';
import { store, UIRoute, UIMutation } from '../store';
import { PlayerRole } from '../../core/player-manager';
import { GameStateManagerEvent } from '../../core/game-state-manager';

// Template Dependencies
import '../ui-about';
import '../ui-background'
import '../ui-badges';
import '../ui-bots';
import '../ui-load';
import '../ui-music';
import '../ui-share';
import '../ui-title';
import '../warn-portrait';
import '../warn-webgl';
import Menu from '../menu-root';
import GameHelper from '../game-helper';
import GamePicker from '../game-picker';

export default Vue.extend({

  mixins: [ template ],

  store,

  data() {

    return {
      manifest: null,
      eventbus: null,
      players: null, // TODO pretty sure we can get rid of this
    };

  },

  computed: {

    showUI() {

      const { role } = this;
      const { route } = this.$store.state;

      if (role === PlayerRole.picker) {

        const display = this.$store.state.webvrDisplay;
        const canPresentVR = display && display.capabilities.canPresent;

        return route.startsWith('menu') || canPresentVR;

      } else if (role === PlayerRole.helper) {

        return (route !== UIRoute.gameRunning);

      }

      return true;

    },

    loaded() {

      return (this.route === UIRoute.load) === false;

    },

    view() {

      const { route, role } = this;

      const isMenu = route && route.startsWith('menu');
      const isGame = route && route.startsWith('game');

      if (isMenu) {

        return Menu;

      } else if (isGame && role === PlayerRole.picker) {

        return GamePicker;

      } else if (isGame && role === PlayerRole.helper) {

        return GameHelper;

      } else {

        throw new Error(`unable to pick root view`);

      }

    },

    mobile() { return this.$store.state.mobile },

    webglSupported() { return this.$store.state.webglSupported; },

    webvrPresenting() { return this.$store.state.webvrPresenting; },

    /**
     * The current UI route.
     * @return {UIRoute}
     */
    route() { return this.$store.state.route; },

    /**
     * The current player role.
     * @return {?PlayerRole}
     */
    role() { return (this.players ? this.players.role : null) }

  },

  created() {

    this.checkVRDisplays();

    window.addEventListener('vrdisplayconnected', this.checkVRDisplays);
    window.addEventListener('vrdisplaypresentchange', this.onVRDisplayPresentChange);

    // Navigate to different routes when the game starts and ends.
    this.eventbus.addEventListener(GameStateManagerEvent.gameStarted, this.onGameStarted);
    this.eventbus.addEventListener(GameStateManagerEvent.gameEnded, this.onGameEnded);

    // Grab the network/player interface from the UI start event.
    this.eventbus.addEventListener(UIEvent.start, this.onStart);

  },

  destroyed() {

    window.removeEventListener('vrdisplayconnected', this.checkVRDisplays);
    window.removeEventListener('vrdisplaypresentchange', this.onVRDisplayPresentChange);

    this.eventbus.removeEventListener(GameStateManagerEvent.gameStarted, this.onGameStarted);
    this.eventbus.removeEventListener(GameStateManagerEvent.gameEnded, this.onGameEnded);

    this.eventbus.removeEventListener(UIEvent.start, this.onStart);

  },

  methods: {

    onStart(event) {

      this.players = event.players;
      this.network = event.network;

    },

    onGameStarted(event) {

      this.$store.commit(UIMutation.navigate, UIRoute.gameRunning);

    },

    onGameEnded(event) {

      this.$store.commit(UIMutation.navigate, UIRoute.gameScore);

    },

    /**
     * Update the VR flags in the store. Asynchronous.
     *
     * @return {Promise}
     */
    checkVRDisplays() {

      if (navigator.getVRDisplays === undefined) {

        console.warn('WebVR was not polyfilled; ignoring VR display presence.');
        return Promise.resolve();

      }

      return navigator.getVRDisplays().then(displays => {

        if (displays.length === 0) return;
        this.$store.commit(UIMutation.updateWebVRDisplay, displays[0]);

      });

    },

    onVRDisplayPresentChange(event) {

      this.$store.commit(UIMutation.updateWebVRDisplay);

    },

    onPrimaryLoad() {

      this.$store.commit(UIMutation.navigate, UIRoute.menu);

    },

  },

});
