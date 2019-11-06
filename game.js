var canvas, ctx, bear, immovableProps, hives;
var statsCanvas, statsCtx, statsElemets;
var x, y;
var speed = 4;
var level = 1;
var mainWidth;
var movement = {};
var movementListenersAttached;
window.showBoundingBoxes = false;
window.showObjectIds = true;
window.__objects__ = [];

function block(x, y, color = 'black', width = 8, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height || width);
}

function boundingBoxesIntersect (first, second) {
  let intersect = 
    first .isInBoundingBox(second.x + second._leftOffset,  second.y + second._topOffset   ) ||
    first .isInBoundingBox(second.x + second._leftOffset,  second.y + second._bottomOffset) ||
    first .isInBoundingBox(second.x + second._rightOffset, second.y + second._topOffset   ) ||
    first .isInBoundingBox(second.x + second._rightOffset, second.y + second._bottomOffset) ||
    second.isInBoundingBox(first.x + first._leftOffset,    first.y + first._topOffset     ) ||
    second.isInBoundingBox(first.x + first._leftOffset,    first.y + first._bottomOffset  ) ||
    second.isInBoundingBox(first.x + first._rightOffset,   first.y + first._topOffset     ) ||
    second.isInBoundingBox(first.x + first._rightOffset,   first.y + first._bottomOffset  );
  return intersect;
}

function initStats () {
  mainWidth = mainWidth || Math.min(document.body.clientWidth, document.body.clientHeight-60) - 20; 
  statsCanvas = document.getElementById('game-stats');
  statsCtx = statsCanvas.getContext('2d');
  statsCanvas.width = mainWidth;
  statsCanvas.height = 60;

  statsElemets = [];

  statsElemets.push(new Beehive(statsCtx, 0, -10, Beehive.baseColor1));
}

function initGame() {
  initStats();
  
  mainWidth = mainWidth || Math.min(document.body.clientWidth, document.body.clientHeight-60) - 20; 
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight-60;
  
  x = mainWidth / 2.1;
  y = mainWidth / 2.3;
  bear = bear || new Bear(ctx, x, y, Bear.FRONT);

  immovableProps = [];
  hives = [];
  let i = 0;

  let numTrees = mainWidth/30;
  while (i < numTrees) {
    let randX = Math.floor(Math.random() * canvas.width);
    let randY = Math.floor(Math.random() * canvas.height);
    let levelsHigh = 5 + Math.floor(Math.random() * 2);
    let tree = new Tree(ctx, randX, randY, levelsHigh);
    if (!boundingBoxesIntersect(bear.fullBoundingBoxObject, tree)) {
      var hasSpace = true;
      immovableProps.forEach((prop, i) => {
        if (boundingBoxesIntersect(prop, tree)) {
          hasSpace = false;
        }
      });
      if (hasSpace) {
        immovableProps.push(tree); i++;
      }
    }
  }

  let numHives = 5 // mainWidth/30;
  i = 0;
  while (i < numHives) {
    let randX = Math.floor(Math.random() * canvas.width);
    let randY = Math.floor(Math.random() * canvas.height);
    let hive = new Beehive(ctx, randX, randY, null, true);
    if (!boundingBoxesIntersect(bear.fullBoundingBoxObject, hive)) {
      var hasSpace = true;
      immovableProps.forEach((prop, i) => {
        if (boundingBoxesIntersect(prop, hive)) {
          hasSpace = false;
        }
      });
      if (hasSpace) {
        hives.push(hive); i++;
      }
    }
  }
  
  if (!movementListenersAttached) {
    const directionKeyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'w': 'up',
      's': 'down',
      'a': 'left',
      'd': 'right',
    }
    const keyEventHandler = (e) => {  
      let direction = directionKeyMap[e.key]
      if (direction) {
        movement[direction] = e.type == 'keydown';
      }
    }
    const mouseEventHandler = (e) => {
      let bearYoffSet = 120
      let XoffSet = 25
      let YoffSet = 50
      movement = {
        up: e.clientY - YoffSet < bear.y + bearYoffSet, 
        down: e.clientY + YoffSet > bear.y + bearYoffSet,
        left: e.clientX - XoffSet < bear.x,
        right: e.clientX + XoffSet > bear.x,
      }
      canvas.onmousemove = mouseEventHandler
    }

    const clearMovement = () => {
      movement = {};
      canvas.onmousemove = null;
    }

    document.addEventListener('keydown', keyEventHandler);
    document.addEventListener('keyup', keyEventHandler);
    canvas.addEventListener('mousedown', mouseEventHandler);
    canvas.addEventListener('mouseup', clearMovement);
    canvas.addEventListener('mouseout', clearMovement);

    movementListenersAttached = true;
  }

  setInterval(animate, 1000/45);
}

function animate() {
  animateStats();
  
  ctx.fillStyle = 'limegreen';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  immovableProps.forEach(prop => prop.render());
  hives.forEach(hive => hive.render());
  bear.render(x, y);

  
  // vvv BEAR MOVES vvv
  let prevX = x;
  let prevY = y;
  
  if (movement.up) {
    y -= speed;
    bear.face(Bear.BACK);
  }
  
  if (movement.down) {
    bear.face(Bear.FRONT);
    y += speed;
  }

  if (movement.left) {
    bear.face(Bear.LEFT);
    x -= speed;

  }

  if (movement.right) {
    bear.face(Bear.RIGHT);
    x += speed;
  }

  bear.move(x, y);
  let bearHasIntersect = immovableProps.reduce((a, prop) => {return a || boundingBoxesIntersect(bear, prop)}, false);
  if (bearHasIntersect) {
    bear.move(prevX, prevY);
    x = prevX;
    y = prevY;
  }

  hives.forEach((hive, i) => {
    if (boundingBoxesIntersect(bear, hive)) {
      bear.eat(hive);
      if (!hive.beesActive) {
        hives.splice(i, 1);
      }
    }
  })
  // ^^^ BEAR MOVES ^^^

  if (hives.length == 0) {
    newGame();
  }
}

function animateStats () {
  statsCtx.fillStyle = 'DarkSlateGray';
  statsCtx.fillRect(0, 0, statsCanvas.width, statsCanvas.height);
  statsElemets.forEach(element => element.render());
  
  statsCtx.fillStyle = 'white';
  statsCtx.font="50px Monospace";
  statsCtx.fillText(bear.stats.points, 80, 45);
  statsCtx.fillText("LEVEL: " + level, mainWidth-275, 45);
}


function newGame () {
  level++;
  window.__objects__ = [];
  initGame();
}