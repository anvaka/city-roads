<template>
<div>
  <find-place v-if='!placeFound' @loaded='onGridLoaded'></find-place>
  <div id="app">
    <div v-if='placeFound'>
      <div class='controls'>
        <a href="#" class='print-button' @click.prevent='togglePrintWindow'>Customize...</a>
        <a href="#" class='try-another' @click.prevent='startOver'>Try another city</a>
      </div>
      <div v-if='showPrintWindow' class='print-window'>
        <h3>Display</h3>
        <div class='row'>
          <div class='col'>Colors</div>
          <div class='col colors c-2'>
            <div class='color-container'>
              <color-picker v-model='lineColor' @change='updateLinesColor'></color-picker>
              <div class='color-label'>lines</div>
            </div>

            <div class='color-container'>
              <color-picker v-model='backgroundColor' @change='updateBackground'></color-picker>
              <div class='color-label'>background</div>
            </div>

            <div class='color-container'>
              <color-picker v-model='labelColor'></color-picker>
              <div class='color-label'>labels</div>
            </div>
          </div>
        </div>

        <h3>Export</h3>
        <div class='row'>
          <a href='#' @click.prevent='zazzleMugPrint()' class='col'>Onto a mug</a> 
          <span class='col c-2'>
            Print what you see onto a mug. <br/>Get a unique gift of your favorite city.
          </span>
        </div>
        <div class='preview-actions message' v-if='zazzleLink || generatingPreview'>
            <div v-if='zazzleLink' class='padded popup-help'>
              If your browser has blocked the new window, <br/>please <a :href='zazzleLink' target='_blank'>click here</a>
              to open it.
            </div>
            <div v-if='generatingPreview' class='loading-container'>
              <loading-icon></loading-icon>
              Generating preview url...
            </div>
        </div>
        <div class='row'>
          <a href='#'  @click.prevent='toPNGFile' class='col'>As an image (.png)</a> 
          <span class='col c-2'>
            Save the current screen as a raster image.
          </span>
        </div>
        
        <div class='row'>
          <a href='#'  @click.prevent='toSVGFile' class='col'>As a vector (.svg)</a> 
          <span class='col c-2'>
            Save the current screen as a vector image.
          </span>
        </div>
        <div v-if='false' class='row'>
          <a href='#' @click.prevent='toProtobuf' class='col'>To a .PBF file</a> 
          <span class='col c-2'>
            Save the current data as a protobuf message. For developer use only.
          </span>
        </div>

        <h3>About</h3>
        <div>
          <p>This website was created by <a href='https://twitter.com/anvaka' target='_blank'>@anvaka</a>.
          It downloads roads from OpenStreetMap and renders them with WebGL.
          </p>
          <p>
           You can find the entire <a href='https://github.com/anvaka/city-roads'>source code here</a>. 
           If you love this website you can also <a href='https://www.paypal.com/paypalme2/anvakos/3'>buy me a coffee</a>, but you don't have to!
          </p>
        </div>
      </div>
      <editable-label v-model='name' class='city-name' :printable='true' :style='{color: labelColorRGBA}'></editable-label>
      <div class='license printable' :style='{color: labelColorRGBA}'>data <a href='https://www.openstreetmap.org/about/' target="_blank" :style='{color: labelColorRGBA}'>© OpenStreetMap</a></div>
    </div>
  </div>
  </div>
</template>

<script>
import FindPlace from './components/FindPlace';
import LoadingIcon from './components/LoadingIcon';
import EditableLabel from './components/EditableLabel';
import ColorPicker from './components/ColorPicker';
import createScene from './lib/createScene';
import GridLayer from './lib/GridLayer';
import generateZazzleLink from './lib/getZazzleLink';
import appState from './lib/appState';
import protobufExport from './lib/protobufExport';
import svgExport from './lib/svgExport';
import config from './config';
import './lib/canvas2BlobPolyfill';
import bus from './lib/bus';

let lastGrid;

