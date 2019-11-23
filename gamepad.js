// The goal of this file is to map the gamepad events to keyboard events
// this will allow for optimal reuse and compatibility 

let gamepad = null;
const axisThreshold = (value) => Math.abs(value) > 0.25
let lastState = {}

function pollGamepad () {
  [gamepad] = navigator.getGamepads()
  if (!gamepad) return

  let [leftRight, upDown] = gamepad.axes
  let [main] = gamepad.buttons

  let currentState = {
    up: upDown < 0 && axisThreshold(upDown),
    down: upDown > 0 && axisThreshold(upDown),
    left: leftRight < 0 && axisThreshold(leftRight),
    right: leftRight > 0 && axisThreshold(leftRight),
    main: main && main.pressed,
  }
 
  Object.keys(currentState).forEach(key => {
    if (currentState[key] === lastState[key]) return
    let event = new CustomEvent(
      `Gamepad::${currentState[key] ? 'KeyDown' : 'KeyUp'}`, 
      { detail: { key } }
    )
    document.dispatchEvent(event)
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

document.addEventListener('Gamepad::KeyDown', console.log)
document.addEventListener('Gamepad::KeyUp', console.log)