<template>
  <div v-click-outside='looseFocus' class='can-drag'>
    <div class='editable-label'>
      <span :class='{printable}'>{{value}}</span>
      <input
        v-bind:value="value"
        v-on:input="$emit('input', $event.target.value)"
        ref='input'
      >
    </div>
  </div>
</template>
<script>
import ClickOutside from './clickOutside.js'

export default {
  name: 'EditableLabel',
  props: ['value', 'printable', 'overlayManager'],
  directives: { ClickOutside },
  mounted() {
    this.$el.receiveFocus = this.focus;
    this.$el.style.pointerEvents = 'none';
  },
  methods: {
    looseFocus() {
      this.$refs.input.blur();
    },
    focus() {
      this.$refs.input.focus();
    }
  }
}
</script>
<style lang="stylus">
@import('../vars.styl');

.editable-label {
  position: relative;

  span {
    position: relative;
    top: 0;
    left: 0;
    display: flex;
    align-items : center;
    font-family: labels-font;
    white-space: pre;
    padding: 8px;
    border: 1px solid transparent;
  }

  input {
    caret-color: primary-text;
    color: transparent;
    font-family: labels-font;
    background: transparent;
    display: flex;
    align-items: center;
    position: absolute;
    overflow: hidden;
    top: 0;
    left: 0;
    width: 100%;
    padding: 8px;
  }
}
  
</style>