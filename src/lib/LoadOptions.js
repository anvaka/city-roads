/**
 * For console API we allow a lot of flexibility to fetch data
 * This component normalizes input arguments and turns them into unified
 * options object
 */

export default class LoadOptions {
  static parse(scene, wayFilter, rawOptions) {
    let result = new LoadOptions();
    if (typeof rawOptions === 'string') {
      result.place = rawOptions;
    }

    if (wayFilter) {
      result.wayFilter = wayFilter;
    }

    if (!rawOptions) return result;

    Object.assign(result, rawOptions);

    let protoLayer = getProtoLayer(scene, rawOptions.layer);
    if (protoLayer) {
      result.projector = protoLayer.getGridProjector();
    }

    if (rawOptions.projector) {
      // user defined projection. See https://github.com/d3/d3-geo for the projector reference:
      result.projector = projector;
    }

    return result;
  }

  constructor() {
    /**
    * Query that should be translated to area id by nominatim;
    */
    this.place = undefined;

    /**
    * Which projector should be used to map lon/lat to layer's x/y
    */
    this.projector = undefined;
    this.wayFilter = undefined;
    this.timeout = 9000;
    this.maxHeapByteSize = 2000000000;
    this.outputMethod = 'skel'; // body
  }

  getQueryTemplate() {
    if (this.raw) {
      // I assume you know what you are doing.
      return this.raw;
    }

    if (!this.wayFilter) {
      throw new Error('Way filter is required');
    }

    return `[timeout:${this.timeout}][maxsize:${this.maxHeapByteSize}][out:json];
area({{geocodeArea:${this.place}}});
(._; )->.area;
(${this.wayFilter}(area.area); node(w););
out ${this.outputMethod};`;
  }
}

function getProtoLayer(scene, layerDefinition) {
  if (layerDefinition === undefined) return;

  if (typeof layerDefinition === 'number') {
    let layers = scene.queryLayerAll();
    return layers[layerDefinition];
  } else if (typeof layerDefinition === 'string') {
    return scene.queryLayer(layerDefinition);
  } else {
    // We assume it is a layer instance:
    return layerDefinition;
  }
}