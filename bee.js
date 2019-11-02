class Bee {
  constructor (ctx, hive) {
    this.hive = hive;
    this.__ctx = ctx;
    this.x = hive.hole.x;
    this.y = hive.hole.y;
    this.active = true;
  }

  static get baseColor ()  { return "black"; }

  render () { 
    if (this.active) {
      this.__ctx.fillStyle = Bee.baseColor;
      this.__ctx.fillRect(this.x, this.y, 2, 2);
    }

    if (!this.hive.beesActive) {
      this.flyToHole();
    } else {
      this.active = true;
      this.flyRandomly();
    }
  }

  flyToHole () {
    let mag = .1;
    let distX = (this.x - this.hive.hole.x) * mag;
    let distY = (this.y - this.hive.hole.y) * mag;

    if (Math.abs(distX) < mag && Math.abs(distY) < mag) {
      this.active = false;
    }

    this.x -= distX;
    this.y -= distY;
  }

  flyRandomly () {
    let mvX = Math.floor(Math.random() * 100) % 2;
    let mvY = Math.floor(Math.random() * 100) % 2;
    let distX = Math.floor(Math.random() * 100) % 3;
    let distY = Math.floor(Math.random() * 100) % 3;
    let compX = this.x + distX * Math.pow(-1, mvX);
    let compY = this.y + distY * Math.pow(-1, mvY);
    if (this.hive.isInBoundingBox(compX, compY)) {
      this.x = compX;
      this.y = compY;
    }
  }
}
