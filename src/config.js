import tinycolor from 'tinycolor2';

export default {
  /**
   * This is our caching backend
   */
  areaServer: 'https://anvaka.github.io/index-large-cities/data',
  // areaServer: 'http://localhost:8085', // This is un-commented when I develop cache locally

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