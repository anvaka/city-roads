let fs = require('fs');
let data = require('./test-data.json');
var Pbf = require('pbf');
var place = require('./place.js').place;
var pbf = new Pbf()
let nodes = [];
let ways = [];

data.forEach(x => {
  let elementType = 0;
  if (x.type === 'node') {
    nodes.push(x)
  } else if (x.type === 'way') {
    ways.push(x)
  }
});

place.write({
  name: 'test',
  nodes, ways
}, pbf)
var buffer = pbf.finish();
console.log(buffer.length);
fs.writeFileSync('out1.pbf', buffer);
