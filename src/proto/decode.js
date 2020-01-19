let fs = require('fs');
let data = require('./test-data.json');
var Pbf = require('pbf');
var place = require('./place.js').place;
let buffer = fs.readFileSync(process.argv[2] || 'out1.pbf');
var pbf = new Pbf(buffer);
var obj = place.read(pbf);
console.log(obj);
