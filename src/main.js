// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import NoWebGL from './NoWebGL'
import load from './lib/load';

const wgl = require('w-gl');

window.addEventListener('error', logError);

Vue.config.productionTip = false

// expose the console API
window.load = load;

if (wgl.isWebGLEnabled(document.querySelector('#canvas'))) {
  /* eslint-disable no-new */
  new Vue({
    el: '#app',
    components: { App },
    template: '<App/>'
  })
} else {
  new Vue({
    el: '#app',
    components: { NoWebGL },
    template: '<NoWebGL/>'
  })
}

function logError(e) {
  if (typeof ga !== 'function') return;

  const exDescription = e ? `${e.message} in ${e.filename}:${e.lineno}` : 'Unknown exception';

  ga('send', 'exception', {
    exDescription,
    exFatal: false
  });
}