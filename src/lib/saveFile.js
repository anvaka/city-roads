import protobufExport from './protobufExport';
import svgExport from './svgExport';

export function toSVG(scene, options) {
  options = options || {};
  let svg = svgExport(scene, { 
    printable: collectPrintable(),
    ...options
  });
  let blob = new Blob([svg], {type: "image/svg+xml"});
  let url = window.URL.createObjectURL(blob);
  let fileName = getFileName(options.name, '.svg');
  // For some reason, safari doesn't like when download happens on the same
  // event loop cycle. Pushing it to the next one.
  setTimeout(() => {
    let a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    revokeLater(url);
  }, 30)
}

export function toPNG(scene, options) {
  options = options || {};

  getPrintableCanvas(scene).then((printableCanvas) => {
    let fileName = getFileName(options.name, '.png');

    printableCanvas.toBlob(function(blob) {
      let url = window.URL.createObjectURL(blob);
      let a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      revokeLater(url);
    }, 'image/png')
  })
}

export function getPrintableCanvas(scene) {
  let cityCanvas = getCanvas();
  let width = cityCanvas.width;
  let height = cityCanvas.height;

  let printable = document.createElement('canvas');
  let ctx = printable.getContext('2d');
  printable.width = width;
  printable.height = height;
  scene.render();
  ctx.drawImage(cityCanvas, 0, 0, cityCanvas.width, cityCanvas.height, 0, 0, width, height);

  return Promise.all(collectPrintable().map(label => drawTextLabel(label, ctx))).then(() => {
    return printable;
  });
}

export function getCanvas() {
  return document.querySelector('#canvas')
}

function getFileName(name, extension) {
  let fileName = escapeFileName(name || new Date().toISOString());
  return fileName + (extension || '');
}

function escapeFileName(str) {
  if (!str) return '';

  return str.replace(/[#%&{}\\/?*><$!'":@+`|=]/g, '_');
}


function drawTextLabel(element, ctx) {
  if (!element) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let dpr = window.devicePixelRatio || 1;

    if (element.element instanceof SVGSVGElement) {
      let svg = element.element;
      let rect = element.bounds;
      let image = new Image();
      image.width = rect.width * dpr;
      image.height = rect.height * dpr;
      image.onload = () => {
        ctx.drawImage(image, rect.left * dpr, rect.top * dpr, image.width, image.height);
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        resolve();
      };

      // Need to set width, otherwise firefox doesn't work: https://stackoverflow.com/questions/28690643/firefox-error-rendering-an-svg-image-to-html5-canvas-with-drawimage
      svg.setAttribute('width', image.width);
      svg.setAttribute('height', image.height);
      image.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg));
    } else {
      ctx.save();

      ctx.font = dpr * element.fontSize + 'px ' + element.fontFamily;
      ctx.fillStyle = element.color;
      ctx.textAlign = 'end'
      ctx.fillText(
        element.text, 
        (element.bounds.right - element.paddingRight) * dpr, 
        (element.bounds.bottom - element.paddingBottom) * dpr
      )
      ctx.restore();
      resolve();
    }
  });
}

function collectPrintable() {
  return Array.from(document.querySelectorAll('.printable')).map(element => {
    let computedStyle = window.getComputedStyle(element);
    let bounds = element.getBoundingClientRect();
    let fontSize = Number.parseInt(computedStyle.fontSize, 10);
    let paddingRight = Number.parseInt(computedStyle.paddingRight, 10);
    // TODO: I don't know why I need to multiply by 2, it's just
    // not aligned right if I don't multiply. Need to figure out this.
    let paddingBottom = Number.parseInt(computedStyle.paddingBottom, 10) * 2;

    return {
      text: element.innerText,
      bounds,
      fontSize,
      paddingBottom,
      paddingRight,
      color: computedStyle.color,
      fontFamily: computedStyle.fontFamily,
      fill: computedStyle.color,
      element
    }
  });
}

function revokeLater(url) {
  // In iOS immediately revoked URLs cause "WebKitBlobResource error 1." error
  // Setting a timeout to revoke URL in the future fixes the error:
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 45000);
}

function toProtobuf() {
  if (!lastGrid) return;

  let arrayBuffer = protobufExport(lastGrid);
  let blob = new Blob([arrayBuffer.buffer], {type: "application/octet-stream"});
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = lastGrid.id + '.pbf';
  a.click();
  revokeLater(url);
}
