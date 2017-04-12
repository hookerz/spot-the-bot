import Vue from 'vue';
import template from './template.vue';

// Template Dependencies
import '../menu-slide-entry-comic';

export default Vue.component('menu-slide-entry', {

  mixins: [ template ],

  methods: {

    next() { this.$emit('next'); },

  }

});
