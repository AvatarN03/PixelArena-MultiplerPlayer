const express = require('express')
const app = express()
require('dotenv').config()

const http = require('http')
const server = http.createServer(app)

const { Server } = require('socket.io')
const io = new Server(server, {
  pingInterval: 25000,
  pingTimeout: 20000
}) // Attach Socket.IO to the server

const port = process.env.PORT || 3000

app.use(express.static('public'))

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html')
// })

app.get('/api/cron', async (req, res) => {
  try {
    console.log('Cron job triggered at:', new Date())

    res.status(200).json({
      success: true,
      message: 'Cron executed'
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      success: false
    })
  }
})

const backEndPlayers = {}

const backEndProjectiles = {}
let projectileId = 0;
const WORLD_WIDTH = 1024
const WORLD_HEIGHT = 576


io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)

  socket.on('shoot', ({ x, y, angle }) => {
    if (!backEndPlayers[socket.id]) return
    projectileId++
    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    backEndProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id
    }
  })

  //Broadcast
  io.emit('updatePlayers', backEndPlayers)

  socket.on('initGame', ({ width, height, username }) => {
    backEndPlayers[socket.id] = {
      x: 1024 * Math.random(),
      y: 576 * Math.random(),
      color: `hsl(${360 * Math.random()},100%,50%)`,
      sequenceNumber: 0,
      score: 0,
      username,
      canvas: {
        width,
        height
      },
      radius: 10
    }

    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]

    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('keydown', ({ code, sequenceNumber }) => {
    const backEndPlayer = backEndPlayers[socket.id]

    if (!backEndPlayers[socket.id]) return

    backEndPlayers[socket.id].sequenceNumber = sequenceNumber
    if (!backEndPlayers[socket.id]) return
    switch (code) {
      case 'KeyA':
        backEndPlayers[socket.id].x -= 5
        break

      case 'KeyS':
        backEndPlayers[socket.id].y += 5
        break

      case 'KeyD':
        backEndPlayers[socket.id].x += 5
        break

      case 'KeyW':
        backEndPlayers[socket.id].y -= 5
        break
    }
    const playerSides = {
      left: backEndPlayer.x - backEndPlayer.radius,
      right: backEndPlayer.x + backEndPlayer.radius,
      top: backEndPlayer.y - backEndPlayer.radius,
      bottom: backEndPlayer.y + backEndPlayer.radius
    }

    if (playerSides.left < 0) backEndPlayers[socket.id].x = backEndPlayer.radius

    if (playerSides.right > WORLD_WIDTH)
      backEndPlayers[socket.id].x = WORLD_WIDTH - backEndPlayer.radius

    if (playerSides.top < 0) backEndPlayers[socket.id].y = backEndPlayer.radius

    if (playerSides.bottom > WORLD_HEIGHT)
      backEndPlayers[socket.id].y = WORLD_HEIGHT - backEndPlayer.radius
  })
})

//backend Ticker
setInterval(() => {
  try {
    for (const id in backEndProjectiles) {
      backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
      backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

      const PROJECTILE_RADIUS = 5
      if (
        backEndProjectiles[id].x - PROJECTILE_RADIUS >=
          backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width ||
        backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 ||
        backEndProjectiles[id].y - PROJECTILE_RADIUS >=
          backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height ||
        backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0
      ) {
        delete backEndProjectiles[id]
        continue
      }

      for (const playerId in backEndPlayers) {
        const backEndPlayer = backEndPlayers[playerId]
        const DISTANCE = Math.hypot(
          backEndProjectiles[id].x - backEndPlayer.x,
          backEndProjectiles[id].y - backEndPlayer.y
        )

        //collision formula
        if (
          DISTANCE < backEndPlayer.radius + PROJECTILE_RADIUS &&
          backEndProjectiles[id].playerId !== playerId
        ) {
          const shooterId = backEndProjectiles[id].playerId
          const shooter = backEndPlayers[shooterId]
          const victim = backEndPlayers[playerId]

          if (shooter) shooter.score++

          io.to(playerId).emit('eliminated', {
            killedBy: shooter ? shooter.username : 'Unknown'
          })

          io.emit('killFeed', {
            killer: shooter ? shooter.username : 'Unknown',
            victim: victim ? victim.username : 'A player'
          })

          delete backEndProjectiles[id]
          delete backEndPlayers[playerId]
          break
        }
      }
    }

    io.emit('updateProjectiles', backEndProjectiles)
    io.emit('updatePlayers', backEndPlayers)
  } catch (error) {
    console.error('Ticker error:', err)
  }
}, 15)

server.listen(port, () => {
  console.log(`Server running at ${port}`)
})
