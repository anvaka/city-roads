let place = require('../proto/place.js').place;
const wgl = require('w-gl');

export default function svgExport(scene, options) {
  const renderer = scene.getRenderer();
  const svgExportSettings = {
    open() {
      return `<!-- Generator: https://github.com/anvaka/city-roads
Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright
-->`;
    },
    close() {
      return getPrintableElements();
    }
  };

  if (options.minLength) {
    svgExportSettings.beforeWrite = path => {
      let pathLength = 0;
      for (let i = 1; i < path.length; ++i) {
        pathLength += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
        if (pathLength > options.minLength) return true;
      }
      return pathLength > options.minLength;
    }
  }
  svgExportSettings.round = options.round;

  const svg = wgl.toSVG(renderer, svgExportSettings);

  return svg;

  function getPrintableElements() {
    let dpr = renderer.getPixelRatio();

    return options.printable.map(el => {
      if (el.element instanceof SVGSVGElement) {
        let bounds = el.bounds;
        let x = bounds.left * dpr;
        let y = bounds.top * dpr;
        let svg = el.element;
        svg.setAttribute('x', bounds.left * dpr);
        svg.setAttribute('y', bounds.top * dpr);
        svg.setAttribute('width', bounds.width * dpr);
        svg.setAttribute('height', bounds.height * dpr);
        let content = new XMLSerializer().serializeToString(el.element);
        svg.removeAttribute('x');
        svg.removeAttribute('y');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        return content;
      } else {
        let label = el;
        if (!label.text) return;
        let insecurelyEscaped = label.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
        
        // Note: this is not 100% accurate, might need to be fixed eventually
        let bounds = label.bounds;
        let leftOffset = (bounds.right - label.paddingRight) * dpr;
        let bottomOffset = (bounds.bottom - label.paddingBottom) * dpr;
        let fontSize = label.fontSize * dpr;

        let fontFamily = label.fontFamily.replace(/"/g, '\'');
        return `<text text-anchor="end" x="${leftOffset}" y="${bottomOffset}" fill="${label.color}" font-family="${fontFamily}" font-size="${fontSize}">${insecurelyEscaped}</text>`
      }
    }).filter(x => x).join('\n')
  }
}