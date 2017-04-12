import Vue from 'vue';
import template from './template.vue';
import { store, UIMutation, UIRoute } from '../store';

export default Vue.component('ui-title', {

  mixins: [ template ],

  store,

  methods: {

    navigateToEntry() {

      this.$store.commit(UIMutation.navigate, UIRoute.menu);

    }

  }

});
