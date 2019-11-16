const random = (max, min = 0) => Math.floor(min + Math.random() * max)
const randomX = (scale = 0.9) => random(canvas.width * scale)
const randomY = (scale = 0.9) => random(canvas.height * scale)

window.block = function (x, y, color = 'black', width = 8, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height || width);
}

window.boundingBoxesIntersect = function (first, second) {
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

window.removeObjectFromContainer = function (obj, container) {
  let idx = container.findIndex(x => x === obj)
  return container.splice(idx, 1)
}

window.cleanUpAllFrom = function (...containers) {
  containers.map(container => container.length && container.map(item => window.removeObjectFromContainer(item, container)))
}


window.preventIntersection = function (item, { xScale, yScale }, collection) {
  while (collection.reduce((a, c) => a || window.boundingBoxesIntersect(item, c), false)) {
    console.log('Collision Detected with item', item.id)
    item.move(randomX(xScale), randomY(yScale))  
  }
}