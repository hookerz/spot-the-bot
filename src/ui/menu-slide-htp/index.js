import Vue from 'vue';
import template from './template.vue';

export default Vue.component('menu-slide-htp', {

  mixins: [ template ],

  methods: {

    back() { this.$emit('back'); },
    next() { this.$emit('next'); },

  }

});
