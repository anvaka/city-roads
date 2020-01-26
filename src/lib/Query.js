import postData from './postData';
import Grid from './Grid';

export default class Query {
  constructor(queryString, progress) {
    this.queryString = queryString;
    this.progress = progress;
    this.promise = null;
  }

  run() {
    if (!this.promise) {
      this.promise = postData(this.queryString, this.progress)
        .then(osmResponse => {
          let grid = Grid.fromOSMResponse(osmResponse.elements)
          return grid;
        });
    }

    return this.promise;
  }
}