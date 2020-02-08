import tinycolor from 'tinycolor2';

export default {
  /**
   * This is our caching backend
   */
  areaServer: 'https://anvaka.github.io/index-large-cities/data',
  // areaServer: 'http://localhost:8085/', // This is un-commented when I develop cache locally

  getDefaultLineColor() {
    return tinycolor('rgba(26, 26, 26, 0.8)').toRgb(); // TODO: I think this should not convert to rgb
  },
  getLabelColor() {
    return tinycolor('#161616').toRgb();
  },
  getBackgroundColor(hexString) {
    let color = tinycolor('#F7F2E8');
    return hexString ? color.toRgbString() : color.toRgb();
  }
}