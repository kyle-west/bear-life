(() => {
  document.addEventListener('Start Game', () => {
    let welcomeSplash = document.getElementById('welcome-splash')
    welcomeSplash.classList.remove('show')
    newGame()
  }, { once: true })
  
  document.addEventListener('New Level', () => {
    let msg = LEVEL_MSG[level]
    if (!msg) return;

    let levelMsg = document.querySelector('#level-msg')
    
    levelMsg.innerHTML = LEVEL_MSG[level]
    levelMsg.classList.add('show')
    
    setTimeout(() => {
      levelMsg.classList.remove('show')
    }, 15000)
  })
  
  document.addEventListener('Game Over', () => {
    if (QUERY.preventGameOver) return
    
    cleanup.exec()
    window.finalStats = {
      level,
      hives: bear.stats.points,
      points: bear.stats.points > 0 || level > 1 ? (level - 0.5) * 150 + bear.stats.points : 0
    }
    document.querySelector('#end-stats').innerHTML = `
    LEVEL: ${finalStats.level}<br/>
    HIVES EATEN: ${finalStats.hives}<br/>
    TOTAL POINTS: ${finalStats.points}<br/>
    `
    document.querySelector('#game-over-splash').classList.add('show')
    document.querySelector('#game-over-splash [name=first]').focus()
  })
})()


let highScores = JSON.parse(localStorage.getItem('__high_scores__') || '[]')
function addHighScore (score) {
  highScores.push(score)
  highScores.sort((a, b) => {
    let aPoints = a.score.points
    let bPoints = b.score.points
    return bPoints - aPoints;
  })
  localStorage.setItem('__high_scores__', JSON.stringify(highScores))
  return highScores.findIndex(x => x === score) // rank
}

let initialElements = [...document.querySelectorAll('[initials]')]

function handleInitials (e) {
  let { key, currentTarget } = e
  if (key === currentTarget.value) {
    initialElements.forEach((element, index) => {
      if (element === currentTarget) {
        let nextElement = initialElements[index + 1]
        nextElement.focus()
      }
    })
  }
}

function submit(e) {
  let [{ value: first = ' ' }, { value:middle = ' '}, { value:last = ' ' }] = initialElements;
  let initials = [first, middle, last].map(x => x.toUpperCase()).join(' ')
  let rank = addHighScore({
    name: initials,
    score: window.finalStats
  })
  showHighScores(rank, highScores)
}

function map(items, fn) {
  return items.map(fn).join('')
}

function showHighScores (rank, scores) {
  let textRank = ['1ST', '2ND', '3RD'][rank] || `${rank + 1}TH`
  let html = `
    <div center>
      <span gold>HIGH SCORES</span> <br/><br/>
      <span small>${rank < 3 ? '&#9733;' : ''} YOU GOT ${textRank} PLACE ${rank < 3 ? '&#9733;' : ''}</span> <br/><br/>
      <div highscores>
        <ol>
          ${map(scores, ({name, score}, index) => `<li${index === rank ? ' gold' : (index < 3 ? ' blue' : '')}>
            ${(index + 1).toString().padStart(2, '0')} : <span ${index === rank ? ' gold' : (index < 3 ? ' blue' : 'cyan')}>${name}</span> ${score.points.toString().padStart(6,'0')}
          </li>`)}
        <ol>
      </div>
      <br/>
      <button onclick="window.location.reload()">PLAY AGAIN</button>
    </div>
  `
  document.getElementById('game-over-splash').innerHTML = html;
}

initialElements.forEach(i => i.type === 'text' ? (i.onkeyup = handleInitials) : (i.onclick = submit))


// Auto start game on debug
QUERY.debug && document.dispatchEvent(new CustomEvent('Start Game'))