import protobufExport from './protobufExport';
import svgExport from './svgExport';

export function toSVG(scene, options) {
  options = options || {};
  let svg = svgExport(scene, { labels: collectText() });
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

  let printableCanvas = getPrintableCanvas(scene);
  let fileName = getFileName(options.name, '.png');

  printableCanvas.toBlob(function(blob) {
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    revokeLater(url);
  }, 'image/png')
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

  collectText().forEach(label => drawHtml(label, ctx));

  return printable;
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


function drawHtml(element, ctx) {
  if (!element) return;

  ctx.save();

  let dpr = window.devicePixelRatio || 1;
  ctx.font = dpr * element.fontSize + 'px ' + element.fontFamily;
  ctx.fillStyle = element.color;
  ctx.textAlign = 'end'
  ctx.fillText(element.text, element.bounds.right * dpr, element.bounds.bottom * dpr)
  ctx.restore();
}


function collectText() {
  return Array.from(
    document.querySelectorAll('.printable')
  ).map(element => {
    let computedStyle = window.getComputedStyle(element);
    let bounds = element.getBoundingClientRect();
    let fontSize = Number.parseInt(computedStyle.fontSize, 10);

    return {
      text: element.innerText,
      bounds,
      fontSize,
      color: computedStyle.color,
      fontFamily: computedStyle.fontFamily,
      fill: computedStyle.color,
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
