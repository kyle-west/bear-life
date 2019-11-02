var canvas, ctx, bear, immovableProps, hives;
var statsCanvas, statsCtx, statsElemets;
var x, y;
var speed = 7;
var level = 1;
var mainWidth;
var keyBoardLisetnersAttached;
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
  canvas.width = mainWidth;
  canvas.height = mainWidth;
  
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
  
  if (!keyBoardLisetnersAttached) {
    document.addEventListener('keydown', (e) => {
      let prevX = x;
      let prevY = y;
      switch (e.key) {
        case "ArrowUp":
          y -= speed;
          bear.face(Bear.BACK);
          break;
        case "ArrowDown": 
          bear.face(Bear.FRONT);
          y += speed;
          break;
        case "ArrowLeft": 
          bear.face(Bear.LEFT);
          x -= speed;
          break;
        case "ArrowRight": 
          bear.face(Bear.RIGHT);
          x += speed;
          break;
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
    });

    keyBoardLisetnersAttached = true;
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