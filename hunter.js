class Bullet extends Renderable {
  constructor (ctx, start, end, velocity = 3) {
    super(ctx, start.x, start.y) 
    
    this.start = start
    this.end = end

    let diffX = start.x - end.x
    let diffY = start.y - end.y
    let signX = diffX > 0 ? -1 : 1
    let signY = diffY > 0 ? 1 : -1
    let theta = Math.atan((diffY*signY)/(diffX*signX))
    this.velX = velocity * Math.cos(theta) * signX
    this.velY = velocity * Math.sin(theta) * signY

    this._leftOffset    =  -1;
    this._rightOffset   =  5;
    this._topOffset     =  -1;
    this._bottomOffset  =  5;
    this.live = true
  }
  
  static get baseColor ()  { return "#333"; }
  
  render () { 
    this.renderBoundingBoxIfNeeded()
    this.renderObjectIdsIfNeeded()
    
    this.__ctx.fillStyle = Bullet.baseColor;
    this.__ctx.fillRect(this.x, this.y, 4, 4);
    
    this.moveAlongFlightPath()
  }
  
  moveAlongFlightPath () {
    this.move(this.x + this.velX, this.y + this.velY)
  }
}



class Hunter extends Renderable {
  constructor (ctx, x, y, face) {
    super(ctx, x, y)
    
    this._face = face || Hunter.LEFT;
    
    this._leftOffset    =  5;
    this._rightOffset   =  45;
    this._topOffset     =  0;
    this._bottomOffset  =  45;
    
    this.bullets = []
  }
  
  static get LEFT  () { return 1; }
  static get RIGHT () { return 2; }
  
  static get baseColor    () { return 'black'; }
  static get clothesColor () { return '#222'; }
  static get gunColor     () { return '#555'; }
  
  fireAt (target) {
    let start = {
      x : this.x + (this._face === Hunter.RIGHT ? 46 : 0), 
      y: this.y + 10,
    }
    let end = { 
      x : target.x + 10, 
      y: target.y + 20, 
    }
    window.debug && console.log('fire bullet')
    return new Bullet(this.__ctx, start, end)
  }
  
  face (side) {
    this._face = side;
  }
  
  track(target) {
    this.target = target
    this._fireInterval = random(400, 100)
    this.renderCount = 0
  }
  
  checkForHits () {
    if (!this.target) return
    let hit = this.bullets.reduce((a, bullet) => {
      return a || (boundingBoxesIntersect(this.target.targetBoundingBoxObject, bullet) && bullet)
    }, null);
    if (hit) {
      this.target.getHit()
      window.removeObjectFromContainer(hit, this.bullets)
      window.debug && console.log('bullet hit!')
    }
  }
  
  checkBulletBounds(canvas) {
    this.bullets.forEach(b => {
      let {width : x, height: y} = canvas
      let outOfBounds = b.checkBounds({ x, y })
      if (outOfBounds) {
        window.debug && console.log('bullet went out of bounds')
        window.removeObjectFromContainer(b, this.bullets)
      }
    })
  }
  
  render (x, y) {
    this.renderBoundingBoxIfNeeded()

    if (this.target) {
      this.face(this.target.x > this.x ? Hunter.RIGHT : Hunter.LEFT)
    }

    switch (this._face) {
      case Hunter.LEFT:  this._left (x, y); break; 
      case Hunter.RIGHT: this._right(x, y); break;
    }

    if (this.target) {
      this.renderCount++
      if (this.renderCount % this._fireInterval === 0) {
        this.bullets.push(this.fireAt(this.target))
      }
      this.bullets.forEach(b => b.render())
    }
    
    this.renderObjectIdsIfNeeded()
  }

  _right (x, y) {
    if (x && y) this.move(x, y);
    
    // gun
    this.__block(this.x-1, this.y+10, Hunter.gunColor, 50, 5); // barrel
    this.__block(this.x-1, this.y+10, Hunter.gunColor, 10, 10); // hilt
    
    this.__block(this.x+3, this.y, Hunter.baseColor, 10, 12); // head
    this.__block(this.x, this.y+12, Hunter.clothesColor, 15, 17); // neck/body

    // arm
    this.__block(this.x+17, this.y+15, Hunter.clothesColor, 7, 5); 
    this.__block(this.x+15, this.y+18, Hunter.baseColor, 8, 5); 
    
    // legs
    this.__block(this.x, this.y+28, Hunter.baseColor, 8, 15);
    this.__block(this.x+6, this.y+28, Hunter.clothesColor, 8, 15);
  }
  
  _left (x, y) {
    if (x && y) this.move(x, y);
    
    // gun
    this.__block(this.x+1, this.y+10, Hunter.gunColor, 50, 5); // barrel
    this.__block(this.x+41, this.y+10, Hunter.gunColor, 10, 10); // hilt
    
    this.__block(this.x+37, this.y, Hunter.baseColor, 10, 12); // head
    this.__block(this.x+35, this.y+12, Hunter.clothesColor, 15, 17); // neck/body
    
    // arm
    this.__block(this.x+26, this.y+15, Hunter.clothesColor, 7, 5); 
    this.__block(this.x+27, this.y+18, Hunter.baseColor, 8, 5); 
    
    // legs
    this.__block(this.x+42, this.y+28, Hunter.baseColor, 8, 15);
    this.__block(this.x+36, this.y+28, Hunter.clothesColor, 8, 15);
  }
}


