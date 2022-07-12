// Based on https://github.com/ElemeFE/element/blob/dev/src/utils/clickoutside.js
// The MIT License (MIT), Copyright (c) 2016 ElemeFE
// (C) 2022 anvaka
const nodeList = [];
const ctx = '@@clickoutsideContext';

let startClick;
let seed = 0;

document.addEventListener('mousedown', e => (startClick = e), true);
document.addEventListener('mouseup', e => {
  nodeList.forEach(node => node[ctx].documentHandler(e, startClick));
}, true);

// Also hide when tapped outside.
document.addEventListener('touchstart', e => {
  startClick = e;
}, true);
document.addEventListener('touchend', e => {
  nodeList.forEach(node => node[ctx].documentHandler(e, startClick));
}, true);

function createDocumentHandler(el, binding, vnode) {
  return function(mouseup = {}, mousedown = {}) {
    if (!vnode || !mouseup.target || !mousedown.target ||
      el.contains(mouseup.target) || el.contains(mousedown.target) || el === mouseup.target) return;

    const methodName = el[ctx].handler;
    if (methodName) methodName()
  };
}

export default {
  created(el, binding, vnode) {
    nodeList.push(el);
    const id = seed++;
    el[ctx] = {
      id,
      documentHandler: createDocumentHandler(el, binding, vnode),
      handler: binding.value
    };
  },

  updated(el, binding, vnode) {
    el[ctx].documentHandler = createDocumentHandler(el, binding, vnode);
    el[ctx].handler = binding.value;
  },

  unmounted(el) {
    let len = nodeList.length;

    for (let i = 0; i < len; i++) {
      if (nodeList[i][ctx].id === el[ctx].id) {
        nodeList.splice(i, 1);
        break;
      }
    }
    delete el[ctx];
  }
};