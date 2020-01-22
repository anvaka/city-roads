
/**
 * This file is responsible for rendering of the grid. It uses my silly 2d webgl
 * renderer which is not very well documented, neither popular, yet it is very
 * fast.
 */
const wgl = require('w-gl');

export default function createScene(grid, canvas) {
  let scene = wgl.scene(canvas);
  scene.setClearColor(0xf7/0xff, 0xf2/0xff, 0xe8/0xff, 1.0);

  let viewBox = getInitialViewBox();
  scene.setViewBox(viewBox);

  let slowDownZoom = false;
  let lines = createLinesCollection();
  scene.appendChild(lines);
  listenToEvents();

  return {
    render() {
      scene.renderFrame(true);
    },
    getProjectedVisibleRect,
    dispose() {
      scene.clear();
      scene.dispose();
      unsubscribeFromEvents();
    },
    setLineColor(color) {
      lines.color = {r: color.r/0xff, g: color.g/0xff, b: color.b/0xff, a: color.a};
      scene.renderFrame();
    },
    setBackground(color) {
      scene.setClearColor(color.r/0xff, color.g/0xff, color.b/0xff, color.a);
      scene.renderFrame();
    }
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

  function getInitialViewBox() {
    let {width, height} = grid.getProjectedRect();
    let initialSceneSize = Math.max(width, height) / 4;
    return {
      left:  -initialSceneSize,
      top:   -initialSceneSize,
      right:  initialSceneSize,
      bottom: initialSceneSize,
    }
  }

  function createLinesCollection() {
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
    //lines.color = {r: 0.8, g: 0.8, b: 0.8, a: 0.7}
    lines.color = {r: 0.1, g: 0.1, b: 0.1, a: 0.8}

    return lines;
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