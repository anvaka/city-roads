// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import NoWebGL from './NoWebGL'
const wgl = require('w-gl');

Vue.config.productionTip = false

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
