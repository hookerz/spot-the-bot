<template>

  <transition appear v-bind:css='false'
              v-on:enter='enter'
              v-on:leave='leave'
              v-on:after-enter='loadManifest'>

    <div class='ui-load' v-once>

        <div class='ui-load-container' ref='spinner-container'>

          <svg ref='spinner'  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 11">
            <path class="st0" d="M8.3 5.5c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3 1-2.3 2.3-2.3S8.3 4.2 8.3 5.5zM8.3 0.5H3.7C3.3 0.5 3 0.7 2.8 1L0.5 5C0.3 5.3 0.3 5.7 0.5 6L2.8 10c0.2 0.3 0.5 0.5 0.9 0.5h4.6c0.4 0 0.7-0.2 0.9-0.5L11.5 6c0.2-0.3 0.2-0.7 0-1.1L9.2 1C9 0.7 8.7 0.5 8.3 0.5z"/>
          </svg>

          <p>Loading</p>

        </div>

    </div>

  </transition>

</template>
