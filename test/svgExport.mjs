import assert from 'node:assert/strict';
import test from 'node:test';
import svgExport from '../src/lib/svgExport.js';

const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function exportPath(xs, minLength) {
  const renderer = {
    getPixelRatio: () => 1,
    getClearColor: () => [1, 1, 1, 1],
    getDrawContext: () => ({
      width: 8, height: 8, projection: identity, view: {matrix: identity}
    }),
    getRoot: () => ({children: [layer], updateWorldTransform() {}})
  };
  const layer = {
    scene: renderer,
    children: [],
    worldModel: identity,
    getLineColor: () => [0, 0, 0, 1],
    forEachLine(visit) {
      for (let i = 1; i < xs.length; ++i) {
        visit({x: xs[i - 1], y: 0}, {x: xs[i], y: 0});
      }
    }
  };
  return svgExport({getRenderer: () => renderer}, {minLength, printable: []});
}

for (const [name, xs, minLength, expected] of [
  ['shorter path', [0, 0.25], 2, false],
  ['exact minimum', [0, 0.5], 2, true],
  ['longer path', [0, 0.75], 2, true],
  ['multiple segments at minimum', [0, 0.25, 0.5], 2, true],
  ['zero minimum', [0, 0.25], 0, true],
  ['omitted minimum', [0, 0.25], undefined, true]
]) {
  test(name, () => {
    assert.equal(/<path\b/.test(exportPath(xs, minLength)), expected);
  });
}
