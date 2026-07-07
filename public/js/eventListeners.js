function fireShot(clientX, clientY) {
  if (!frontEndPlayers[socket.id]) return

  const canvas = document.querySelector('canvas')
  const { left, top, width, height } = canvas.getBoundingClientRect()

  // convert CSS pixel position -> world coordinates (see section 3)
  const scaleX = WORLD_WIDTH / width
  const scaleY = WORLD_HEIGHT / height

  const playerPosition = {
    x: frontEndPlayers[socket.id].x,
    y: frontEndPlayers[socket.id].y
  }

  const angle = Math.atan2(
    (clientY - top) * scaleY - playerPosition.y,
    (clientX - left) * scaleX - playerPosition.x
  )

  socket.emit('shoot', { x: playerPosition.x, y: playerPosition.y, angle })
}

addEventListener('click', (event) => {
  if (event.target !== document.querySelector('canvas')) return
  fireShot(event.clientX, event.clientY)
})