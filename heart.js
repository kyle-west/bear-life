class Heart extends Renderable {
  constructor (ctx, x, y) {
    super(ctx, x, y)

    this._leftOffset    =  0;
    this._rightOffset   =  10
    this._topOffset     =  0;
    this._bottomOffset  =  10;
  }
  
  static get baseColor () { return "red"; }

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


    this.__block(this.x, this.y + 20, Heart.baseColor, 16, 10);
    this.__block(this.x+24, this.y + 20, Heart.baseColor, 16, 10);

    this.__block(this.x-5, this.y + 30, Heart.baseColor, 50, 10);
    this.__block(this.x+4, this.y + 40, Heart.baseColor, 32, 10);
    this.__block(this.x + 12, this.y + 50, Heart.baseColor, 16, 10);
  }
}
