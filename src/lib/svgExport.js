let tinycolor = require('tinycolor2');
let place = require('../proto/place.js').place;

module.exports = function svgExport(layers, rect, style) {
  let ways = [];
  let date = (new Date()).toISOString();
  let strokeWidth = 1/window.devicePixelRatio;
  let svgDoc = [
`<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: https://github.com/anvaka/city-roads
Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright
-->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
   viewBox="${rect.left} ${rect.top} ${rect.width} ${rect.height}">
   <style>
   path {
    vector-effect: non-scaling-stroke;
   }
   </style>
   <rect id="background" fill="${style.background}" x="${rect.left}" y="${rect.top}" width="${rect.width}" height="${rect.height}"></rect>
`
  ]
  layers.forEach(layer => addPaths(layer));
  addText();

  svgDoc.push(`</svg>`)

  return svgDoc.join('\n');

  function addPaths(gridLayer) {
    let grid = gridLayer.grid;
    if (!grid) return;

    let lineColor = tinycolor(gridLayer.color).toHexString();
    svgDoc.push(`<g id="${gridLayer.id}" fill="none" stroke="${lineColor}" stroke-width="${strokeWidth}">`)
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
  
        return `${shouldAddPrefix ? prefix : ''}${pt.x},${pt.y}`;
      }).filter(x => x).join(' ')
  
      if (hasLine) {
        svgDoc.push(`<path d="${points}" />`);
      }
    });
    svgDoc.push(`</g>`)
  }

  function addText() {
    let scaleX = window.innerWidth / rect.width;
    let scaleY = window.innerHeight / rect.height;
    style.labels.map(label => {
      if (!label.text) return;
      let insecurelyEscaped = label.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      
      // Note: this is not 100% accurate, might need to be fixed eventually
      let bounds = label.bounds;
      let leftOffset = rect.width * bounds.right / window.innerWidth + rect.left;
      let bottomOffset = rect.height * bounds.bottom / window.innerHeight + rect.top;
      let upScale = rect.height * label.fontSize / window.innerHeight;

      let fontFamily = label.fontFamily.replace(/"/g, '\'');
      return `<text text-anchor="end" x="${leftOffset}" y="${bottomOffset}" fill="${label.color}" font-family="${fontFamily}" font-size="${upScale}">${insecurelyEscaped}</text>`
    }).forEach(item => {
      if (!item) return;
      svgDoc.push(item);
    })
  }
}

function isOutside(point, rect) {
  return point.x < rect.left || point.x > rect.right ||
         point.y < rect.top || point.y > rect.bottom;
}