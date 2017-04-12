import Vue from 'vue';
import template from './template.vue';
import { store } from '../store';

export default Vue.component('menu-slide-join', {

  mixins: [ template ],

  props: [ 'connecting' ],

  store,

  data() {

    return {
      room: '',
      focused: false
    };

  },

  computed: {

    canDisplayVR() { return this.$store.state.canDisplayVR; },
    canPresentVR() { return this.$store.state.canPresentVR; },

    invalidRoomID() {

      return (typeof this.room === 'string' && this.room.length === 4) === false;

    }

  },

  methods: {

    back() { this.$emit('back'); },
    next() { this.$emit('next'); },

    focusHiddenInput() {

      if (this.focused) return;

      this.$refs.input.focus();
      this.$nextTick(this.scrollToInput);

    },

    scrollToInput() {

      // The iOS soft keyboard hides the input field without resizing the viewport, so we have to
      // scroll the window to bring it back into view.

      const rect = this.$refs.facade.getBoundingClientRect();
      const offset = rect.top + document.body.scrollTop;
      const target = Math.max(0, offset - 250);

      window.scrollTo(0, target);

    },

    resetInputSelection(event) {

      const el = event.target;
      el.setSelectionRange(this.room.length, this.room.length);

    },

    extractRoomValue(event)  {

      const el = event.target;

      this.room = el.value.slice(0, 4)
        .replace(/[^\w\d]/, '')
        .toUpperCase();

      el.value = this.room;

    },

    start() {

      if (this.invalidRoomID === true) return;

      this.$emit('startsrplayer', this.room);

    },


  }

});
