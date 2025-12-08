# 🎮 SLAVE - Multiplayer Card Game

Real-time multiplayer card game built with Next.js and deployed on Vercel. Play the classic "Slave" (President/Scum) card game with friends online!

## ✨ Features

- 🎯 **Real-time Multiplayer** - Play with 4 players simultaneously
- 🎨 **Premium UI** - Beautiful dark theme with glassmorphism effects
- ⚡ **Fast & Responsive** - Smooth animations and instant updates
- 🚀 **Serverless** - Deployed on Vercel with no database required
- 📱 **Mobile Friendly** - Responsive design works on all devices

## 🎲 Game Rules

**Slave** (also known as President, Scum, or Asshole) is a card game for 4 players:

1. **Setup**: Each player receives 13 cards from a shuffled deck
2. **Objective**: Be the first to get rid of all your cards
3. **Playing**: 
   - Players take turns playing cards of higher value than the previous play
   - You can play singles, pairs, triples, or quads (must match previous play count)
   - Card ranking: 3 (lowest) → 4 → 5 → ... → A → 2 (highest)
   - If you can't or don't want to play, you can pass
4. **Round Reset**: When all players pass, the last player who played starts a new round
5. **Winning**: First player to empty their hand wins

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd slave-card-game

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Building for Production

```bash
npm run build
npm start
```

## 📦 Deploying to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy" (Vercel will auto-detect Next.js)
6. Your game will be live at `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## 🏗️ Project Structure

```
slave-card-game/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── game/          # Game room pages
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/
│   │   ├── GameBoard.tsx  # Main game interface
│   │   ├── Lobby.tsx      # Lobby/room list
│   │   ├── PlayArea.tsx   # Center play area
│   │   ├── PlayerHand.tsx # Player's cards
│   │   └── PlayerStatus.tsx # Player info
│   └── lib/
│       ├── gameLogic.ts   # Game rules
│       ├── gameState.ts   # In-memory state
│       └── types.ts       # TypeScript types
└── public/                # Static assets
```

## 🎯 API Routes

- `POST /api/rooms` - Create a new game room
- `GET /api/rooms` - List all active rooms
- `GET /api/rooms/[roomId]` - Get room state
- `POST /api/rooms/[roomId]/join` - Join a room
- `POST /api/rooms/[roomId]/start` - Start the game
- `POST /api/rooms/[roomId]/play` - Play cards or pass

## 🔧 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Deployment**: Vercel
- **State Management**: In-memory (Map-based)
- **Real-time Updates**: Polling (1.5s interval)

## ⚠️ Important Notes

### In-Memory State Limitations

- Game state is stored in-memory on Vercel Serverless Functions
- Rooms will be lost after ~5-15 minutes of inactivity (cold start)
- Perfect for quick gaming sessions
- For persistent state, consider integrating Vercel KV (Redis)

### Real-time Strategy

- Uses polling instead of WebSocket (Vercel limitation)
- Client polls every 1.5 seconds for game state updates
- Reliable and simple for this use case
- For true WebSocket, consider using Pusher or Ably

## 🎮 How to Play

1. **Enter your name** on the home page
2. **Create a new game** or join an existing room
3. **Wait for 4 players** to join
4. **Click "Start Game"** when ready
5. **Play your cards** when it's your turn
6. **Pass** if you can't or don't want to play
7. **Win** by emptying your hand first!

## 📝 License

MIT License - feel free to use this project for learning or fun!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 🎉 Enjoy Playing!

Have fun playing Slave with your friends online! 🎴✨
