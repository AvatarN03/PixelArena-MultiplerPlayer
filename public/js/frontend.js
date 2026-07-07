const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

socket.on('connect', () => {
  console.log('Connected', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason)
})

socket.on('connect_error', (err) => {
  console.error(err)
})

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = devicePixelRatio * 1024
canvas.height = devicePixelRatio * 576

c.scale(devicePixelRatio, devicePixelRatio)

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndPlayers = {}
const frontEndProjectiles = {}

socket.on('updateProjectiles', (backEndProjectiles) => {
  for (const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id]
    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: 5,
        color: frontEndPlayers[backEndProjectile.playerId]?.color,
        velocity: backEndProjectile.velocity
      })
    } else {
      frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x
      frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y
    }
  }
  for (const frontEndProjectile in frontEndProjectiles) {
    if (!backEndProjectiles[frontEndProjectile]) {
      delete frontEndProjectiles[frontEndProjectile]
    }
  }
})

socket.on('updatePlayers', (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]

    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 10,
        color: backEndPlayer.color,
        username: backEndPlayer.username
      })
      document.querySelector('#playerLabels').innerHTML +=
        `<div data-id="${id}" data-score="${backEndPlayer.score}"> ${backEndPlayer.username}: ${backEndPlayer.score}</div>`
    } else {
      document.querySelector(`div[data-id="${id}"]`).innerHTML =
        `${backEndPlayer.username}: ${backEndPlayer.score}`

      document
        .querySelector(`div[data-id="${id}"]`)
        .setAttribute('data-score', backEndPlayer.score)

      //sort the scores of the players in UI
      const parentDiv = document.querySelector('#playerLabels')
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute('data-score'))
        const scoreB = Number(b.getAttribute('data-score'))

        return scoreB - scoreA
      })

      // removes old elements
      childDivs.forEach((div) => {
        parentDiv.removeChild(div)
      })

      // adds sorted elements
      childDivs.forEach((div) => {
        parentDiv.appendChild(div)
      })

      frontEndPlayers[id].target = {
        x: backEndPlayer.x,
        y: backEndPlayer.y
      }

      /// for the current player
      if (id === socket.id) {
        frontEndPlayers[id].x = backEndPlayer.x
        frontEndPlayers[id].y = backEndPlayer.y

        const lastIndex = playerInputs.findIndex((input) => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber
        })

        if (lastIndex > -1) {
          playerInputs.splice(0, lastIndex + 1)
        }

        playerInputs.forEach((input) => {
          frontEndPlayers[id].target.x += input.dx
          frontEndPlayers[id].target.y += input.dy
        })
      } else {
        /// for al other players
        frontEndPlayers[id].x = backEndPlayer.x
        frontEndPlayers[id].y = backEndPlayer.y

        gsap.to(frontEndPlayers[id], {
          x: backEndPlayer.x,
          y: backEndPlayer.y,
          duration: 0.015,
          ease: 'linear'
        })
      }
    }

    for (const id in frontEndPlayers) {
      if (!backEndPlayers[id]) {
        const divToDelete = document.querySelector(`div[data-id="${id}"]`)
        divToDelete.parentNode.removeChild(divToDelete)

        if (id === socket.id) {
          document.querySelector('#usernameForm').style.display = 'block'
        }
        delete frontEndPlayers[id]
      }
    }
  }
  const totalPlayers = Object.keys(backEndPlayers).length
  document.querySelector('#livePlayers').textContent = Math.max(
    0,
    totalPlayers - 1
  )
})

let animationId

function animate() {
  animationId = requestAnimationFrame(animate)
  // c.fillStyle = 'rgba(0, 0, 0, 0.1)'

  c.clearRect(0, 0, canvas.width, canvas.height)

  for (const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id]
    // linear interpolation
    if (frontEndPlayer.target) {
      frontEndPlayers[id].x +=
        (frontEndPlayers[id].target.x - frontEndPlayers[id].x) * 0.5
      frontEndPlayers[id].y +=
        (frontEndPlayers[id].target.y - frontEndPlayers[id].y) * 0.5
    }

    frontEndPlayer.draw()
  }
  for (const id in frontEndProjectiles) {
    const frontEndProjectile = frontEndProjectiles[id]

    frontEndProjectile.draw()
  }
  // its better to loop from the end instead of beginning in projectileArray
  // for(let i=frontEndProjectiles.length-1; i >=0; i--){
  //   const frontEndProjectile = frontEndProjectiles[i];
  //   frontEndProjectile.update();

  // }
}

