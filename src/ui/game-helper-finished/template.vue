<template>

  <div class='game-helper-finished'>

    <div class='ui-infobox'>

      <p>You found <span class='game-helper-super-score'>{{ score || 0 }}</span> {{ (score === 1) ? 'bot' : 'bots' }}!</p>

    </div>

    <div class='ui-button-group'>

      <div class='ui-button ui-red game-helper-restart'
           v-bind:class='{ disabled: !connected }'
           v-on:click='restart'>
        <p>Play again</p>
      </div>

      <div class='ui-button ui-red game-helper-exit' v-on:click='exit'>
        <p>Exit Game</p>
      </div>

    </div>

  </div>

</template>
