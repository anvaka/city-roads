import createQueryState from 'query-state';

const queryState = createQueryState({}, {useSearch: true});

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
  }
}