export default class BBox {
  constructor() {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
  }

  growBy(offset) {
    this.minX -= offset;
    this.minY -= offset;
    this.maxX += offset;
    this.maxY += offset;
  }

  get left() {
    return this.minX;
  }

  get top() {
    return this.minY;
  }

  get right() {
    return this.maxX;
  }

  get bottom() {
    return this.maxY;
  }

  get width() {
    return this.maxX - this.minX;
  }

  get height() {
    return this.maxY - this.minY;
  }

  get cx() {
    return (this.minX + this.maxX)/2;
  }

  get cy() {
    return (this.minY + this.maxY)/2;
  }

  addPoint(xIn, yIn) {
    if (xIn === undefined) throw new Error('Point is not defined');
    let x = xIn;
    let y = yIn;
    if (y === undefined) {
      // xIn is a point object
      x = xIn.x;
      y = xIn.y;
    }

    if (x < this.minX) this.minX = x;
    if (x > this.maxX) this.maxX = x;
    if (y < this.minY) this.minY = y;
    if (y > this.maxY) this.maxY = y;
  }

  addRect(rect) {
    if (!rect) throw new Error('rect is not defined');
    this.addPoint(rect.left, rect.top);
    this.addPoint(rect.right, rect.top);
    this.addPoint(rect.left, rect.bottom);
    this.addPoint(rect.right, rect.bottom);
  }

  merge(otherBBox) {
    if (otherBBox.minX < this.minX) this.minX = otherBBox.minX;
    if (otherBBox.minY < this.minY) this.minY = otherBBox.minY;
    if (otherBBox.maxX > this.maxX) this.maxX = otherBBox.maxX;
    if (otherBBox.maxY > this.maxY) this.maxY = otherBBox.maxY;
  }
}