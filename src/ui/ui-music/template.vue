<template>

  <div class='ui-music clickable' v-on:click='toggle'>
    <i class='fa fa-volume-off' v-if='muted === true'></i>
    <i class='fa fa-volume-up' v-else></i>
  </div>

</template>
