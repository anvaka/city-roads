import GridLayer from './GridLayer';
import Query from './Query';

/**
 * Experimental API. Can be changed/removed at any point.
 */
export default function load(queryFilter, place) {
  let layer = new GridLayer();
  layer.query = Query.all(queryFilter, place);
  layer.query.run().then(grid => {
    layer.setGrid(grid);
  }).catch(e => {
    console.error(`Could not execute:
${queryFilter}
The error was:`);
    console.error(e);
    layer.destroy();
  });

  if (window.scene !== undefined) {
    window.scene.add(layer);
  }
  return layer;
}