var QUERY = Object.fromEntries(window.location.search.substr(1).split('&').map(x => x.split('=')))

var canvas, ctx, bear, immovableProps, hives;
var statsElements = {}
var x, y;
var speed = 4;
var level = 1;
var mainWidth;
var movement = {};
var movementListenersAttached;
window.showBoundingBoxes = !!QUERY.debug;
window.showObjectIds = !!QUERY.debug;
window.__objects__ = [];

const random = (max, min = 0) => Math.floor(min + Math.random() * max)
const randomX = (scale = 0.9) => random(canvas.width * scale)
const randomY = (scale = 0.9) => random(canvas.height * scale)

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
  statsElements.points = statsElements.points || document.querySelector('#game-stats #points') 
  statsElements.level = statsElements.level || document.querySelector('#game-stats #level') 
}

function initGame() {
  initStats();
  
  mainWidth = mainWidth || Math.min(document.body.clientWidth, document.body.clientHeight-60) - 20; 
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight-60;
  
  window.addEventListener('resize', () => {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight-60;
  })
  
  x = mainWidth / 2.1;
  y = mainWidth / 2.3;
  bear = bear || new Bear(ctx, x, y, Bear.FRONT);

  immovableProps = [];
  hives = [];
  let i = 0;

  let numTrees = mainWidth/15;
  if(!QUERY.noTrees) {
    while (i < numTrees) {
      let randX = randomX(2)
      let randY = randomY(1)
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
  } 

  let numHives = 4 + level // mainWidth/30;
  i = 0;
  while (i < numHives) {
    let randX = randomX(.8)
    let randY = randomY(.8)
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

      // handle shortcuts
      e.key === 'f' && document.documentElement.requestFullscreen();
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
      QUERY.debug && console.log(`Mouse(${e.clientX}, ${e.clientY}) | Bear(${bear.x}, ${bear.y})`, movement)
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

  level === 1 && setInterval(animate, 1000/45);
}

function animate() {
  renderStats();
  
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

function renderStats () {
  if (statsElements.points.GAME_VALUE !== bear.stats.points) {
    statsElements.points.innerHTML = bear.stats.points;
    statsElements.points.GAME_VALUE = bear.stats.points;
  }
  if (statsElements.level.GAME_VALUE !== level) {
    statsElements.level.innerHTML = level;
    statsElements.level.GAME_VALUE = level;
  }
}


function newGame () {
  level++;
  speed = 5 // get a little faster when you pass the first level
  window.__objects__ = [];
  initGame();
}