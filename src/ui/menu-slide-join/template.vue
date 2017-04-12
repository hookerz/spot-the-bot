<template>

  <div class='menu-slide-join'>

    <div class='ui-infobox'>
      <p class='ui-infobox-header'>Enter Room Code</p>
      <p>Get the room code from your friend in VR.</p>
    </div>

    <div class='ui-button-group'>

      <div class='ui-button ui-blue ui-back' v-bind:class='{ disabled: connecting }' v-on:click='back'>
        <i class="fa fa-chevron-left"></i>
      </div>

      <div ref='facade' class='menu-slide-join-input clickable' v-bind:class='{ focused: focused }' v-on:click='focusHiddenInput'>

        <p v-for='n in 4' v-bind:class='{ empty: room.length < n }' class='menu-slide-join-input-block'>{{ room.charAt(n - 1) || '_' }}</p>

        <input ref='input'
               v-on:keyup.enter='start'
               v-on:input='extractRoomValue'
               v-on:keyup='resetInputSelection'
               v-on:click='resetInputSelection'
               v-on:focus='focused = true'
               v-on:blur='focused = false'
               type='text' maxlength='4'>
        </input>

      </div>

      <div class='ui-button ui-red'
           v-bind:class='{ disabled: connecting || invalidRoomID }'
           v-on:click.stop='start'>
        <p>Join<p>
      </div>

    </div>

  </div>

</template>
