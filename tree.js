class Tree {
  constructor (ctx, x, y, levelsHigh) {
    this.__ctx = ctx;
    this.move(x || 25, y || 25);
    this.levelsHigh     =  levelsHigh || 5;
    this._leftOffset    =  0;
    this._rightOffset   =  this.levelsHigh * 10;
    this._topOffset     =  10;
    this._bottomOffset  =  10*(this.levelsHigh+1) + this._rightOffset/4;
    let rand = 1 + Math.floor(Math.random() * 3);
    this.__leafColor = Tree[`leafColor${rand}`];
  }
  
  static get leafColor1 () { return "forestgreen"; }
  static get leafColor2 () { return "darkgreen"; }
  static get leafColor3 () { return "SeaGreen"; }
  static get trunkColor () { return "brown"; }

  get canPunch () {
    return this.levelsHigh > 2
  }
  
  getPunched () {
    if (!this.canPunch) return;
    setTimeout(() => {
      this.levelsHigh--;
      this._rightOffset = this.levelsHigh * 10;
      this._bottomOffset = 10*(this.levelsHigh+1) + this._rightOffset/4;
      this.move(this.x, this.y + 10)
    }, 100)
  }

  move (x, y) {
    this.x = x;
    this.y = y;
  }

  render (x, y) {
    if (x && y) this.move(x, y);
    if (window.showBoundingBoxes) {
      this._drawBoundingBox();
    }
    let width = 10 * this.levelsHigh;
    let height = width;
    let x_off = 5;
    let y_off = 10;
    let l = 0;

    // tree leaves
    while (l < this.levelsHigh) {
      this.__block(this.x + x_off*l, this.y + height - y_off*l, this.__leafColor, width - y_off*l, y_off); ++l;
    }

    // tree trunk
    let trunkWidth = width/4;
    this.__block(this.x + (width - trunkWidth)/2, this.y+y_off*(this.levelsHigh+1), Tree.trunkColor, trunkWidth);
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

  _drawBoundingBox () {
    this.__block(
      this.x + this._leftOffset, 
      this.y + this._topOffset, 
      'lightgrey', 
      this._rightOffset - this._leftOffset,
      this._bottomOffset - this._topOffset // 52, 68
    );
  }
}
