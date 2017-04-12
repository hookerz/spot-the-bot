<template>

  <!--<transition appear v-bind:css='false'-->
              <!--v-on:enter='enter'-->
              <!--v-on:leave='leave'>-->

  <div class='game-picker' v-if='canPresentVR'>

    <div class='ui-infobox'>
      <p class='ui-infobox-header'>Room Code</p>
      <p class='game-picker-room-code'>{{ network.room }}</p>
    </div>

    <div class='ui-infobox'>
      <p class='ui-infobox-header'>Instructions</p>
      <p>Once you find the bot your friend is describing, use your trigger button to select it.</p>
    </div>

    <div class='game-picker-buttons'>

      <div class='ui-button ui-blue' v-on:click='leave'>
        <p>Leave Game</p>
      </div>

      <template v-if='canPresentVR && presenting === false'>

        <div class='ui-button ui-red game-vr-button-enter' v-on:click='enterVR'>
          <svg y="5" height="100" viewBox="0 -4 28 28">
            <path d="M26.8 1.1C26.1 0.4 25.1 0 24.2 0H3.4c-1 0-1.7 0.4-2.4 1.1C0.3 1.7 0 2.7 0 3.6v10.7c0 1 0.3 1.9 0.9 2.6C1.6 17.6 2.4 18 3.4 18h5c0.7 0 1.3-0.2 1.8-0.5 0.6-0.3 1-0.8 1.3-1.4l1.5-2.6C13.2 13.1 13 13 14 13v0h-0.2 0c0.3 0 0.7 0.1 0.8 0.5l1.4 2.6c0.3 0.6 0.8 1.1 1.3 1.4 0.6 0.3 1.2 0.5 1.8 0.5h5c1 0 2-0.4 2.7-1.1 0.7-0.7 1.2-1.6 1.2-2.6V3.6C28 2.7 27.5 1.7 26.8 1.1zM7.4 11.8c-1.6 0-2.8-1.3-2.8-2.8 0-1.6 1.3-2.8 2.8-2.8 1.6 0 2.8 1.3 2.8 2.8C10.2 10.5 8.9 11.8 7.4 11.8zM20.1 11.8c-1.6 0-2.8-1.3-2.8-2.8 0-1.6 1.3-2.8 2.8-2.8C21.7 6.2 23 7.4 23 9 23 10.5 21.7 11.8 20.1 11.8z"/>
          </svg>
          <p>Enter VR</p>
        </div>

      </template>

      <template v-else-if='canPresentVR && presenting === true'>

        <div class='ui-button ui-red game-vr-button-exit' v-on:click='exitVR'>
          <svg height="100" viewBox="0 0 28 28">
            <path d="M17.6 13.4c0-0.2-0.1-0.4-0.1-0.6 0-1.6 1.3-2.8 2.8-2.8s2.8 1.3 2.8 2.8 -1.3 2.8-2.8 2.8c-0.2 0-0.4 0-0.6-0.1l5.9 5.9c0.5-0.2 0.9-0.4 1.3-0.8 0.7-0.7 1.1-1.6 1.1-2.5V7.4c0-1-0.4-1.9-1.1-2.5 -0.7-0.7-1.6-1-2.5-1H8.1L17.6 13.4z"/>
            <path d="M10.1 14.2c-0.5 0.9-1.4 1.4-2.4 1.4 -1.6 0-2.8-1.3-2.8-2.8 0-1.1 0.6-2 1.4-2.5L0.9 5.1C0.3 5.7 0 6.6 0 7.5v10.7c0 1 0.4 1.8 1.1 2.5 0.7 0.7 1.6 1 2.5 1h5c0.7 0 1.3-0.1 1.8-0.5 0.6-0.3 1-0.8 1.3-1.4l1.3-2.6L10.1 14.2z"/>
            <path d="M25.5 27.5l-25-25C-0.1 2-0.1 1 0.5 0.4l0 0C1-0.1 2-0.1 2.6 0.4l25 25c0.6 0.6 0.6 1.5 0 2.1l0 0C27 28.1 26 28.1 25.5 27.5z"/>
          </svg>
          <p>Exit VR</p>
        </div>

      </template>

      <template v-else>

        <div class='ui-button disabled game-vr-button-na'>
          <svg class="game-vr-button-icon" height="100" viewBox="0 0 28 28">
            <path d="M17.6 13.4c0-0.2-0.1-0.4-0.1-0.6 0-1.6 1.3-2.8 2.8-2.8s2.8 1.3 2.8 2.8 -1.3 2.8-2.8 2.8c-0.2 0-0.4 0-0.6-0.1l5.9 5.9c0.5-0.2 0.9-0.4 1.3-0.8 0.7-0.7 1.1-1.6 1.1-2.5V7.4c0-1-0.4-1.9-1.1-2.5 -0.7-0.7-1.6-1-2.5-1H8.1L17.6 13.4z"/>
            <path d="M10.1 14.2c-0.5 0.9-1.4 1.4-2.4 1.4 -1.6 0-2.8-1.3-2.8-2.8 0-1.1 0.6-2 1.4-2.5L0.9 5.1C0.3 5.7 0 6.6 0 7.5v10.7c0 1 0.4 1.8 1.1 2.5 0.7 0.7 1.6 1 2.5 1h5c0.7 0 1.3-0.1 1.8-0.5 0.6-0.3 1-0.8 1.3-1.4l1.3-2.6L10.1 14.2z"/>
            <path d="M25.5 27.5l-25-25C-0.1 2-0.1 1 0.5 0.4l0 0C1-0.1 2-0.1 2.6 0.4l25 25c0.6 0.6 0.6 1.5 0 2.1l0 0C27 28.1 26 28.1 25.5 27.5z"/>
          </svg>
          <p>VR Not Available</p>
        </div>

      </template>

    </div>

  </div>

  <!--</transition>-->

</template>
