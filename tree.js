class Tree extends Renderable {
  constructor (ctx, x, y, levelsHigh) {
    super(ctx, x, y)

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

  render (x, y) {
    if (x && y) this.move(x, y);
    
    this.renderBoundingBoxIfNeeded()
    this.renderObjectIdsIfNeeded()

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
}
