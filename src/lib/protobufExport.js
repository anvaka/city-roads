var Pbf = require('pbf');
var place = require('../proto/place.js').place;

module.exports = function protoBufExport(grid) {
  let nodes = [];
  let ways = [];
  let date = (new Date()).toISOString();

  grid.forEachElement(x => {
    let elementType = 0;
    if (x.type === 'node') {
      nodes.push(x)
    } else if (x.type === 'way') {
      ways.push(x)
    }
  });

  let pbf = new Pbf()
  place.write({
    version: 1,
    id: grid.id,
    date, 
    name: grid.name,
    nodes, ways
  }, pbf);
  return pbf.finish();
}