<template>

  <div class='menu-root'>

    <div class='menu-slides'>

      <transition v-bind:css='false'
                  v-on:enter='transitionSlideEnter'
                  v-on:leave='transitionSlideLeave'>

        <component class='menu-slide'
                   v-bind:is='view'
                   v-bind:eventbus='eventbus'
                   v-bind:connecting='connecting'
                   v-on:startvrplayer='startVRPlayer'
                   v-on:startsrplayer='startSRPlayer'
                   v-on:back='navigateBack'
                   v-on:next='navigateNext'>
        </component>

      </transition>

    </div>

    <div class='menu-notifications'>

      <transition v-bind:css='false' mode='out-in'
                  v-on:enter='showNotification'
                  v-on:leave='hideNotification'>

        <menu-notification v-if='notification' v-bind:key='notification.key' v-bind:error='notification.err'>
          <p v-html='notification.msg'></p>
        </menu-notification>

      </transition>

    </div>

  </div>

</template>
