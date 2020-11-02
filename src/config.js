import tinycolor from 'tinycolor2';

export default {
  /**
   * This is our caching backend
   */
  // This used to work, but seems like GitHub no longer allows large website hosting:
  //areaServer: 'https://anvaka.github.io/index-large-cities/data',
  //areaServer: 'http://localhost:8085', // This is un-commented when I develop cache locally
  // So, using S3
  areaServer: 'https://city-roads.s3-us-west-2.amazonaws.com/nov-02-2020',

  getDefaultLineColor() {
    return tinycolor('rgba(26, 26, 26, 0.8)');
  },
  getLabelColor() {
    return tinycolor('#161616');
  },

  getBackgroundColor() {
    return tinycolor('#F7F2E8');
  }
}