<template>

  <div class='game-helper-running'>

    <div class='game-helper-info'>

      <div class='game-helper-score'>

        <p class='game-helper-label'>Found</p>
        <p class='game-helper-value'>{{ score }}</p>

      </div>

      <div class='game-helper-clock'>

        <p class='game-helper-label'>Time</p>
        <p class='game-helper-value'>{{ time }}</p>

        <game-helper-time-alert v-for='alert in timeAlerts'
                                v-bind:id='alert.id'
                                v-bind:key='alert.id'
                                v-bind:delta='alert.delta'
                                v-on:dead='onTimeAlertDead'>
        </game-helper-time-alert>

      </div>

    </div>

    <div class='game-helper-actions'>

      <div class='game-helper-pass ui-button ui-red' :class='{ disabled: this.passRecovery < 1 }' @click='onPass'>
        <div class='game-helper-recovery' :style="{ top: (1 - passRecovery) * 100 + '%' }"></div>
        <i class='fa fa-step-forward'></i>
        <p>Skip</p>
      </div>

    </div>

  </div>

</template>
