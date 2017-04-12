<template>

  <!--<transition appear v-bind:css='false'-->
              <!--v-on:enter='enter'-->
              <!--v-on:leave='leave'>-->

  <div class='menu-slide-htp'>

    <div class='ui-infobox'>
      <p class='ui-infobox-header'>How to Play</p>
      <ul>
        <li>The VR player spots the bots.</li>
        <li>The non-VR player describes the bots.</li>
        <li>Spot as many bots as you can before time runs out! Correct guesses add time, wrong guesses subtract time.</li>
      </ul>
    </div>

    <div class='ui-button-group'>

      <div class='ui-button ui-blue ui-back' v-on:click='back'>
        <i class="fa fa-chevron-left"></i>
      </div>

      <div class='ui-button ui-red' v-on:click='next'>
        <p>Pick a role</p>
      </div>

    </div>

  </div>

  <!--</transition>-->

</template>
