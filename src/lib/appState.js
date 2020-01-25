import createQueryState from 'query-state';

const queryState = createQueryState({}, {useSearch: true});

/**
 * This is our base state. It just persists default information about
 * custom settings and integrates with query string.
 */
export default {
  drawLabels: true,
  backgroundColor: {
    r: 0xF7, g: 0xF2, b: 0xE8, a: 1
  },
  lineColor: {
    r: 22, g: 22, b: 22, a: 1.0
  },
  labelColor: {
    r: 22, g: 22, b: 22, a: 1.0
  },
  get() {
    return queryState.get.apply(queryState, arguments);
  },
  set() {
    return queryState.set.apply(queryState, arguments);
  },
  unset() {
    return queryState.unset.apply(queryState, arguments);
  },

  unsetPlace() {
    queryState.unset('areaId');
    queryState.unset('osm_id');
    queryState.unset('bbox');
  }
}