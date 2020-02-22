import BoundingBox from './BoundingBox';
import {geoMercator} from 'd3-geo';

/**
 * All roads in the area
 */
export default class Grid {
  constructor() {
    this.elements = [];
    this.bounds = new BoundingBox();
    this.nodes = new Map();
    this.wayPointCount = 0;
    this.id = 0;
    this.name = '';
    this.isArea = true;
    this.projector = undefined; 
  }

  setName(name) {
    this.name = name;
  }

  setId(id) {
    this.id = id;
  }

  setIsArea(isArea) {
    this.isArea = isArea;
  }

  setBBox(bboxString) {
    this.bboxString = bboxString;
  }

  hasRoads() {
    return this.wayPointCount > 0;
  }

  setProjector(newProjector) {
    this.projector = newProjector;
  }

  static fromPBF(pbf) {
    if (pbf.version !== 1) throw new Error('Unknown version ' + pbf.version);
    let elementsOfOSMResponse = [];
    pbf.nodes.forEach(node => {
      node.type = 'node';
      elementsOfOSMResponse.push(node)
    });
    pbf.ways.forEach(way => {
      way.type = 'way';
      elementsOfOSMResponse.push(way);
    });

    const grid = Grid.fromOSMResponse(elementsOfOSMResponse);
    grid.setName(pbf.name);
    grid.setId(pbf.id);
    return grid;
  }

  static fromOSMResponse(elementsOfOSMResponse) {
    let gridInstance = new Grid();

    let nodes = gridInstance.nodes;
    let bounds = gridInstance.bounds;
    let wayPointCount = 0;

    // TODO: async?
    elementsOfOSMResponse.forEach(element => {
      if (element.type === 'node') {
        nodes.set(element.id, element);
        bounds.addPoint(element.lon, element.lat);
      } else if (element.type === 'way') {
        wayPointCount += element.nodes.length;
      }
    });

    gridInstance.elements = elementsOfOSMResponse;
    gridInstance.wayPointCount = wayPointCount;
    return gridInstance;
  }

  getProjectedRect() {
    let bounds = this.bounds;
    let project = this.getProjector();
    let leftTop = project({lon: bounds.left, lat: bounds.bottom});
    let rightBottom = project({lon: bounds.right, lat: bounds.top});
    let left = leftTop.x;
    let top = leftTop.y;
    let bottom = rightBottom.y
    let right = rightBottom.x;
    return {
      left, top, right, bottom,
      width: right - left, height: Math.abs(bottom - top)
    }
  }

  forEachElement(callback) {
    this.elements.forEach(callback);
  }

  forEachWay(callback, enter, exit) {
    let positions = this.nodes;
    let project = this.getProjector();
    this.elements.forEach(element => {
      if (element.type !== 'way') return;

      let nodeIds = element.nodes;
      let node = positions.get(nodeIds[0])
      if (!node) return;

      let last = project(node);
      if (enter) enter(element);

      for (let index = 1; index < nodeIds.length; ++index) {
        node = positions.get(nodeIds[index])
        if (!node) continue;
        let next = project(node);

        callback(last, next);

        last = next;
      }
      if (exit) exit(element);
    });
  }

  getProjector() {
    let q = [0, 0]; // reuse to avoid GC.

    if (!this.projector) {
      this.projector = geoMercator();
      this.projector
        .center([this.bounds.cx, this.bounds.cy])
        .scale(6371393); // Radius of Earth
    }

    let projector = this.projector;

    return project;

    function project({lon, lat}) {
      q[0] = lon; q[1] = lat;

      let xyPoint = projector(q);

      return {
        x: xyPoint[0],
        y: -xyPoint[1]
      };
    }
  }
}