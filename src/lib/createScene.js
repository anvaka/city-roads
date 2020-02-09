import bus from './bus';
import GridLayer from './GridLayer';
import Query from './Query';
import LoadOptions from './LoadOptions.js';
import config from '../config';
import tinycolor from 'tinycolor2';

/**
 * This file is responsible for rendering of the grid. It uses my silly 2d webgl
 * renderer which is not very well documented, neither popular, yet it is very
 * fast.
 */
const wgl = require('w-gl');

export default function createScene(canvas) {
  let scene = wgl.scene(canvas);
  scene.on('transform', triggerTransform);

  scene.setClearColor(0xf7/0xff, 0xf2/0xff, 0xe8/0xff, 1.0);

  let gl = scene.getGL();
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let slowDownZoom = false;
  let layers = [];
  let backgroundColor = config.getBackgroundColor();

  listenToEvents();

  let sceneAPI = {
    /**
     * Requests the scene to perform immediate re-render
     */
    render() {
      scene.renderFrame(true);
    },

    /**
     * Removes all layers in the scene
     */
    clear() {
      layers.forEach(layer => layer.destroy());
      layers = [];
      scene.clear();
    },

    /**
     * Returns all layers in the scene.
     */
    queryLayerAll,

    /**
     * Same as `queryLayerAll(filter)` but returns the first found
     * match. If no matches found - returns undefined.
     */
    queryLayer,
    
    getRenderer() {
      return scene;
    },

    getWGL() {
      return wgl;
    },

    version() {
      return '0.0.1'; // here be dragons
    },

    /**
     * Destroys the scene, cleans up all resources.
     */
    dispose() {
      scene.clear();
      scene.dispose();
      unsubscribeFromEvents();
    },

    /**
     * Uniformly sets color to all loaded grid layer.
     */
    set lineColor(color) {
      layers.forEach(layer => {
        layer.color = color;
      });
      bus.$emit('line-color', tinycolor(color));
    },

    get lineColor() {
      let firstLayer = queryLayer();
      return (firstLayer && firstLayer.color) || config.getDefaultLineColor();
    },

    /**
     * Sets the background color of the scene
     */
    set background(rawColor) {
      backgroundColor = tinycolor(rawColor);
      let c = backgroundColor.toRgb();
      scene.setClearColor(c.r/0xff, c.g/0xff, c.b/0xff, c.a);
      scene.renderFrame();
      bus.$emit('background-color', backgroundColor);
    },

    get background() {
      return backgroundColor;
    },

    add,

    load,

    getProjectedVisibleRect
  };

  return sceneAPI; // Public bit is over. Below are just implementation details.

  /**
   * Experimental API. Can be changed/removed at any point.
   */
  function load(queryFilter, rawOptions) {
    let options = LoadOptions.parse(sceneAPI, queryFilter, rawOptions);

    let layer = new GridLayer();
    layer.id = options.place;

    // TODO: Cancellation logic?
    Query.runFromOptions(options).then(grid => {
      grid.setProjector(options.projector);
      layer.setGrid(grid);
    }).catch(e => {
      console.error(`Could not execute:
  ${queryFilter}
  The error was:`);
      console.error(e);
      layer.destroy();
    });
  
    add(layer);
    return layer;
  }

  function queryLayerAll(filter) {
    if (!filter) return layers;

    return layers.filter(layer => {
      return layer.id === filter;
    });
  }

  function queryLayer(filter) {
    let result = queryLayerAll(filter);
    if (result) return result[0];
  }

  function add(gridLayer) {
    if (layers.indexOf(gridLayer) > -1) return; // O(n).

    gridLayer.bindToScene(scene);
    layers.push(gridLayer);

    if (layers.length === 1) {
      // TODO: Should I do this for other layers?
      let viewBox = gridLayer.getViewBox();
      scene.setViewBox(viewBox);
    }
  }

  function triggerTransform() {
    bus.$emit('scene-transform');
  }

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