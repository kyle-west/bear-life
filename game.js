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
var canvas, ctx, bear, immovableProps, hives, hunters, bullets;
var statsElements = {}
var x, y;
var speed = QUERY.speed || 4;
var level = 0;
var mainWidth;
var playerActions = {};
var movementListenersAttached;
var levelStartTime, levelMaxTime
var cleanup = {
  fnList: [],
  add: (fn) => cleanup.fnList.push(fn),
  exec: () => cleanup.fnList.forEach(fn => fn())
}
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

function removeObjectFromContainer(obj, container) {
  let idx = container.findIndex(x => x === obj)
  return container.splice(idx, 1)
}
function cleanUpObject(obj, container) {
  removeObjectFromContainer(obj, container)
  removeObjectFromContainer(obj, window.__objects__)
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
  statsElements.lives = statsElements.lives || document.querySelector('#game-stats #lives') 
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
  hunters = [];
  bullets = [];
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
      immovableProps.forEach((prop) => {
        if (boundingBoxesIntersect(prop, hive)) {
          hasSpace = false;
        }
      });
      if (hasSpace) {
        hives.push(hive); i++;
      }
    }
  }

  let numHunters = QUERY.numHunters || level
  i = 0;
  while (i < numHunters) {
    let randX = randomX(1)
    let randY = randomY(1)
    let face = randomX > (canvas.width / 2) ? Hunter.LEFT : Hunter.RIGHT
    let hunter = new Hunter(ctx, randX, randY, face);
    if (!boundingBoxesIntersect(bear.fullBoundingBoxObject, hunter)) {
      var hasSpace = true;
      immovableProps.forEach((prop) => {
        if (boundingBoxesIntersect(prop, hunter)) {
          hasSpace = false;
        }
      });
      if (hasSpace) {
        hunters.push(hunter); i++;
        hunter.track(bear)
        let fireInterval = setInterval(() => {
          bullets.push(hunter.fireAt(bear))
        }, random(5000, 1000));
        cleanup.add(() => clearInterval(fireInterval))
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

    function attachGamepads(e) {
      gamepad = navigator.getGamepads()[e.gamepad.index];
      console.log('gamepad attached')
      window.addEventListener("gamepaddisconnected", function(e) {
        gamepad = null
        console.log('gamepad disconnected')
      }, {once: true});
    }

    document.addEventListener('keydown', keyEventHandler);
    document.addEventListener('keyup', keyEventHandler);
    canvas.addEventListener('mousedown', mouseEventHandler);
    canvas.addEventListener('mouseup', clearMovement);
    canvas.addEventListener('mouseout', clearMovement);
    window.addEventListener("gamepadconnected", attachGamepads);

    cleanup.add(() => {
      document.removeEventListener('keydown', keyEventHandler);
      document.removeEventListener('keyup', keyEventHandler);
      canvas.removeEventListener('mousedown', mouseEventHandler);
      canvas.removeEventListener('mouseup', clearMovement);
      canvas.removeEventListener('mouseout', clearMovement);
      window.removeEventListener("gamepadconnected", attachGamepads);
    })

    movementListenersAttached = true;
  }

  levelStartTime = new Date()
  levelMaxTime = QUERY.time || Math.min(Math.ceil(level/2) * 15 + 30, 300) // between 0:45 and 5:00, increasing by 0:15 every two levels 

  if (level === 1) {
    let gameInterval = setInterval(animate, 1000/45);
    cleanup.add(() => clearInterval(gameInterval))
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
}

function animate() {
  renderStats();
  
  ctx.fillStyle = 'limegreen';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  immovableProps.forEach(prop => prop.render());
  hives.forEach(hive => hive.render());
  hunters.forEach(hunter => hunter.render());
  bullets.forEach(bullet => bullet.render());
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
  
  // trees
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
  
  // bullets
  let intersectedBullet = bullets.reduce((a, bullet) => {return a || (boundingBoxesIntersect(bear.targetBoundingBoxObject, bullet) && bullet)}, null);
  if (intersectedBullet) {
    bear.getHit()
    cleanUpObject(intersectedBullet, bullets)
  }
  bullets.forEach(b => {
    let {width : x, height: y} = canvas
    let outOfBounds = b.checkBounds({ x, y })
    if (outOfBounds) {
      cleanUpObject(b, bullets)
    }
  })


  // hives
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
  if (statsElements.lives.GAME_VALUE !== bear.stats.lives) {
    statsElements.lives.innerHTML = bear.stats.lives;
    statsElements.lives.GAME_VALUE = bear.stats.lives;
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
  initGame()
  document.dispatchEvent(new CustomEvent('New Level'))
}


LEVEL_MSG = {
  1: `
    Goal of the game: get all the honey you can before time runs out. <br/> 
    But don't let the bees sting you! Once they go into their hive it is safe to attack.
  `,
  2: `
    Now that you have gotten some energy from the honey you have eaten, you can now punch your way around obstacles. <br/>
    Try it out by running up against a tree and pressing the [SPACE] bar.
  `,
}