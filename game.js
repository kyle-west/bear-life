var QUERY = !!window.location.search &&
  Object.fromEntries(
    window.location
          .search
          .substr(1)
          .split('&')
          .map(x => x.split('='))
          .map(([k,v]) => [k, JSON.parse(v)])
  )
console.log(QUERY)
var gamepad = null;
var canvas, ctx, bear, immovableProps, hives;
var statsElements = {}
var x, y;
var speed = QUERY.speed || 4;
var level = 1;
var mainWidth;
var playerActions = {};
var movementListenersAttached;
var levelStartTime, levelMaxTime
var gameInterval
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
  statsElements.countDown = statsElements.countDown || document.querySelector('#game-stats #countDown')
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

  let numTrees = QUERY.numTrees === undefined ? Math.min(Math.floor((mainWidth/15) * ((level + 1) * .5)), mainWidth/6) : QUERY.numTrees
  while (i < numTrees) {
    let randX = randomX(2)
    let randY = randomY(1)
    let levelsHigh = 5 + Math.floor(Math.random() * 2);
    let tree = new Tree(ctx, randX, randY, levelsHigh);
    if (!boundingBoxesIntersect(bear, tree) && !boundingBoxesIntersect(bear.fullBoundingBoxObject, tree)) {
      var hasSpace = true;
      immovableProps.forEach((prop) => {
        if (boundingBoxesIntersect(prop, tree)) {
          hasSpace = false;
        }
      });
      if (hasSpace) {
        immovableProps.push(tree); i++;
      }
    }
  }
  

  let numHives = QUERY.numHives || (4 + level)
  i = 0;
  while (i < numHives) {
    let randX = randomX(.8)
    let randY = randomY(.8)
    let hive = new Beehive(ctx, randX, randY, null, QUERY.noBees === undefined);
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
        playerActions[direction] = e.type == 'keydown';
        playerActions.punch = false; 
      }

      // handle game keys
      if (e.type == 'keydown') {
        switch (e.key) {
          // fullscreen
          case 'f': document.documentElement.requestFullscreen(); break;

          case 'Space': 
          case ' ': 
            playerActions.punch = true; 
            console.log('punch')
            break;
        }
      }
    }
    const mouseEventHandler = (e) => {
      let bearYoffSet = 120
      let XoffSet = 25
      let YoffSet = 50
      playerActions = {
        up: e.clientY - YoffSet < bear.y + bearYoffSet, 
        down: e.clientY + YoffSet > bear.y + bearYoffSet,
        left: e.clientX - XoffSet < bear.x,
        right: e.clientX + XoffSet > bear.x,
      }
      QUERY.debug && console.log(`Mouse(${e.clientX}, ${e.clientY}) | Bear(${bear.x}, ${bear.y})`, playerActions)
      canvas.onmousemove = mouseEventHandler
    }

    const clearMovement = () => {
      playerActions = {};
      canvas.onmousemove = null;
    }

    document.addEventListener('keydown', keyEventHandler);
    document.addEventListener('keyup', keyEventHandler);
    canvas.addEventListener('mousedown', mouseEventHandler);
    canvas.addEventListener('mouseup', clearMovement);
    canvas.addEventListener('mouseout', clearMovement);
    
    window.addEventListener("gamepadconnected", function(e) {
      gamepad = navigator.getGamepads()[e.gamepad.index];
      console.log('gamepad attached')
      window.addEventListener("gamepaddisconnected", function(e) {
        gamepad = null
        console.log('gamepad disconnected')
      }, {once: true});
    });

    movementListenersAttached = true;
  }

  levelStartTime = new Date()
  levelMaxTime = QUERY.time || 120 // seconds

  if (level === 1) {
    gameInterval = setInterval(animate, 1000/45);
  }
}

const axisThreshold = (value) => Math.abs(value) > 0.5
function pollGamepad () {
  [gamepad] = navigator.getGamepads()
  if (!gamepad) return
  let [leftRight, upDown] = gamepad.axes
  QUERY.debug && console.log(`leftRight, upDown | ${[leftRight, upDown]}`)
  playerActions = {
    up: upDown < 0 && axisThreshold(upDown),
    down: upDown > 0 && axisThreshold(upDown),
    left: leftRight < 0 && axisThreshold(leftRight),
    right: leftRight > 0 && axisThreshold(leftRight),
  }
  gamepad
}

function animate() {
  renderStats();
  
  ctx.fillStyle = 'limegreen';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  immovableProps.forEach(prop => prop.render());
  hives.forEach(hive => hive.render());
  bear.render(x, y);

  gamepad && pollGamepad()
  
  // vvv BEAR MOVES vvv
  let prevX = x;
  let prevY = y;
  
  if (playerActions.up) {
    y -= speed;
    bear.face(Bear.BACK);
  }
  
  if (playerActions.down) {
    bear.face(Bear.FRONT);
    y += speed;
  }

  if (playerActions.left) {
    bear.face(Bear.LEFT);
    x -= speed;
  }

  if (playerActions.right) {
    bear.face(Bear.RIGHT);
    x += speed;
  }

  bear.move(x, y);
  let intersectedObject = immovableProps.reduce((a, prop) => {return a || (boundingBoxesIntersect(bear, prop) && prop)}, null);
  if (intersectedObject) {
    if (playerActions.punch && intersectedObject.canPunch) {
      bear.throwPunch() && intersectedObject.getPunched()
    } 
    playerActions.punch = false;
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

  if (QUERY.points) {
    bear.stats.points = QUERY.points
  }
}

function renderTime(seconds) {
  let min = Math.floor(seconds/60).toString().padStart(2,'0')
  let sec = Math.floor(seconds % 60).toString().padStart(2,'0')
  return `${min}:${sec}`
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
  
  // Clock
  let timeUsed = Math.floor((new Date() - levelStartTime)/1000)
  let timeRemaining = levelMaxTime - timeUsed
  if (statsElements.countDown.GAME_VALUE !== timeRemaining) {
    statsElements.countDown.innerHTML = renderTime(timeRemaining);
    statsElements.countDown.GAME_VALUE = timeRemaining;
  }
  if (timeRemaining < 0) {
    document.dispatchEvent(new CustomEvent('Game Over'))
  }
}


function newGame () {
  level++;
  speed = QUERY.speed || speed++ // get a little faster when you pass the first level
  window.__objects__ = [];
  initGame();
}

document.addEventListener('Game Over', () => {
  clearInterval(gameInterval);
  document.querySelector('#game-over').classList.add('show')
})