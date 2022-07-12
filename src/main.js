// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import {createApp} from 'vue';
import {require as d3Require} from 'd3-require';
import {isWebGLEnabled} from 'w-gl';
import App from './App.vue';
import NoWebGL from './NoWebGL.vue';
import Query from './lib/Query.js';

// const wgl = require('w-gl');

window.addEventListener('error', logError);

// expose the console API
window.requireModule = d3Require;
window.Query = Query;

if (isWebGLEnabled(document.querySelector('#canvas'))) {
  createApp(App).mount('#host');
} else {
  createApp(NoWebGL).mount('#host');
}

function logError(e) {
  if (typeof ga !== 'function') return;

  const exDescription = e ? `${e.message} in ${e.filename}:${e.lineno}` : 'Unknown exception';

  ga('send', 'exception', {
    exDescription,
    exFatal: false
  });
}