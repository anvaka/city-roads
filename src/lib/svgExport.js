var place = require('../proto/place.js').place;

module.exports = function svgExport(grid, rect) {
  let ways = [];
  let date = (new Date()).toISOString();
  let svgDoc = [
`<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: https://github.com/anvaka/city-roads
Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright
-->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
   viewBox="${rect.left} ${rect.top} ${rect.width} ${rect.height}">
<g id="paths" fill="none" stroke="#000000">`
  ]

  let positions = grid.nodes;
  let project = grid.getProjector();
  grid.forEachElement(x => {
    if (x.type !== 'way') {
      return;
    }
    let prev = null;
    let hasLine = false;
    let points = x.nodes.map(node => {
      let pt = project(positions.get(node));
      if (isOutside(pt, rect)) {
        prev = null;
        return;
      }

      let prefix = prev === null ? 'M' : 'L'
      let shouldAddPrefix = (prefix !== prev);
      if (prefix === 'L') hasLine = true;
      prev = prefix;

      return `${shouldAddPrefix ? prefix : ''}${pt.x},${pt.y} `;
    }).filter(x => x).join(' ')

    if (hasLine) {
      svgDoc.push(`<path d="${points}" />`);
    }
  });
  svgDoc.push(`</g></svg>`)

  return svgDoc.join('\n');
}

function isOutside(point, rect) {
  return point.x < rect.left || point.x > rect.right ||
         point.y < rect.top || point.y > rect.bottom;
}