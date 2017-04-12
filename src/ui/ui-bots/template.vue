<template>

  <transition v-bind:css='false'
              v-on:enter='enter'
              v-on:after-enter='entered'>

    <div class='ui-bots' v-once>
      <div class='ui-bots-container'>
        <img class='ui-bot ui-bot-1' ref='menu-bot-1' src='images/background-bot-blue-4.png'>
        <img class='ui-bot ui-bot-2' ref='menu-bot-2' src='images/background-bot-green-5.png'>
        <img class='ui-bot ui-bot-3' ref='menu-bot-3' src='images/background-bot-red-1.png'>
        <img class='ui-bot ui-bot-4' ref='menu-bot-4' src='images/background-bot-blue-6.png'>
      </div>
    </div>

  </transition>

</template>
