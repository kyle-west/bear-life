class Renderable {
  constructor (ctx, x, y) {
    this.id = window.__objects__.length;
    window.__objects__.push(this);
    this.__ctx = ctx;
    this.move(x || 25, y || 25);
  }

  move (x, y) {
    this.x = x;
    this.y = y;
  }

  __block (x, y, color = 'black', width = 8, height) {
    this.__ctx.fillStyle = color;
    this.__ctx.fillRect(x, y, width, height || width);
  }

  isInBoundingBox (x, y) {
    let inBounds = (this.x + this._leftOffset < x && x < this.x + this._rightOffset) 
                && (this.y + this._topOffset  < y && y < this.y + this._bottomOffset);
    return inBounds;
  }

  renderBoundingBoxIfNeeded(boundingBox) {
    if (window.showBoundingBoxes) {
      this._drawBoundingBox(boundingBox);
    }
  }

  renderObjectIdsIfNeeded() {
    if (window.showObjectIds) {
      this.__ctx.fillStyle = 'black';
      this.__ctx.font="10px Monospace";
      this.__ctx.fillText(this.id, this.x, this.y);
    }
    if (window.showBoundingBoxes) {
      this.__block(this.x, this.y, 'blue', 1, 1);
    }
  }

  _drawBoundingBox (boundingBox) {
    let box = boundingBox || this
    this.__block(
      this.x + box._leftOffset, 
      this.y + box._topOffset, 
      box.color || 'lightgrey', 
      box._rightOffset - box._leftOffset,
      box._bottomOffset - box._topOffset // 52, 68
    );
  }
  
  checkBounds ({x, y}) {
    return this.x < 0 || this.x > x || this.y < 0 || this.y > y
  }
}