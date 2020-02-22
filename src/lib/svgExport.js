let place = require('../proto/place.js').place;
const wgl = require('w-gl');

module.exports = function svgExport(scene, style) {
  let renderer = scene.getRenderer();
  const svg = wgl.toSVG(renderer, {
    open() {
      return `<!-- Generator: https://github.com/anvaka/city-roads
Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright
-->`;
    },
    close() {
      return getLabelText();
    }
  });

  return svg;

  function getLabelText() {
    let dpr = renderer.getPixelRatio();
    return style.labels.map(label => {
      if (!label.text) return;

      let insecurelyEscaped = label.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      
      // Note: this is not 100% accurate, might need to be fixed eventually
      let bounds = label.bounds;
      let leftOffset = bounds.right * dpr;
      let bottomOffset = bounds.bottom * dpr;
      let fontSize = label.fontSize * dpr;

      let fontFamily = label.fontFamily.replace(/"/g, '\'');
      return `<text text-anchor="end" x="${leftOffset}" y="${bottomOffset}" fill="${label.color}" font-family="${fontFamily}" font-size="${fontSize}">${insecurelyEscaped}</text>`
    }).filter(x => x).join('\n')
  }
}