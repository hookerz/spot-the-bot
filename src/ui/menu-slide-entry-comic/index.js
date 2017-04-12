import Vue from 'vue';
import template from './template.vue';
import { values } from '../../util';

export default Vue.component('menu-slide-entry-comic', {

  mixins: [ template ],

  mounted() {

    this.timeline = new TimelineMax({ repeat: -1 });

    const bots = values(this.$refs);

    for (let i = 0; i < bots.length; i++) {

      const el = bots[i];
      const tl = animate(el);

      this.timeline.add(tl, i * 2.0);

    }

  },

  destroyed() {

    this.timeline.kill();

  }

});

function animate(el) {

  const tl = new TimelineLite();

  // animate from outside the top, to center

  tl.fromTo(el, 0.2, {

    transform: 'translateY(-120px)'

  }, {

    transform: 'translateY(0px)',
    ease: Power3.easeOut,

  });

  // animate to outside the bottom

  tl.to(el, 0.2, {

    transform: 'translateY(120px)',
    ease: Power3.easeIn,

  }, '+=1.5');

  return tl;

}
