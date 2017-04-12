import Vue from 'vue';
import template from './template.vue';
import { store, UIMutation, UIRoute } from '../store';

export default Vue.component('menu-notification', {

  mixins: [ template ],

  props: [ 'error' ],

})