animate()

const SPEED = 5
const playerInputs = []
let sequenceNumber = 0

const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

setInterval(() => {
  if (!frontEndPlayers[socket.id]) return
  if (keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED })
    frontEndPlayers[socket.id].y -= SPEED
    socket.emit('keydown', { code: 'KeyW', sequenceNumber })
  }
  if (keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 })
    frontEndPlayers[socket.id].x -= SPEED
    socket.emit('keydown', { code: 'KeyA', sequenceNumber })
  }
  if (keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED })
    frontEndPlayers[socket.id].y += SPEED
    socket.emit('keydown', { code: 'KeyS', sequenceNumber })
  }
  if (keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: +SPEED, dy: 0 })
    frontEndPlayers[socket.id].x += SPEED
    socket.emit('keydown', { code: 'KeyD', sequenceNumber })
  }
}, 15)

window.addEventListener('keydown', (e) => {
  if (!frontEndPlayers[socket.id]) return
  switch (e.code) {
    case 'KeyA':
      // frontEndPlayers[socket.id].x -= 5;
      // socket.emit("keydown", 'KeyA')
      keys.a.pressed = true

      break

    case 'KeyS':
      // frontEndPlayers[socket.id].y += 5;
      // socket.emit("keydown", 'KeyS')
      keys.s.pressed = true

      break

    case 'KeyD':
      // frontEndPlayers[socket.id].x += 5;
      // socket.emit("keydown", 'KeyD')
      keys.d.pressed = true

      break

    case 'KeyW':
      // frontEndPlayers[socket.id].y -= 5;
      // socket.emit("keydown", 'KeyW')
      keys.w.pressed = true

      break
  }
})

window.addEventListener('keyup', (e) => {
  if (!frontEndPlayers[socket.id]) return
  switch (e.code) {
    case 'KeyA':
      keys.a.pressed = false
      break

    case 'KeyS':
      keys.s.pressed = false
      break

    case 'KeyD':
      keys.d.pressed = false
      break

    case 'KeyW':
      keys.w.pressed = false
      break
  }
})

function resizeCanvas() {
  const container = document.querySelector('.game-container')
  const rect = container.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  c.setTransform(1, 0, 0, 1, 0, 0) // reset before rescaling
  c.scale(dpr, dpr)

  // expose logical (CSS) size for your game logic to use
  canvas.gameWidth = rect.width
  canvas.gameHeight = rect.height
}

window.addEventListener('resize', resizeCanvas)
window.addEventListener('orientationchange', () =>
  setTimeout(resizeCanvas, 100)
)
resizeCanvas()
const keyMap = { up: 'w', down: 's', left: 'a', right: 'd' }
const codeMap = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }
let lastDir = { dx: 1, dy: 0 } // default: aim right

const dirVectors = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
}

document.querySelectorAll('.dpad-btn').forEach((btn) => {
  const key = keyMap[btn.dataset.dir]
  const code = codeMap[btn.dataset.dir]
  const dir = dirVectors[btn.dataset.dir]

  const press = (e) => {
    e.preventDefault()
    lastDir = dir
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code }))
  }
  const release = (e) => {
    e.preventDefault()
    window.dispatchEvent(new KeyboardEvent('keyup', { key, code }))
  }

  btn.addEventListener('touchstart', press, { passive: false })
  btn.addEventListener('touchend', release, { passive: false })
  btn.addEventListener('mousedown', press)
  btn.addEventListener('mouseup', release)
})

document.querySelector('.shoot-btn').addEventListener(
  'touchstart',
  (e) => {
    e.preventDefault()
    e.stopPropagation()

    const player = frontEndPlayers[socket.id]
    const rect = canvas.getBoundingClientRect()

    // aim 100px out from the player, in the last direction moved
    const clientX = player
      ? rect.left + player.x + lastDir.dx * 100
      : rect.left + rect.width / 2
    const clientY = player
      ? rect.top + player.y + lastDir.dy * 100
      : rect.top + rect.height / 2

    canvas.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY
      })
    )
  },
  { passive: false }
)

document.querySelector('#usernameForm').addEventListener('submit', (e) => {
  e.preventDefault()
  document.querySelector('#username-overlay').style.display = 'none'
  console.log(document.querySelector('#usernameInput').value)
  socket.emit('initGame', {
    username: document.querySelector('#usernameInput').value,
    width: canvas.width,
    height: canvas.height
  })
})
