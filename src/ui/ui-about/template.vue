<template>

  <div class='ui-about'>

    <div v-show='expanded' class='ui-about-takeover'>

      <div class='ui-about-container'>
        <p>Spot-the-Bot is a cooperative WebVR game for two players.</p>
        <p>Spot-the-Bot was made possible thanks to the WC3's WebVR v1.1 standard. WebVR allows supporting web browsers to communicate with any VR-capable device from Google Cardboard up to HTC Vive and Oculus Rift without requiring any additional downloads.</p>
        <p>Technologies used: <a href='https://webvr.info/' target='_blank'>WebVR</a>, <a href='https://github.com/googlevr/webvr-polyfill' target='_blank'>webvr-pollyfill</a>, <a href='https://firebase.google.com/' target='_blank'>Firebase</a>, <a href='https://threejs.org/' target='_blank'>three.js</a>, <a href='https://vuejs.org/' target='_blank'>vue.js</a>, <a href='http://rollupjs.org/' target='_blank'>rollup.js</a>, <a href='http://stylus-lang.com/' target='_blank'>Stylus</a></p>
        <p>The full source code is available on GitHub <a href='https://github.com/hookerz/spot-the-bot' target='_blank'>here</a>.</p>
        <p>Made by <a href='http://byhook.com' target='_blank'>Hook Studios</a>.</p>
      </div>

      <div v-on:click.stop='toggleExpanded' class='ui-about-close clickable'>
        <i class='fa fa-times'></i>
      </div>

    </div>

    <div v-show='!expanded' v-on:click.stop='toggleExpanded' class='ui-about-open clickable'>
      <i class='fa fa-question'></i>
    </div>

  </div>

</template>
