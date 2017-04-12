import Vue from 'vue';
import template from './template.vue';

export default Vue.component('ui-about', {

  mixins: [ template ],

  data() {

    return { expanded: false };

  },

  methods: {
    toggleExpanded: function () {
      this.expanded = !this.expanded;
      if (this.expanded) {
        ga('send', 'event', 'about', 'click', 'expand-about');
      }
    }
  }

});
