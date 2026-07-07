addEventListener('click', (event) => {
  if (!frontEndPlayers[socket.id]) return;

  const canvas = document.querySelector("canvas");

  // ignore clicks that aren't directly on the canvas
  // (buttons, D-pad, username form, etc. all bubble up otherwise)
  if (event.target !== canvas) return;

  const { left, top } = canvas.getBoundingClientRect();

  const playerPosition = {
    x: frontEndPlayers[socket.id].x,
    y: frontEndPlayers[socket.id].y
  };

  const angle = Math.atan2(
    (event.clientY - top) - playerPosition.y,
    (event.clientX - left) - playerPosition.x
  );

  socket.emit("shoot", {
    x: playerPosition.x,
    y: playerPosition.y,
    angle
  });
});