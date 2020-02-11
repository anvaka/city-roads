import findBoundaryByName from "./findBoundaryByName";

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
      let protoQueryBounds = protoLayer.getQueryBounds();
      if (protoQueryBounds && !result.place && !result.areaId && !result.bbox) {
        // use bounds of the parent layer unless we have our own override.
        result.place = protoQueryBounds.place;
        result.areaId = protoQueryBounds.areaId;
        result.bbox = protoQueryBounds.bbox;
      }
    }

    if (rawOptions.projector) {
      // user defined projection. See https://github.com/d3/d3-geo for the projector reference:
      result.projector = projector;
    }

    return result;
  }

  constructor(overrides) {
    /**
    * Query that should be translated to area id by nominatim;
    */
    this.place = undefined;

    /**
    * Which projector should be used to map lon/lat to layer's x/y
    */
    this.projector = undefined;
    this.wayFilter = undefined;
    this.timeout = 900;
    this.maxHeapByteSize = 1073741824;
    this.outputMethod = 'skel'; // body
    Object.assign(this, overrides);
  }

  getQueryTemplate() {
    if (this.raw) {
      // I assume you know what you are doing.
      return Promise.resolve({
        queryString: this.raw
      });
    }

    if (!this.wayFilter) {
      throw new Error('Way filter is required');
    }

    return this.getBounds()
      .then(bounds => {
        let queryString;
        if (bounds.areaId) {
          queryString = `[timeout:${this.timeout}][maxsize:${this.maxHeapByteSize}][out:json];
area(${bounds.areaId});
(._; )->.area;
(${this.wayFilter}(area.area); node(w););
out ${this.outputMethod};`;
        } else if (bounds.bbox) {
          let bbox = serializeBBox(bounds.bbox);
          queryString = `[timeout:${this.timeout}][maxsize:${this.maxHeapByteSize}][bbox:${bbox}][out:json];
(${this.wayFilter}; node(w););
out ${this.outputMethod};`;
        }

        return {
          bounds,
          queryString
        }
      });
  }

  getBounds() {
    if (this.place) {
      return findBoundaryByName(this.place).then(x => x && x[0]);
    }
    if (this.areaId) {
      return Promise.resolve({ areaId: this.areaId });
    }
    if (this.bbox) {
      return Promise.resolve({ bbox: this.bbox });
    }

    throw new Error('Please specify bounding area for the query (place|areaId|bbox)');
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

function serializeBBox(bbox) {
  return bbox && bbox.join(',');
}