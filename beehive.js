class Beehive extends Renderable {
  constructor (ctx, x, y, color, hasBees = false) {
    super(ctx, x, y)

    this.levelsHigh     =  5;
    this._leftOffset    =  0;
    this._rightOffset   =  this.levelsHigh * 10;
    this._topOffset     =  10;
    this._bottomOffset  =  10*(this.levelsHigh+1) + this._rightOffset/4;
    this.hasBees = hasBees
    this.color = color
  }

  addBees () {
    this.hole = {x: this.x + 5*(this.levelsHigh-1), y: this.y + 10*this.levelsHigh - 1};
    this.bees = [];
    if (this.color) {
      this.__baseColor = this.color;
    } else {
      let rand = 1 + Math.floor(Math.random() * 2);
      this.__baseColor = Beehive[`baseColor${rand}`];
    }
    
    if (this.hasBees) { 
      let numBees = 10 + Math.floor(Math.random() * 10);
      for (let i = 0; i < numBees; i++) {
        this.bees.push(new Bee(ctx, this));
      }
      this.beesActive = true;
      this.beeSleepTime = 5000 + Math.floor(Math.random()*10000);
      this.beesSleepInterval = setInterval(() => {
        this.beesActive = !this.beesActive;
      }, this.beeSleepTime);
    }
  }

  static get baseColor1 ()  { return "khaki"; }
  static get baseColor2 ()  { return "gold"; }
  static get wholeColor () { return "black"; }

  render (x, y) {
    if (x && y) this.move(x, y);
    
    this.renderBoundingBoxIfNeeded()
    this.renderObjectIdsIfNeeded()

    let width = 10 * this.levelsHigh - 1;
    let height = width;
    let x_off = 5;
    let y_off = 10;
    let l = 0;

    // tree leaves
    while (l < this.levelsHigh - 1) {
      this.__block(this.x + x_off*l, this.y + height - y_off*l, this.__baseColor, width - y_off*l, y_off); ++l;
    }
    
    this.__block(this.hole.x, this.hole.y, Beehive.wholeColor, width - y_off*l, y_off);

    this.bees.forEach(bee => bee.render());
  }
}
