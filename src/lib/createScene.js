
const wgl = require('w-gl');

export default function createScene(grid, canvas) {
  let scene = wgl.scene(canvas);
  scene.setClearColor(0xf7/0xff, 0xf2/0xff, 0xe8/0xff, 1.0)
  // scene.setClearColor(1, 1, 1, 1.0)
  let width = grid.getProjectedWidth();
  let height = grid.getProjectedHeight();
  let initialSceneSize = Math.max(width, height) / 4;
  scene.setViewBox({
    left:  -initialSceneSize,
    top:   -initialSceneSize,
    right:  initialSceneSize,
    bottom: initialSceneSize,
  })

  let lineWidth = 1;
  let lines;
  if (lineWidth < 2) {
    lines = new wgl.WireCollection(grid.wayPointCount);
    grid.forEachWay(function(from, to) {
      lines.add({from, to});
    });
  }  else {
    lines = new wgl.LineCollection(grid.wayPointCount);
    grid.forEachWay(function(from, to) {
      let ui = lines.add({from, to});
      ui.setWidth(lineWidth);
      ui.update(from, to);
    });
  }
  //lines.color = {r: 0.8, g: 0.8, b: 0.8, a: 0.7}
  lines.color = {r: 0.1, g: 0.1, b: 0.1, a: 0.8}

  scene.appendChild(lines);

  return {
    render() {
      scene.renderFrame(true);
    },
    dispose() {
      let gl = canvas.getContext('webgl')
      if (gl) {
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      scene.dispose();
    },

    setLineColor(color) {
      lines.color = {r: color.r/0xff, g: color.g/0xff, b: color.b/0xff, a: color.a};
      scene.renderFrame();
    },
    setBackground(color) {
      scene.setClearColor(color.r/0xff, color.g/0xff, color.b/0xff, color.a);
      scene.renderFrame();
    }
  }
}