export default {
  name: 'App',
  components: {
    FindPlace,
    LoadingIcon,
    EditableLabel,
    ColorPicker
  },
  data() {
    return {
      placeFound: false,
      name: '',
      zazzleLink: null,
      generatingPreview: false,
      showPrintWindow: false,
      settingsOpen: false,
      lineColor: config.getDefaultLineColor().toRgb(),
      labelColor: config.getLabelColor().toRgb(),
      backgroundColor: config.getBackgroundColor().toRgb(),
    }
  },
  computed: {
    labelColorRGBA() {
      return toRGBA(this.labelColor);
    }
  },
  created() {
    bus.$on('scene-transform', this.handleSceneTransform);
    bus.$on('background-color', this.syncBackground);
    bus.$on('line-color', this.syncLineColor);
  },
  
  beforeDestroy() {
    this.dispose();
    bus.$off('scene-transform', this.handleSceneTransform);
    bus.$off('background-color', this.syncBackground);
    bus.$off('line-color', this.syncLineColor);
  },
  methods: {
    dispose() {
      if (this.scene) {
        this.scene.dispose();
        window.scene = null;
      }
    },
    togglePrintWindow() {
      this.showPrintWindow = !this.showPrintWindow;
    },
    handleSceneTransform() {
      this.zazzleLink = null;
    },
    onGridLoaded(grid) {
      if (grid.isArea) {
        appState.set('areaId', grid.id);
        appState.unset('osm_id');
        appState.unset('bbox');
      } else if (grid.bboxString) {
        appState.unset('areaId');
        appState.set('osm_id', grid.id);
        appState.set('bbox', grid.bboxString);
      }
      this.placeFound = true;
      this.name = grid.name.split(',')[0];
      lastGrid = grid;
      let canvas = getCanvas();
      canvas.style.visibility = 'visible';

      this.scene = createScene(canvas);
      window.scene = this.scene;

      let gridLayer = new GridLayer();
      gridLayer.id = 'main';
      gridLayer.setGrid(grid);
      this.scene.add(gridLayer)
    },

    startOver() {
      appState.unset('areaId');
      appState.unsetPlace();
      appState.unset('q');
      appState.enableCache();

      this.dispose();
      this.placeFound = false;
      this.zazzleLink = null;
      this.showPrintWindow = false;
      this.backgroundColor = config.getBackgroundColor().toRgb();
      this.lineColor = config.getDefaultLineColor().toRgb();
      this.labelColor = config.getLabelColor().toRgb();

      document.body.style.backgroundColor = config.getBackgroundColor().toRgbString();
      getCanvas().style.visibility = 'hidden';
    },

    toPNGFile(e) {
      let printableCanvas = this.getPrintableCanvas();
      let fileName = this.getFileName();
      printableCanvas.toBlob(function(blob) {
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = fileName + '.png';
        a.click();
        window.URL.revokeObjectURL(url);
      }, 'image/png')
    },

    toSVGFile(e) { 
      let visibleRect = scene.getProjectedVisibleRect();
      let layers = scene.queryLayerAll();

      let svg = svgExport(layers, visibleRect, {
        background: scene.background.toHexString(),
        labels: collectText()
      });
      let blob = new Blob([svg], {type: "image/svg+xml"});
      let url = window.URL.createObjectURL(blob);
      // For some reason, safari doesn't like when download happens on the same
      // event loop cycle. Pushing it to the next one.
      setTimeout(() => {
        let a = document.createElement("a");
        a.href = url;
        a.download = lastGrid.id + '.svg';
        a.click();
        window.URL.revokeObjectURL(url);
      }, 30)
    },

    getFileName(extension) {
      let fileName = ((new Date().toISOString())).replace(/[\s\W]/g, '_');
      return fileName + (extension || '');
    },

    toProtobuf(e) {
      if (!lastGrid) return;

      let arrayBuffer = protobufExport(lastGrid);
      let blob = new Blob([arrayBuffer.buffer], {type: "application/octet-stream"});
      let url = window.URL.createObjectURL(blob);
      let a = document.createElement("a");
      a.href = url;
      a.download = lastGrid.id + '.pbf';
      a.click();
      window.URL.revokeObjectURL(url);
    },

    updateLinesColor() {
      this.scene.lineColor = this.lineColor;
      this.zazzleLink = null;
    },

    syncLineColor(newColor) {
      this.lineColor = newColor.toRgb();
    },

    syncBackground(newBackground) {
      this.backgroundColor = newBackground.toRgb();
    },
    // TODO: I need two background methods?
    updateBackground() {
      this.setBackgroundColor(this.backgroundColor)
      this.zazzleLink = null;
    },
    setBackgroundColor(c) {
      this.scene.background = c;
      document.body.style.backgroundColor = toRGBA(c);
      this.zazzleLink = null;
    },

    zazzleMugPrint() {
      if (this.zazzleLink) {
        window.open(this.zazzleLink, '_blank');
        recordOpenClick(this.zazzleLink);
        return;
      }

      let printableCanvas = this.getPrintableCanvas();

      this.generatingPreview = true;
      generateZazzleLink(printableCanvas).then(link => {
        this.zazzleLink = link;
        window.open(link, '_blank');
        recordOpenClick(link);
        this.generatingPreview = false;
      }).catch(e => {
        this.error = e;
        this.generatingPreview = false;
      });
    },

    getPrintableCanvas() {
      let cityCanvas = getCanvas();
      let width = cityCanvas.width;
      let height = cityCanvas.height;

      let printable = document.createElement('canvas');
      let ctx = printable.getContext('2d');
      printable.width = width;
      printable.height = height;
      this.scene.render();
      ctx.drawImage(cityCanvas, 0, 0, cityCanvas.width, cityCanvas.height, 0, 0, width, height);

      if (appState.drawLabels) {
        collectText().forEach(label => {
          drawHtml(label, ctx);
        })
      }

      return printable;
    }
  }
}

