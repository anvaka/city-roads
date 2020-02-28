import postData from './postData';
import Grid from './Grid';
import findBoundaryByName from './findBoundaryByName';

export default class Query {
  /**
   * Every possible way
   */
  static All = 'way';

  /**
   * Every single building
   */
  static Building = 'way[building]';
  /**
   * This gets anything marked as a highway, which has its own pros and cons.
   * See https://github.com/anvaka/city-roads/issues/20
   */
  static Road = 'way[highway]';

  /**
   * Reduced set of roads
   */
  static RoadBasic = 'way[highway~"^(motorway|primary|secondary|tertiary)|residential"]';

  /**
   * More accurate representation of the roads by @RicoElectrico.
   */
  static RoadStrict = 'way[highway~"^(((motorway|trunk|primary|secondary|tertiary)(_link)?)|unclassified|residential|living_street|pedestrian|service|track)$"][area!=yes]';

  static runFromOptions(loadOptions, progress) {
    return loadOptions.getQueryTemplate().then(boundedQuery => {
      let q = new Query(boundedQuery, progress);
      return q.run();
    });
  }

  constructor(boundedQuery, progress) {
    this.queryBounds = boundedQuery.bounds;
    this.queryString = boundedQuery.queryString;
    this.progress = progress;
    this.promise = null;
  }

  run() {
    if (this.promise) {
      return this.promise;
    }
    let parts = collectAllNominatimQueries(this.queryString);

    this.promise = runAllNominmantimQueries(parts)
      .then(resolvedQueryString => postData(resolvedQueryString, this.progress))
      .then(osmResponse => {
        let grid = Grid.fromOSMResponse(osmResponse.elements)
        grid.queryBounds = this.queryBounds;
        return grid;
      });

    return this.promise;
  }
}

function runAllNominmantimQueries(parts) {
  let lastProcessed = 0;

  return processNext().then(concat);

  function concat() {
    return parts.map(part => {
      if (typeof part === 'string') {
        return part;
      } 
      if (part.geoType === 'Area') return `area(${part.areaId})`;
      if (part.geoType === 'Coords') return part.lat + ',' + part.lon;
      if (part.geoType === 'Id') return `${part.osmType}(${part.osmId})`;
      if (part.geoType === 'Bbox') return part.bbox.join(',');
 
    }).join('');
  }
  
  function processNext() {
    if (lastProcessed >= parts.length) {
      return Promise.resolve();
    }
    
    let part = parts[lastProcessed];
    lastProcessed += 1;
    if (typeof part === 'string') return processNext();

    return findBoundaryByName(part.name)
      .then(pickFirstBoundary)
      .then(first => {
        if (!first) {
          throw new Error('No areas found for request ' + part.name);
        }
        Object.assign(part, first);
      })
      .then(wait(1000)) // per nominatim agreement we are not allowed to issue more tan 1 request per second
      .then(processNext);
  }
}

function pickFirstBoundary(boundaries) {
  if (boundaries.length > 0) {
    return boundaries[0];
  }
}

function collectAllNominatimQueries(extendedQuery) {
  let geoTest = /{{geocode(.+?):(.+?)}}/;
  let match;
  let parts = [];
  let lastIndex = 0;
  while ((match = extendedQuery.match(geoTest))) {
    parts.push(extendedQuery.substr(0, match.index));
    parts.push({
      geoType: match[1],
      name: match[2]
    });
    extendedQuery = extendedQuery.substr(match.index + match[0].length)
  }

  parts.push(extendedQuery);

  return parts;
}

function wait(ms) {
  return function(args) {
    return new Promise(resolve => {
      setTimeout(() => resolve(args), ms);
    });
  }
}

