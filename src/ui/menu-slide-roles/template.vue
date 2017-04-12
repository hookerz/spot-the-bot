<template>

  <div class='menu-roles'>

    <div class='ui-infobox'>
      <p class='ui-infobox-header'>Who will play in VR?</p>
      <p>One of you must play in VR, and the other will play on desktop or mobile.</p>
    </div>

    <div class='ui-button-group'>

      <div class='ui-button ui-blue ui-back' v-bind:class='{ disabled: connecting }' v-on:click.stop='back'>
        <i class="fa fa-chevron-left"></i>
      </div>

      <div class='ui-button ui-red' v-bind:class='{ disabled: connecting }' v-on:click.stop='start'>
        <p>Me!</p>
      </div>

      <div class='ui-button ui-red' v-bind:class='{ disabled: connecting }' v-on:click.stop='next'>
        <p>Not it!</p>
      </div>

    </div>

  </div>

</template>
