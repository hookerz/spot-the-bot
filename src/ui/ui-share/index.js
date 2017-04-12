import Vue from 'vue';
import template from './template.vue';

export default Vue.component('ui-share', {

  mixins: [ template ],

  methods: {

    shareFacebook() {

      ga('send', 'event', 'share', 'click', 'facebook');

      FB.ui({

        method: 'share',
        href: 'https://spot-the-bot.com',

      });

    },

    shareTwitter() {

      ga('send', 'event', 'share', 'click', 'twitter');

      const paramURL = 'https://spot-the-bot.com';
      const paramText = 'No apps. No downloads. Play in VR right on your browser with Spot-the-Bot! Find a friend and play here:';

      const url = 'https://twitter.com/intent/tweet'
        + '?url=' + encodeURIComponent(paramURL)
        + '&text=' + encodeURIComponent(paramText);

      window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600')

    },

  }

});
