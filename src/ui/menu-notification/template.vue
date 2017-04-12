<template>

    <div v-bind:class='{ "menu-error": error }' class='menu-notification clickable'>
      <i v-if='error' class='fa fa-warning'></i>
      <slot>An unknown error occurred.</slot>
    </div>

</template>
