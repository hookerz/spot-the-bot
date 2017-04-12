import Vue from 'vue';
import is from 'is_js';
import template from './template.vue';
import config from '../../core/config';
import { UIEvent } from '../ui-event';
import { store, UIRoute, UIMutation } from '../store';
import { reserveSRPlayer, reserveVRPlayer } from '../../spot-the-bot';
import { NonexistentRoomError } from '../../core/networking/network-interface';

// Template Dependencies
import '../menu-notification';
import SlideEntry from '../menu-slide-entry';
import SlideHTP from '../menu-slide-htp';
import SlideJoin from '../menu-slide-join';
import SlideRoles from '../menu-slide-roles';


const slideMap = {
  0: SlideEntry,
  1: SlideHTP,
  2: SlideRoles,
  3: SlideJoin,
};

export default Vue.component('menu-root', {

  mixins: [ template ],

  props: [ 'eventbus' ],

  store,

  data() {

    return {

      slide: 0,
      lastslide: 0,
      connecting: false,
      notification: null,
      notificationTimeout: null,

    };

  },

  computed: {

    view() {

      if (slideMap[this.slide])
        return slideMap[this.slide];

      return SlideEntry;

    },

  },

  methods: {

    transitionSlideLeave(el, done) {

      const timeline = new TimelineMax({ onComplete: done });

      const direction = (this.lastslide < this.slide) ? -1 : +1;
      const transform = direction * 140;

      // animate the previous view off the screen

      timeline.fromTo(el, 0.5, {

        position: 'absolute'

      }, {

        ease: Power3.easeOut,
        transform: `translateX(${ transform }vw)`

      });

      // animate the whole menu height to smooth out the title position

      timeline.fromTo(this.$el, 0.4, {

        height: el.getBoundingClientRect().height

      }, {

        ease: Elastic.easeOut.config(1.0, 0.8),
        height: el.nextSibling.getBoundingClientRect().height,

      }, 0.0);

      timeline.set(this.$el, { height: 'auto' });

    },

    transitionSlideEnter(el, done) {

      const direction = (this.lastslide < this.slide) ? +1 : -1;
      const transform = direction * 140;

      // animate the next view into the screen

      TweenMax.fromTo(el, 0.6, {

        transform: `translateX(${ transform }vw)`,

      }, {

        ease: Elastic.easeOut.config(0.6, 0.95),
        transform: 'translateX(0vw)',
        onComplete: done,

      });

    },

    navigateBack() {

      if (this.connecting) return;

      this.notification = null;
      this.lastslide = this.slide;
      this.slide = Math.max(0, this.slide - 1);

      ga('send', 'event', 'screen', slideMap[this.slide].extendOptions.name, "back");
    },

    navigateNext() {

      if (this.connecting) return;

      this.notification = null;
      this.lastslide = this.slide;
      this.slide = Math.min(4, this.slide + 1);

      window.comp = slideMap[this.slide];

      ga('send', 'event', 'screen', slideMap[this.slide].extendOptions.name, "next");
    },

    notify(msg, err = false) {

      // give each notification a unique key so they all transition correctly
      const key = (Math.random() * 100).toFixed(0);
      this.notification = { key, err, msg };

    },

    startVRPlayer() {

      const display = this.$store.state.webvrDisplay;

      // explicitly check for tablets here, the polyfill thinks they can fit in a cardboard

      const canDisplay = (display !== null);
      const canPresent = (canDisplay && display.capabilities.canPresent && is.not.tablet()) || (config.requireVRPresent === false);

      if (canDisplay && canPresent) {

        this.notify('Connecting to the room.');

        this.connecting = true;

        ga('send', 'event', 'game', 'player-selection', 'vr-player');

        reserveVRPlayer().then(this.onConnected, this.onConnectionError);

      } else {

        ga('send', 'event', 'vr', 'no-vr-device');

        this.notify(`No compatible VR device found. <a href='https://webvr.info' target='_blank'>Learn more about WebVR here.</a>`, true);

      }

    },

    startSRPlayer(room) {

      if (room === undefined) {

        return console.warn('join event is missing room id');

      } else if (this.connecting === false) {

        this.notify('Connecting to the room.');

        ga('send', 'event', 'game', 'player-selection', 'non-vr-player');

        this.connecting = true;
        reserveSRPlayer(room).then(this.onConnected, this.onConnectionError);

      }

    },

    onConnected(res) {

      const [ network, players ] = res;

      this.connecting = false;

      this.eventbus.dispatchEvent({ type: UIEvent.start, network, players });

      this.$store.commit(UIMutation.navigate, UIRoute.gameReady);

      ga('send', 'event', 'connection', 'connected');

    },

    onConnectionError(err) {

      if (err === NonexistentRoomError) {

        this.notify('Could not connect to room. Please check your room code & try again.', true);

      } else {

        this.notify('Could not connect to game, please try again.', true);

      }

      ga('send', 'event', 'connection', 'error', err.toString());

      this.connecting = false;

    },

    showNotification(el, done) {

      TweenMax.fromTo(el, 0.35, {

        transform: 'translateY(60px) scaleY(0)',

      },{

        transform: 'translateY(0) scaleY(1)',
        ease: Elastic.easeOut.config(1, 0.6),
        onComplete: done,

      });

    },

    hideNotification(el, done) {

      TweenMax.to(el, 0.2, {

        transform: 'translateY(20px)',
        opacity: 0,
        onComplete: done,

      });

    },

  },

  watch: {

    notification() {

      if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
      this.notificationTimeout = setTimeout(() => this.notification = null, 2000);

    }

  }

});
