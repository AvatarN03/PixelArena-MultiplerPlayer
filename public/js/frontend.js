const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const WORLD_WIDTH = 1024
const WORLD_HEIGHT = 576
const PLAYER_RADIUS = 10
const dpr = window.devicePixelRatio || 1

canvas.width = WORLD_WIDTH * dpr
canvas.height = WORLD_HEIGHT * dpr
c.scale(dpr, dpr)

function clampPosition(pos) {
  pos.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_WIDTH - PLAYER_RADIUS, pos.x))
  pos.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_HEIGHT - PLAYER_RADIUS, pos.y))
  return pos
}

const socket = io()

socket.on('connect', () => {
  console.log('Connected', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason)
  showToast(`You got disconnected: ${reason}`, 'danger')

  document.querySelector('#livePlayers').textContent = '0'
  Object.keys(frontEndPlayers).forEach((id) => delete frontEndPlayers[id])
  document.querySelector('#playerLabels').innerHTML = ''
  document.querySelector('#username-overlay').style.display = 'flex'
  Object.keys(frontEndProjectiles).forEach((id) => {
    delete frontEndProjectiles[id]
  })
})

socket.on('connect_error', (err) => {
  console.error(err)
  showToast('Unable to connect to the server.', 'danger')
  document.querySelector('#livePlayers').textContent = '0'
  document.querySelector('#playerLabels').innerHTML = ''
})

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

      const parentDiv = document.querySelector('#playerLabels')
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute('data-score'))
        const scoreB = Number(b.getAttribute('data-score'))
        return scoreB - scoreA
      })

      childDivs.forEach((div) => parentDiv.removeChild(div))
      childDivs.forEach((div) => parentDiv.appendChild(div))

      frontEndPlayers[id].target = {
        x: backEndPlayer.x,
        y: backEndPlayer.y
      }

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
        clampPosition(frontEndPlayers[id].target)
      } else {
        frontEndPlayers[id].x = backEndPlayer.x
        frontEndPlayers[id].y = backEndPlayer.y

        frontEndPlayers[id].target = {
          x: backEndPlayer.x,
          y: backEndPlayer.y
        }
      }
    }

    for (const id in frontEndPlayers) {
      if (!backEndPlayers[id]) {
        const divToDelete = document.querySelector(`div[data-id="${id}"]`)
        divToDelete?.parentNode.removeChild(divToDelete)

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

socket.on('rateLimit', ({ message }) => {
  showToast(message, 'danger')
})
const SPEED = 5
const playerInputs = []
let sequenceNumber = 0



function animate() {
  requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)
  if(sequenceNumber > 100000) {
    sequenceNumber = 0
  }

  for (const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id]
    if (frontEndPlayer.target) {
      frontEndPlayers[id].x +=
        (frontEndPlayers[id].target.x - frontEndPlayers[id].x) * 0.5
      frontEndPlayers[id].y +=
        (frontEndPlayers[id].target.y - frontEndPlayers[id].y) * 0.5
    }
    frontEndPlayer.draw()
  }
  for (const id in frontEndProjectiles) {
    frontEndProjectiles[id].draw()
  }
}
animate()


const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false }
}

setInterval(() => {
  if (!frontEndPlayers[socket.id]) return
  const now = Date.now()

  if (keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED, timestamp: now })
    frontEndPlayers[socket.id].y -= SPEED
    clampPosition(frontEndPlayers[socket.id])
    socket.emit('keydown', { code: 'KeyW', sequenceNumber })
  }
  if (keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0, timestamp: now })
    frontEndPlayers[socket.id].x -= SPEED
    clampPosition(frontEndPlayers[socket.id])
    socket.emit('keydown', { code: 'KeyA', sequenceNumber })
  }
  if (keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED, timestamp: now })
    frontEndPlayers[socket.id].y += SPEED
    clampPosition(frontEndPlayers[socket.id])
    socket.emit('keydown', { code: 'KeyS', sequenceNumber })
  }
  if (keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: +SPEED, dy: 0, timestamp: now })
    frontEndPlayers[socket.id].x += SPEED
    clampPosition(frontEndPlayers[socket.id])
    socket.emit('keydown', { code: 'KeyD', sequenceNumber })
  }

  // Safety net: drop anything the server never acknowledged within 10s,
  // so a desynced sequenceNumber can't let this grow forever.
  const STALE_INPUT_MS = 10000
  while (
    playerInputs.length &&
    now - playerInputs[0].timestamp > STALE_INPUT_MS
  ) {
    playerInputs.shift()
  }
}, 50)

window.addEventListener('keydown', (e) => {
  if (!frontEndPlayers[socket.id]) return
  switch (e.code) {
    case 'KeyA':
      keys.a.pressed = true
      break
    case 'KeyS':
      keys.s.pressed = true
      break
    case 'KeyD':
      keys.d.pressed = true
      break
    case 'KeyW':
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

const keyMap = { up: 'w', down: 's', left: 'a', right: 'd' }
const codeMap = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }

document.querySelectorAll('.dpad-btn').forEach((btn) => {
  const key = keyMap[btn.dataset.dir]
  const code = codeMap[btn.dataset.dir]

  const press = (e) => {
    e.preventDefault()
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

canvas.addEventListener(
  'touchstart',
  (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    fireShot(touch.clientX, touch.clientY)
  },
  { passive: false }
)

socket.on('eliminated', ({ killedBy }) => {
  showToast(`💀 You were eliminated by ${killedBy}`, 'danger')
  document.querySelector('#username-overlay').style.display = 'flex'
})

socket.on('killFeed', ({ killer, victim }) => {
  showToast(`${killer} eliminated ${victim}`, 'info')
})

function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message

  const existingToasts = document.querySelectorAll('.toast')
  toast.style.top = `${20 + existingToasts.length * 60}px`

  document.body.appendChild(toast)
  requestAnimationFrame(() => toast.classList.add('toast-success'))

  setTimeout(() => {
    toast.classList.remove('toast-success')
    toast.addEventListener(
      'transitionend',
      () => {
        toast.remove()
        document.querySelectorAll('.toast').forEach((t, index) => {
          t.style.top = `${20 + index * 60}px`
        })
      },
      { once: true }
    )
  }, 3000)
}

document.querySelector('#usernameForm').addEventListener('submit', (e) => {
  e.preventDefault()
  document.querySelector('#username-overlay').style.display = 'none'
  const username = document.querySelector('#usernameInput').value.trim()

  if (!username) {
    showToast('Enter username')
    return
  }
  socket.emit('initGame', {
    username
  })
  showToast(`You joined the Game!!`, 'success')
})
