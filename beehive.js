class Beehive {
  constructor (ctx, x, y, color, hasBees = false) {
    this.id = window.__objects__.length;
    window.__objects__.push(this); 

    this.__ctx = ctx;
    this.move(x || 25, y || 25);
    this.levelsHigh     =  5;
    this._leftOffset    =  0;
    this._rightOffset   =  this.levelsHigh * 10;
    this._topOffset     =  10;
    this._bottomOffset  =  10*(this.levelsHigh+1) + this._rightOffset/4;
    this.hole = {x: this.x + 5*(this.levelsHigh-1), y: this.y + 10*this.levelsHigh - 1};
    this.bees = [];
    if (color) {
      this.__baseColor = color;
    } else {
      let rand = 1 + Math.floor(Math.random() * 2);
      this.__baseColor = Beehive[`baseColor${rand}`];
    }
    
    if (hasBees) { 
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

  move (x, y) {
    this.x = x;
    this.y = y;
  }

  render (x, y) {
    if (x && y) this.move(x, y);
    
    if (window.showBoundingBoxes) {
      this._drawBoundingBox();
    }
    if (window.showObjectIds) {
      this.__ctx.fillStyle = 'black';
      this.__ctx.font="10px Monospace";
      this.__ctx.fillText(this.id, this.x, this.y);
    }

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
