import Vue from 'vue';
import template from './template.vue';

export default Vue.component('ui-badges', {
  mixins: [template],
  methods: {
    onHookBadgeClick: function () {
      trackOpen('http://byhook.com');
    },
    onWebVRBadgeClick: function () {
      trackOpen('http://webvrexperiments.com');
    }
  }
});

function trackOpen(url) {
  ga('send', 'event', 'link', 'click', url);
  window.open(url, '_blank');
}
