
# PixelArena

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

A fast-paced real-time multiplayer browser game built with **HTML5 Canvas**, **Node.js**, **Express**, and **Socket.IO**.

PixelArea demonstrates a complete **server-authoritative** multiplayer architecture with client-side prediction, server reconciliation, interpolation, and real-time synchronization.

**Live Demo:** [🌐 https://online-multiplayer-js.onrender.com](https://online-multiplayer-js.onrender.com)

*(Add a gameplay GIF here - highly recommended)*

## Features

- Real-time multiplayer gameplay
- Smooth player movement with WASD
- Mouse aiming and clicking to shoot
- Projectile combat system
- Collision detection (players & projectiles)
- Live leaderboard
- Client-side prediction
- Server reconciliation
- Remote player interpolation (GSAP)
- Random spawn locations
- Username selection
- Responsive design

## Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- HTML5 Canvas
- GSAP (for smooth interpolation)

### Backend
- Node.js
- Express.js
- Socket.IO

### Deployment
- Render
- GitHub Actions (keep-alive cron job)

## Gameplay

Players join the arena and compete in a top-down shooter:

- Move with **WASD**
- Aim with mouse
- Click to shoot projectiles
- Eliminate opponents to gain points
- Compete on the live leaderboard

## Multiplayer Architecture

PixelArea uses a **server-authoritative** model:

```
Player Input → Client Prediction → Socket.IO → Node.js Server
          → Collision Detection → Game State Update → Broadcast
```

**Key Concepts Implemented:**
- **Client-side Prediction**: Instant local movement feedback
- **Server Reconciliation**: Correcting client state using sequence numbers
- **Interpolation**: Smooth rendering of remote players
- **Projectile Synchronization**: Server-authoritative projectiles

## Installation

```bash
# Clone the repository
git clone https://github.com/AvatarN03/PixelArena-MultiplerPlayer.git
cd PixelArea

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```bash
PixelArea/
├── public/
│   ├── img/
│   ├── js/
│   │   ├── classes/
│   │   ├── eventListeners.js
│   │   └── frontend.js
│   └── index.html
├── backend.js
├── package.json
├── .env
└── README.md
```

## Deployment

Deployed on **Render**. A GitHub Actions workflow pings the server every 15 minutes to prevent the free tier from sleeping.

## Future Improvements

- Rooms / Matchmaking system
- Health system + respawn timer
- Sound effects
- Mobile touch controls
- Power-ups and multiple weapons
- Particle effects
- Persistent leaderboard (database)
- Authentication
- Anti-cheat improvements

## What I Learned

- Real-time networking with WebSockets
- Server-authoritative game architecture
- Client-side prediction & reconciliation
- Canvas rendering and game loops
- Collision detection algorithms
- Smooth interpolation techniques
- Deployment and server keep-alive strategies


**License**: MIT  
**Author**: Prashanth Naidu  
**GitHub**: [AvatarN03](https://github.com/AvatarN03)
##
##