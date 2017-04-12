import Vue from 'vue';
import template from './template.vue';
import { values } from '../../util';

export default Vue.component('ui-bots', {

  mixins: [ template ],

  mounted() {

  },

  destroyed() {

    values(this.$refs).forEach(TweenMax.killTweensOf);

  },

  methods: {

    enter(el, done) {

      this.timeline = new TimelineMax({ onComplete: done });

      const bots = values(this.$refs);

      for (let i = 0; i < bots.length; i++) {

        const el = bots[i];
        const tl = buildEnterAnimation(el, i);

        this.timeline.add(tl, i * 0.04);

      }

      this.timeline.play();

    },

    entered() {

      values(this.$refs).forEach(buildBreatheAnimation);

    }

  }

});

function buildEnterAnimation(el, index) {

  const x = (index < 2) ? -100 : 100;
  const y = (index % 2) ? 100 : -100;

  const midPercent = 0.2;

  const xMid = x * midPercent;
  const yMid = y * midPercent;

  const tl = new TimelineMax();

  tl.fromTo(el, 0.4, {

    transform: `translateX(${ x }vw) translateY(${ y }vh)`,

  }, {

    transform: `translateX(${ xMid }vw) translateY(${ yMid }vh)`,
    ease: Power1.easeIn

  });

  tl.to(el, 0.9, {

    transform: 'translateX(0) translateY(0)',
    ease: Elastic.easeOut.config(0.8, 0.9),

  });

  return tl;

}

function buildBreatheAnimation(el) {

  const x = Math.floor(4 + Math.random() * 4);
  const y = Math.floor(4 + Math.random() * 4);

  return TweenMax.fromTo(el, 4, {

    transform: 'translateX(0) translateY(0)'

  },{

    transform: `translateX(${ x }px) translateY(${ y }px)`,
    ease: Sine.easeInOut,
    yoyo: true,
    repeat: -1,

  });

}
