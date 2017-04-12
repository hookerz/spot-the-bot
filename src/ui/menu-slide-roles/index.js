import Vue from 'vue';
import template from './template.vue';

export default Vue.component('menu-slide-roles', {

  mixins: [ template ],

  props: [ 'connecting' ],

  methods: {

    back() { this.$emit('back'); },
    next() { this.$emit('next'); },
    start() { this.$emit('startvrplayer'); },

  },

});
