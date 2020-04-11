
<template>
<div class='vue-colorpicker' @click='showPicker = true' v-click-outside='hide' >
  <span class='vue-colorpicker-btn' :style='btnStyle' ref='triggerButton'></span>
  <div class='vue-colorpicker-panel' v-show='showPicker' :style="{left: panelLeft, top: panelTop}">
    <component :is='pickerType' v-model='colors' @input='changeColor'></component>
  </div>
</div>
</template>

<script>
import tinycolor from 'tinycolor2'
import { Sketch } from 'vue-color'
import ClickOutside from './clickOutside.js'

export default {
  name: 'vue-colorpicker',
  components: {
    'sketch-picker': Sketch,
  },
  directives: { ClickOutside },
  props: {
    value: {
      type: Object,
    },
  },
  data () {
    return {
      showPicker: false,
      colors: {
        hex: '#FFFFFF',
        a: 1
      },
      colorValue: '#FFFFFF',
      panelLeft: '0px',
      panelTop: '0px'
    }
  },
  computed: {
    pickerType () {
      return 'sketch-picker';
    },
    isTransparent () {
      return this.colors.a === 0;
    },
    btnStyle () {
      if (this.isTransparent) {
        return {
          background: '#eee',
          backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,.25) 25%, transparent 0, transparent 75%,rgba(0,0,0,.25)0), linear-gradient(45deg, rgba(0,0,0,.25)25%,transparent 0, transparent 75%,rgba(0,0,0,.25)0)',
          backgroundPosition: '0 0, 11px 11px',
          backgroundSize: '22px 22px'
        }
      }
      let {r, g, b, a} = this.colorValue;
      return {
        background: `rgba(${r}, ${g}, ${b}, ${a})`
      }
    },
  },
  watch: {
    value (val, oldVal) {
      if (val !== oldVal) {
        this.updateColorObject(val);
      }
    },
    showPicker(newVal) {
      if (!newVal) return;

      const PICKER_WIDTH = 220;
      const PANEL_HEIGHT = 320;
      let triggerRect = this.$refs.triggerButton.getBoundingClientRect();
      let desiredLeft = triggerRect.x;
      let desiredTop = triggerRect.bottom;
      if (triggerRect.y + PANEL_HEIGHT > window.innerHeight) {
        desiredTop = Math.max(0, window.innerHeight - PANEL_HEIGHT);
        desiredLeft += 36; // so that the selector button is still visible;
      }
      if (desiredLeft + PICKER_WIDTH > window.innerWidth) {
        desiredLeft = Math.max(0, window.innerWidth - PICKER_WIDTH);
      } 
      this.panelLeft = desiredLeft + 'px';
      this.panelTop = desiredTop + 'px';
    }
  },

  methods: {
    hide () {
      this.showPicker = false;
    },
    changeColor (data) {
      this.colorValue = data.rgba;
      this.$emit('input', this.colorValue)
      this.$emit('change', this.colorValue)
    },
    updateColorObject (color) {
      if (!color) return
      const colorObj = tinycolor(color);
      if (!color || color === 'transparent') {
        this.colors = {
          hex: '#FFFFFF',
          hsl: { h: 0, s: 0, l: 1, a: 0 },
          hsv: { h: 0, s: 0, v: 1, a: 0 },
          rgba: { r: 255, g: 255, b: 255, a: 0 },
          a: 0
        };
      } else {
        this.colors = {
          hex: colorObj.toHexString(),
          hsl: colorObj.toHsl(),
          hsv: colorObj.toHsv(),
          rgba: colorObj.toRgb(),
          a: colorObj.getAlpha()
        };
      }
      this.colorValue = this.colors.rgba;
    }
  },
  mounted () {
    this.updateColorObject(this.value)
  }
}
</script>

<style lang="stylus" scoped>
.vue-colorpicker {
  display: inline-block;
  box-sizing: border-box;
  font-size: 0;
  cursor: pointer;
  &-btn {
    display: inline-block;
    width: 30px;
    height: 22px;
    border: 1px solid #666;
    background: #FFFFFF;
  }

  .vue-colorpicker-panel {
    position: absolute;
    z-index: 1;
  }
}
</style>