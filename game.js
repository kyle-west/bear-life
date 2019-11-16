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
var canvas, ctx; 
var bear, immovableProps = [], hives = [], hunters = [];
var statsElements = {}
var x, y;
var speed = QUERY.speed || 4;
var mainWidth;
var playerActions = {};
var movementListenersAttached;
var levelStartTime, levelMaxTime
var cleanup = {
  fnList: [],
  add: (fn) => cleanup.fnList.push(fn),
  exec: () => cleanup.fnList.forEach(fn => fn())
}
window.level = 0;
window.debug = !!QUERY.debug;


function initStats () {
  statsElements.points = statsElements.points || document.querySelector('#game-stats #points') 
  statsElements.lives = statsElements.lives || document.querySelector('#game-stats #lives') 
  statsElements.level = statsElements.level || document.querySelector('#game-stats #level')
  statsElements.countDown = statsElements.countDown || document.querySelector('#game-stats #countDown')
}

function initGame() {
  window.debug && console.log('>>>>>>>>>>>>>>>>>>>> initGame CALLED', level)
  initStats();
  
  // Set up the canvas
  mainWidth = mainWidth || Math.min(document.body.clientWidth, document.body.clientHeight-60) - 20; 
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight-60;
  

  // Initialize our Player as a Bear
  x = mainWidth / 2.1;
  y = mainWidth / 2.3;
  bear = bear || new Bear(ctx, x, y, Bear.FRONT);

  let i = 0;
  
  immovableProps = []
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
      } else {
        window.removeObjectFromContainer(tree, immovableProps)
      }
    }
  }
  
  
  hives = []
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
        hives.push(hive); 
        i++;
      }
    }
  }
  
  
  // Insert Hunters into the game one more every 4 levels
  let numHunters = QUERY.numHunters || Math.floor(level / 4)
  hunters = []
  for (let h = 0; h < numHunters; ++h) {
    // create hunter and move where there is no intersection
    let xScale = 1, yScale = 1;    
    let hunter = new Hunter(ctx, randomX(xScale), randomY(yScale));
    window.preventIntersection(hunter, { xScale, yScale }, [ bear, ...immovableProps, ...hives ])
    hunters.push(hunter)
    
    // Track the bear and start shooting
    hunter.track(bear)
    hunter.face(randomX > (canvas.width / 2) ? Hunter.LEFT : Hunter.RIGHT)
  }


  // Attach Controls for User Interaction
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
    window.addEventListener('resize', () => {
      canvas.width = document.body.clientWidth;
      canvas.height = document.body.clientHeight-60;
    })

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
  // render environment and items
  renderStats();
  ctx.fillStyle = 'limegreen';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  immovableProps.forEach(prop => prop.render());
  hives.forEach(hive => hive.render());
  hunters.forEach(hunter => hunter.render());
  bear.render(x, y);

  // collect controls from any joysticks
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
  // ^^^ BEAR MOVES ^^^
  
  // see if we have intersected any trees
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
  
  // check if hunter has made any hits to our bear
  hunters.forEach(hunter => {
    hunter.checkForHits()
    hunter.checkBulletBounds(canvas)
  })

  // check to see if we can eat any honey!
  hives.forEach((hive, i) => {
    if (boundingBoxesIntersect(bear, hive)) {
      bear.eat(hive);
      if (!hive.beesActive) {
        window.removeObjectFromContainer(hive, hives);
      }
    }
  })

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
  4: `
    Oh no! It's open season: Watch out for hunters! 
  `,
}