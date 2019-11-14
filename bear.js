class Bear extends Renderable {
  constructor (ctx, x, y, face) {
    super(ctx, x, y)

    this._face = face || Bear.FRONT;
    this._full_leftOffset    = -16;
    this._full_rightOffset   =  36;
    this._full_topOffset     =  -4;
    this._full_bottomOffset  =  64;

    this._target_leftOffset    = -5;
    this._target_rightOffset   =  25;
    this._target_topOffset     =  0;
    this._target_bottomOffset  =  50;

    this._leftOffset    =  -2;
    this._rightOffset   =  22;
    this._topOffset     =  50;
    this._bottomOffset  =  64;

    this.stats = {
      points: 0,
      lives: 3
    }
    this.biteMutex = false
    this.biteImmunityTime = 1000
    this._punching = false
  }
  
  static get FRONT () { return 1; }
  static get LEFT  () { return 2; }
  static get RIGHT () { return 3; }
  static get BACK  () { return 4; }
  
  static get baseColor  () { return 'brown'; }
  static get eyeColor   () { return 'black'; }
  static get snoutColor () { return 'black'; }
  static get faceColor  () { return 'rgb(189, 142, 82)'; }
  static get baseColor2 () { return 'rgb(121, 28, 28)'; }
  
  eat (hive) {
    console.log("Oh looks! I see a hive! Yummmy!");
    if (hive.beesActive) {
      if (!this.biteMutex) {
        this.stats.points--;
        if (this.stats.points < 0) this.stats.points = 0
        this.biteMutex = true
        setTimeout(() => {
          this.biteMutex = false
        }, this.biteImmunityTime)
      }
    } else {
      this.stats.points++;
    }
  }

  throwPunch () {
    if (this.stats.points < 1 || this._punching) return null;
    this._punching = true;
    setTimeout(() => {
      this._punching = false;
      this.stats.points--;
    }, 200)
    return true;
  }

  getHit() {
    this.stats.lives--;
  }

  face (side) {
    this._face = side;
  }
  
  render (x, y) {
    this.renderBoundingBoxIfNeeded(this.fullBoundingBoxObject)
    this.renderBoundingBoxIfNeeded(this.targetBoundingBoxObject)
    this.renderBoundingBoxIfNeeded()
    
    switch (this._face) {
      case Bear.FRONT: this._front(x, y); break; 
      case Bear.LEFT:  this._left (x, y); break; 
      case Bear.RIGHT: this._right(x, y); break;
      default:         this._back (x, y);
    }

    
    this.renderObjectIdsIfNeeded()
  }

  get fullBoundingBoxObject () {
    var self = this;
    return {
      color: 'darkgrey',
      _leftOffset  : self._full_leftOffset,
      _rightOffset : self._full_rightOffset,
      _topOffset   : self._full_topOffset,
      _bottomOffset: self._full_bottomOffset,
      isInBoundingBox: function (x, y) {
        let inBounds = (self.x + self._full_leftOffset < x && x < self.x + self._full_rightOffset) 
        && (self.y + self._full_topOffset  < y && y < self.y + self._full_bottomOffset);
        return inBounds;
      }
    }
  }
  
  get targetBoundingBoxObject () {
    var self = this;
    return {
      color: 'red',
      _leftOffset  : self._target_leftOffset,
      _rightOffset : self._target_rightOffset,
      _topOffset   : self._target_topOffset,
      _bottomOffset: self._target_bottomOffset,
      isInBoundingBox: function (x, y) {
        let inBounds = (self.x + self._target_leftOffset < x && x < self.x + self._target_rightOffset) 
                    && (self.y + self._target_topOffset  < y && y < self.y + self._target_bottomOffset);
        return inBounds;
      }
    }
  }

  _back (x, y) {
    if (x && y) this.move(x, y);
    this.__block(this.x, this.y, Bear.baseColor, 20);            // head
    this.__block(this.x - 4, this.y - 4, Bear.baseColor, 10);    // left ear
    this.__block(this.x + 14, this.y - 4, Bear.baseColor, 10);   // right ear
  
    this.__block(this.x + 4, this.y + 18, Bear.baseColor, 12);    // neck
    this.__block(this.x - 4, this.y + 23, Bear.baseColor, 28);    // body
  
    this.__block(this.x - 3, this.y + 52, Bear.baseColor, 12);    // left leg
    this.__block(this.x + 11, this.y + 52, Bear.baseColor, 12);   // right arm
  
    this.__block(this.x - 16, this.y + 25, Bear.baseColor, 11);   // left arm
    this.__block(this.x + 25, this.y + 25, Bear.baseColor, 11);   // right leg
  
    this.__block(this.x + 5, this.y + 40, Bear.baseColor2, 10);   // tail
  }

  _front (x, y) {
    if (x && y) this.move(x, y);
    this.__block(this.x + 4, this.y + 18, Bear.baseColor, 12);    // neck
    this.__block(this.x - 4, this.y + 23, Bear.baseColor, 28);    // body
  
    this.__block(this.x - 3, this.y + 52, Bear.baseColor, 12);    // left leg
    this.__block(this.x + 11, this.y + 52, Bear.baseColor, 12);   // right leg
  
    this.__block(this.x - 16, this.y + 25, Bear.baseColor, 11);   // left arm
    this.__block(this.x + 25, this.y + 25, Bear.baseColor, 11);   // right arm
  
    this.__block(this.x, this.y, Bear.baseColor, 20);             // head
    this.__block(this.x - 4, this.y - 4, Bear.baseColor, 10);     // left ear
    this.__block(this.x + 14, this.y - 4, Bear.baseColor, 10);    // right ear
    this.__block(this.x + 5, this.y + 4, Bear.eyeColor, 3);       // left eye
    this.__block(this.x + 12, this.y + 4, Bear.eyeColor, 3);      // right eye
    this.__block(this.x + 1, this.y + 9, Bear.faceColor, 18, 10); // face
    this.__block(this.x + 7, this.y + 8, Bear.snoutColor, 6);     // snout
    this.__block(this.x + 9, this.y + 13, Bear.snoutColor, 2, 4); // snout line
    this.__block(this.x + 7, this.y + 16, Bear.snoutColor, 6, 2); // mouth
  }

  _right (x, y) {
    if (x && y) this.move(x, y);
    this.__block(this.x + 4, this.y + 18, Bear.baseColor, 12);    // neck
    this.__block(this.x - 4, this.y + 23, Bear.baseColor, 28);    // body
  
    this.__block(this.x + 5, this.y + 52, Bear.baseColor2, 12);   // left leg
    this.__block(this.x, this.y + 52, Bear.baseColor, 12);        // right leg
  
    // right arm
    if (this._punching) {
      this.__block(this.x+2, this.y + 25, Bear.baseColor2, 26, 11);
    } else {
      this.__block(this.x+2, this.y + 25, Bear.baseColor2, 11);
    }
  
    this.__block(this.x, this.y, Bear.baseColor, 14, 20);         // head
    this.__block(this.x - 4, this.y - 4, Bear.baseColor, 10);     // right ear
    this.__block(this.x + 5, this.y + 4, Bear.eyeColor, 3);       // right eye
    this.__block(this.x + 1, this.y + 9, Bear.faceColor, 18, 10); // face
    this.__block(this.x + 17, this.y + 8, Bear.snoutColor, 6);    // snout
    this.__block(this.x + 18, this.y + 13, Bear.snoutColor, 2, 4);// snout line
    this.__block(this.x + 14, this.y + 16, Bear.snoutColor, 4, 2);// mouth
  }
  
  _left (x, y) {
    if (x && y) this.move(x, y);
    this.__block(this.x + 4, this.y + 18, Bear.baseColor, 12);    // neck
    this.__block(this.x - 4, this.y + 23, Bear.baseColor, 28);    // body
  
    this.__block(this.x+3, this.y + 52, Bear.baseColor2, 12);     // right leg
    this.__block(this.x+8, this.y + 52, Bear.baseColor, 12);      // left leg
  
    // left arm
    if (this._punching) {
      this.__block(this.x - 8, this.y + 25, Bear.baseColor2, 26, 11);
    } else {
      this.__block(this.x+7, this.y + 25, Bear.baseColor2, 11);
    }
    
    this.__block(this.x+6, this.y, Bear.baseColor, 14, 20);       // head
    this.__block(this.x + 14, this.y - 4, Bear.baseColor, 10);    // right ear
    this.__block(this.x + 12, this.y + 4, Bear.eyeColor, 3);      // right eye
    this.__block(this.x + 1, this.y + 9, Bear.faceColor, 18, 10); // face
    this.__block(this.x-3, this.y + 8, Bear.snoutColor, 6);       // snout
    this.__block(this.x, this.y + 13, Bear.snoutColor, 2, 4);     // snout line
    this.__block(this.x+1, this.y + 16, Bear.snoutColor, 4, 2);   // mouth
  }
}


