import config from '../config';
import tinycolor from 'tinycolor2';

const wgl = require('w-gl');

export default class GridLayer {
  static fromQuery(query) {
    let layer = new GridLayer();

    query.run().then(grid => {
      layer.setGrid(grid);
    });

    return layer;
  }

  constructor() {
    this.color = config.getDefaultLineColor();
    this.grid = null;
    this.lines = null;
  }

  setGrid(grid) {
    this.grid = grid;
  }

  setLineColor(unsafeColor) {
    let color = tinycolor(unsafeColor);
    this.color = color;
    if (this.lines) {
      this.lines.color = toRatioColor(color.toRgb());
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
    }
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

    let color = tinycolor(this.color).toRgb();
    lines.color = toRatioColor(color);

    this.lines = lines;
    return lines;
  }

}

function toRatioColor(c) {
  return {r: c.r/0xff, g: c.g/0xff, b: c.b/0xff, a: c.a}
}