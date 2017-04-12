<template>

  <div class='game-helper'>

    <template v-if='finished'>

      <game-helper-finished v-bind:connected='connected'
                            v-bind:eventbus='eventbus'
                            v-bind:score='score'></game-helper-finished>

    </template>

    <template v-else-if='connected && started'>

      <game-helper-running v-bind:eventbus='eventbus'></game-helper-running>

    </template>

    <template v-else-if='connected'>

      <game-helper-ready v-bind:eventbus='eventbus'></game-helper-ready>

    </template>

    <div class='game-helper-error' v-else>

      <div class='ui-infobox'>
        <p>Oh no! The other player was disconnected from the network.</p>
      </div>

      <div class='ui-button-group'>
        <div class='ui-button ui-red' v-on:click='exit'>Exit Game</div>
      </div>

    </div>

  </div>

</template>
