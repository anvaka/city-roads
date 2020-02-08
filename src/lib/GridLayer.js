import config from '../config';
import tinycolor from 'tinycolor2';

const wgl = require('w-gl');
let counter = 0;

export default class GridLayer {
  get color() {
    return this._color;
  }

  set color(unsafeColor) {
    let color = tinycolor(unsafeColor);
    this._color = color;
    if (this.lines) {
      this.lines.color = toRatioColor(color.toRgb());
    }
    if (this.scene) {
      this.scene.renderFrame();
    }
  }

  constructor() {
    this._color = tinycolor(config.getDefaultLineColor());
    this.grid = null;
    this.lines = null;
    this.scene = null;
    this.dx = 0;
    this.dy = 0;
    this.scale = 1;
    this.id = 'paths_' + counter;
    counter += 1;
  }

  getGridProjector() {
    if (this.grid) {
      return this.grid.projector;
    }
  }

  setGrid(grid) {
    this.grid = grid;
    if (this.scene) {
      this.bindToScene(this.scene);
    }
  }

  getViewBox() {
    if (!this.grid) return null;

    let {width, height} = this.grid.getProjectedRect();
    let initialSceneSize = Math.max(width, height) / 4;
    return {
      left:  -initialSceneSize,
      top:   -initialSceneSize,
      right:  initialSceneSize,
      bottom: initialSceneSize,
    };
  }

  moveTo(x, y = 0) {
    this.dx = x;
    this.dy = y;

    this._transferTransform();
  }

  moveBy(dx, dy = 0) {
    this.dx += dx;
    this.dy += dy;

    this._transferTransform();
  }

  getLinesCollection() {
    if (this.lines) return this.lines;

    let grid = this.grid;
    let lineWidth = 1;
    let lines;
    if (lineWidth < 2) {
      // Wire collection cannot have width, this reduces amount of memory it needs
      // though doesn't let us render nice thick lines.
      lines = new wgl.WireCollection(grid.wayPointCount);
      grid.forEachWay(function(from, to) {
        lines.add({from, to});
      });
    }  else {
      // This is not exposed anywhere, gives thick lines, though the caps are
      // jagged.
      lines = new wgl.LineCollection(grid.wayPointCount);
      grid.forEachWay(function(from, to) {
        let ui = lines.add({from, to});
        ui.setWidth(lineWidth);
        ui.update(from, to);
      });
    }

    let color = tinycolor(this._color).toRgb();
    lines.color = toRatioColor(color);

    this.lines = lines;
    return lines;
  }

  destroy() {
    if (!this.scene || !this.lines) return;

    // TODO: This should remove the grid layer too. Need to clean up how
    // scene interacts with grid layers.
    this.scene.removeChild(this.lines);
  }

  bindToScene(scene) {
    if (this.scene && this.lines) {
      console.error('You seem to be adding this layer twice...')
    }

    this.scene = scene;
    if (!this.grid) return;

    let lines = this.getLinesCollection();
    this.scene.appendChild(lines);
  }

  _transferTransform() {
    if (!this.lines) return;

    this.lines.transform.dx = this.dx;
    this.lines.transform.dy = this.dy;
    this.lines.transform.scale = this.scale;
    this.lines.updateWorldTransform(true);
    if (this.scene) {
      this.scene.renderFrame(true);
    }
  }
}

function toRatioColor(c) {
  return {r: c.r/0xff, g: c.g/0xff, b: c.b/0xff, a: c.a}
}