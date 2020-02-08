import postData from './postData';
import Grid from './Grid';
import request from './request';

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
   * More accurate representation of the roads by @RicoElectrico.
   */
  static RoadStrict = 'way[highway~"^(((motorway|trunk|primary|secondary|tertiary)(_link)?)|unclassified|residential|living_street|pedestrian|service|track)$"][area!=yes]';

  static all(loadOptions) {
    let template = loadOptions.getQueryTemplate();
    return new Query(template);
  }

  constructor(queryString, progress) {
    this.queryString = queryString;
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
        return Grid.fromOSMResponse(osmResponse.elements)
      });

    return this.promise;
  }
}

function runAllNominmantimQueries(parts) {
  let lastProcessed = 0;

  return processNext().then(concat);

  function concat() {
    return parts.map(part => typeof part === 'string' ? part : part.areaId).join('');
  }
  
  function processNext() {
    if (lastProcessed >= parts.length) {
      return Promise.resolve();
    }
    
    let part = parts[lastProcessed];
    lastProcessed += 1;
    if (typeof part === 'string') return processNext();

    if (part.type === 'area') {
      let name = encodeURIComponent(part.name);
      return request(`https://nominatim.openstreetmap.org/search?format=json&q=${name}`, {responseType: 'json'})
        .then(extractAreas)
        .then(pickFirstArea)
        .then(first => {
          if (!first) {
            throw new Error('No areas found for request ' + part.name);
          }
          Object.assign(part, first);
        })
        .then(wait(1000)) // per nominatim agreement we are not allowed to issue more tan 1 request per second
        .then(processNext);
    }

    throw new Error('Unknown part: ' + part);
  }
}

function extractAreas(x) {
  let areas = x.filter(row => row.osm_type === 'relation' || row.osm_type === 'way')
    .map(row => {
      // TODO: this duplicates FindPlace code. Refactor.
      let areaId;
      if (row.osm_type === 'relation') {
        areaId = row.osm_id + 36e8;
      } else if (row.osm_type === 'way') {
        areaId = row.osm_id + 24e8;
      }

      return {
        areaId,
        name: row.display_name,
        type: row.type,
      };
    });

  return areas;
}

function pickFirstArea(areas) {
  if (areas.length > 0) {
    return areas[0];
  }
}

function collectAllNominatimQueries(extendedQuery) {
  let area = /{{geocodeArea:(.+?)}}/;
  let match;
  let parts = [];
  let lastIndex = 0;
  while ((match = extendedQuery.match(area))) {
    parts.push(extendedQuery.substr(0, match.index));
    parts.push({
      type: 'area',
      name: match[1]
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

