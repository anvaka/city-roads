
/**
 * This file is responsible for rendering of the grid. It uses my silly 2d webgl
 * renderer which is not very well documented, neither popular, yet it is very
 * fast.
 */
const wgl = require('w-gl');

export default function createScene(canvas) {
  let scene = wgl.scene(canvas);
  scene.setClearColor(0xf7/0xff, 0xf2/0xff, 0xe8/0xff, 1.0);

  let slowDownZoom = false;
  let layers = [];

  listenToEvents();

  return {
    render() {
      scene.renderFrame(true);
    },

    clear() {
      layers.forEach(layer => layer.destroy());
      scene.clear();
    },

    getLayers() {
      return layers;
    },

    dispose() {
      scene.clear();
      scene.dispose();
      unsubscribeFromEvents();
    },

    setLineColor(color) {
      layers.forEach(layer => {
        layer.color = color;
      });
    },

    setBackground(color) {
      scene.setClearColor(color.r/0xff, color.g/0xff, color.b/0xff, color.a);
      scene.renderFrame();
    },

    add(gridLayer) {
      if (layers.indexOf(gridLayer) > -1) return; // O(n).

      gridLayer.bindToScene(scene);
      layers.push(gridLayer);

      if (layers.length === 1) {
        // TODO: Should I do this for other layers?
        let viewBox = gridLayer.getViewBox();
        scene.setViewBox(viewBox);
      }
    },

    getProjectedVisibleRect
  };

  function getProjectedVisibleRect() {
    var leftTop = scene.getSceneCoordinate(0, 0);
    var bottomRight = scene.getSceneCoordinate(window.innerWidth, window.innerHeight);
    let rect = {
      left: leftTop.x,
      top: leftTop.y,
      right: bottomRight.x,
      bottom: bottomRight.y
    };
    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;

    return rect;
  }

  function listenToEvents() {
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
  }

  function unsubscribeFromEvents() {
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('keyup', onKeyUp, true);
  }

  function onKeyDown(e) {
    if (e.shiftKey) {
      slowDownZoom = true;
      scene.getPanzoom().setZoomSpeed(0.1);
    } 
  }

  function onKeyUp(e) {
    if (!e.shiftKey && slowDownZoom) {
      scene.getPanzoom().setZoomSpeed(1);
      slowDownZoom = false;
    }
  }
}