<template>

  <div class='ui-root' v-if='(mobile && webvrPresenting) === false'>

    <template v-if='webglSupported === false'>

      <warn-webgl></warn-webgl>

    </template>

    <template v-else-if='loaded === false'>

      <ui-load v-bind:eventbus='eventbus'
               v-bind:manifest='manifest'
               v-on:complete='onPrimaryLoad'>
      </ui-load>

    </template>

    <template v-else>

      <ui-background v-if='showUI'></ui-background>

      <div class='ui-top-actions'>
        <ui-music v-bind:eventbus='eventbus'></ui-music>
        <ui-about></ui-about>
      </div>

      <ui-title v-if='showUI'></ui-title>

      <component v-bind:is='view'
                 v-bind:players='players'
                 v-bind:network='network'
                 v-bind:eventbus='eventbus'>
      </component>

      <div class='ui-bottom-actions' v-if='showUI'>
        <ui-badges></ui-badges>
        <ui-share></ui-share>
      </div>

      <ui-bots v-if='showUI && mobile === false'></ui-bots>

      <!-- block interaction while in landscape -->
      <warn-portrait v-if='mobile'></warn-portrait>

    </template>

  </div>

</template>