function collectText() {
  return Array.from(
    document.querySelectorAll('.printable')
  ).map(element => {
    let computedStyle = window.getComputedStyle(element);
    let bounds = element.getBoundingClientRect();
    let fontSize = Number.parseInt(computedStyle.fontSize, 10);

    return {
      text: element.innerText,
      bounds,
      fontSize,
      color: computedStyle.color,
      fontFamily: computedStyle.fontFamily,
      fill: computedStyle.color,
    }
  });
}

function toRGBA(c) {
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

function drawHtml(element, ctx) {
  if (!element) return;

  ctx.save();

  let dpr = window.devicePixelRatio || 1;
  ctx.font = dpr * element.fontSize + 'px ' + element.fontFamily;
  ctx.fillStyle = element.color;
  ctx.textAlign = 'end'
  ctx.fillText(element.text, element.bounds.right * dpr, element.bounds.bottom * dpr)
  ctx.restore();
}

function getCanvas() {
  return document.querySelector('#canvas')
}

function recordOpenClick(link) {
  if (typeof ga === 'undefined') return;

  ga('send', 'event', {
      eventCategory: 'Outbound Link',
      eventAction: 'click',
      eventLabel: link
    });
}
</script>

<style lang='stylus'>
@import('./vars.styl');

#app {
  margin: 8px;
  max-height: 100vh;
  position: absolute;
  h3 {
    font-weight: normal;
  }
}

.controls {
  height: 48px;
  background: white;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: desktop-controls-width;
  justify-content: space-around;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);

  a {
    text-decoration: none;
    display: flex;
    justify-content: center;
    align-items: center;
    color: highlight-color;
    margin: 0;
    border: 0;
    &:hover {
      color: emphasis-background;
      background: highlight-color;
    }
  }
  a.try-another {
    flex: 1;
  }

  a.print-button {
    flex: 1;
    border-right: 1px solid border-color;
    &:focus {
      border: 1px dashed highlight-color;
    }
  }
}

.col {
    display: flex;
    flex: 1;
    select {
      margin-left: 14px;
    }
  }
.row {
  margin-top: 4px;
  display: flex;
  flex-direction: row;
  min-height: 32px;
}
.colors {
  display: flex;
  flex-direction: row;

  .color-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 64px;
  }

  .color-label {
    font-size: 12px;
  }
}

a {
  border: 1px solid transparent;
  margin: -1px;
  text-decoration: none;
  color: highlight-color
}
a:focus {
  border: 1px dashed highlight-color;
  outline: none;
}
.print-window {
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  border-top: 1px solid border-color;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  width: desktop-controls-width;
  padding: 8px;
  .row a {
    margin-right: 4px;
  }

  h3 {
    margin: 8px 0;
    text-align: right;
  }
}

.message {
  border-top: 1px solid border-color
  border-bottom: 1px solid border-color
  background: #F5F5F5;
}

.preview-actions {
  display: flex;
  padding: 8px 0;
  margin-left: -8px;
  margin-bottom: 14px;
  margin-top: 1px;
  width: desktop-controls-width;
  flex-direction: column;
  align-items: stretch;
  font-size: 14px;
  align-items: center;
  display: flex;

  .popup-help {
    text-align: center;
  }
}

.city-name {
  position: fixed;
  right: 32px;
  bottom: 54px;
  font-size: 24px;
  color: #434343;
  input {
    font-size: 24px;
  }
}

.license {
  text-align: right;
  position: fixed;
  font-family: labels-font;
  right: 32px;
  bottom: 32px;
  font-size: 12px;
  padding-right: 8px;
  a {
    text-decoration: none;
    display: inline-block;
  }
}

.c-2 {
  flex: 2
}

@media (max-width: small-screen) {
  #app {
    width: 100%;
    margin: 0;

    .preview-actions,.error,
    .controls, .print-window {
      width: 100%;
    }
    .loading-container {
      font-size: 12px;
    }

    .license  {
      right: 8px;
      bottom: 8px;
    }
    .print-window {
      font-size: 14px;
    }

    .city-name  {
      right: 8px;
      bottom: 24px;
    }
  }
}

</style>
