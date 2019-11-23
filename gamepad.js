// The goal of this file is to map the gamepad events to keyboard events
// this will allow for optimal reuse and compatibility 

let gamepad = null;
const axisThreshold = (value) => Math.abs(value) > 0.25
let lastState = {}

function pollGamepad () {
  [gamepad] = navigator.getGamepads()
  if (!gamepad) return

  let [leftRight, upDown] = gamepad.axes
  let [Enter] = gamepad.buttons

  let currentState = {
    ArrowUp: upDown < 0 && axisThreshold(upDown),
    ArrowDown: upDown > 0 && axisThreshold(upDown),
    ArrowLeft: leftRight < 0 && axisThreshold(leftRight),
    ArrowRight: leftRight > 0 && axisThreshold(leftRight),
    Enter: Enter && Enter.pressed,
  }
 
  Object.keys(currentState).forEach(key => {
    if (currentState[key] === lastState[key]) return
    let event = new KeyboardEvent(currentState[key] ? 'keydown' : 'keyup', { key, bubbles: true})
    document.activeElement.dispatchEvent(event)
  })
  lastState = currentState
}

function attachGamepads(e) {
  gamepad = navigator.getGamepads()[e.gamepad.index];
  console.log('gamepad attached')
  let pollInterval = setInterval(pollGamepad, 200)
  window.addEventListener("gamepaddisconnected", function(e) {
    gamepad = null
    clearInterval(pollInterval)
    console.log('gamepad disconnected')
  }, {once: true});
}
window.addEventListener("gamepadconnected", attachGamepads);
