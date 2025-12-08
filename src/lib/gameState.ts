import { GameRoom, Player, Card } from './types';
import { createDeck, distributeCards, getStartingPlayer } from './gameLogic';

// In-memory storage for game rooms
const gameRooms = new Map<string, GameRoom>();

// Auto-cleanup inactive rooms (older than 30 minutes)
const ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function cleanupInactiveRooms() {
    const now = Date.now();
    for (const [roomId, room] of gameRooms.entries()) {
        if (now - room.lastActivity > ROOM_TIMEOUT) {
            gameRooms.delete(roomId);
        }
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupInactiveRooms, 5 * 60 * 1000);

/**
 * Generate a random room ID
 */
function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Generate a random player ID
 */
function generatePlayerId(): string {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * Create a new game room
 */
export function createRoom(playerName: string): { roomId: string; playerId: string } {
    const roomId = generateRoomId();
    const playerId = generatePlayerId();

    const player: Player = {
        id: playerId,
        name: playerName,
        hand: [],
        cardsRemaining: 0,
        isActive: true,
    };

    const room: GameRoom = {
        id: roomId,
        players: [player],
        currentTurn: 0,
        phase: 'waiting',
        playArea: [],
        lastPlay: null,
        currentRoundWinner: null,
        passedPlayers: new Set(),
        createdAt: Date.now(),
        lastActivity: Date.now(),
        roundNumber: 1,
        turnStartTime: Date.now(),
        turnTimeLimit: 30000, // 30 seconds
    };

    gameRooms.set(roomId, room);
    return { roomId, playerId };
}

/**
 * Get a room by ID
 */
export function getRoom(roomId: string): GameRoom | null {
    const room = gameRooms.get(roomId);
    if (!room) return null;

    // Check for auto-pass if turn timer expired (only during playing phase)
    if (room.phase === 'playing') {
        const now = Date.now();
        const turnDuration = now - room.turnStartTime;

        if (turnDuration >= room.turnTimeLimit) {
            // Auto-pass the current player's turn
            const currentPlayer = room.players[room.currentTurn];
            if (currentPlayer && currentPlayer.isActive) {
                console.log(`Auto-passing turn for player ${currentPlayer.name} (timeout)`);
                passTurn(roomId, currentPlayer.id);
            }
        }
    }

    // Update last activity
    room.lastActivity = Date.now();
    return room;
}

/**
 * Get all active rooms
 */
export function getAllRooms(): GameRoom[] {
    cleanupInactiveRooms();
    return Array.from(gameRooms.values());
}

/**
 * Add a player to a room
 */
export function joinRoom(
    roomId: string,
    playerName: string
): { success: boolean; playerId?: string; error?: string } {
    const room = gameRooms.get(roomId);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    if (room.phase !== 'waiting') {
        return { success: false, error: 'Game already started' };
    }

    if (room.players.length >= 4) {
        return { success: false, error: 'Room is full' };
    }

    if (room.players.some(p => p.name === playerName)) {
        return { success: false, error: 'Name already taken' };
    }

    const playerId = generatePlayerId();
    const player: Player = {
        id: playerId,
        name: playerName,
        hand: [],
        cardsRemaining: 0,
        isActive: true,
    };

    room.players.push(player);
    room.lastActivity = Date.now();

    return { success: true, playerId };
}

/**
 * Remove a player from a room
 */
export function leaveRoom(roomId: string, playerId: string): boolean {
    const room = gameRooms.get(roomId);
    if (!room) return false;

    room.players = room.players.filter(p => p.id !== playerId);
    room.lastActivity = Date.now();

    // Delete room if empty
    if (room.players.length === 0) {
        gameRooms.delete(roomId);
    }

    return true;
}

/**
 * Start the game (distribute cards)
 */
export function startGame(roomId: string): { success: boolean; error?: string } {
    const room = gameRooms.get(roomId);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    if (room.players.length !== 4) {
        return { success: false, error: 'Need exactly 4 players to start' };
    }

    if (room.phase !== 'waiting') {
        return { success: false, error: 'Game already started' };
    }

    // Create and distribute cards
    const deck = createDeck();
    const hands = distributeCards(deck);

    room.players.forEach((player, index) => {
        player.hand = hands[index];
        player.cardsRemaining = hands[index].length;
    });

    // Determine starting player
    room.currentTurn = getStartingPlayer(room.players);
    room.phase = 'playing';
    room.turnStartTime = Date.now(); // Start turn timer
    room.lastActivity = Date.now();

    return { success: true };
}

/**
 * Play cards from a player's hand
 */
export function playCards(
    roomId: string,
    playerId: string,
    cards: Card[]
): { success: boolean; error?: string } {
    const room = gameRooms.get(roomId);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
        return { success: false, error: 'Player not found' };
    }

    const currentPlayer = room.players[room.currentTurn];
    if (currentPlayer.id !== playerId) {
        return { success: false, error: 'Not your turn' };
    }

    // Remove played cards from hand
    const cardIds = cards.map(c => c.id);
    player.hand = player.hand.filter(c => !cardIds.includes(c.id));
    player.cardsRemaining = player.hand.length;

    // Add to play area
    const play = {
        playerId: player.id,
        playerName: player.name,
        cards: cards,
        timestamp: Date.now(),
    };

    room.playArea.push(play);
    room.lastPlay = play;
    room.currentRoundWinner = playerId;
    room.passedPlayers.clear(); // Reset passed players

    // Check if player finished all cards
    if (player.hand.length === 0) {
        player.isActive = false;
    }

    // Move to next active player
    moveToNextPlayer(room);
    room.turnStartTime = Date.now(); // Reset turn timer for next player
    room.lastActivity = Date.now();

    return { success: true };
}

/**
 * Pass turn (player cannot or chooses not to play)
 */
export function passTurn(
    roomId: string,
    playerId: string
): { success: boolean; error?: string } {
    const room = gameRooms.get(roomId);

    if (!room) {
        return { success: false, error: 'Room not found' };
    }

    const currentPlayer = room.players[room.currentTurn];
    if (currentPlayer.id !== playerId) {
        return { success: false, error: 'Not your turn' };
    }

    room.passedPlayers.add(playerId);

    // Check if all active players except winner have passed
    const activePlayers = room.players.filter(p => p.isActive);
    const passedCount = Array.from(room.passedPlayers).filter(
        id => room.players.find(p => p.id === id)?.isActive
    ).length;

    if (passedCount === activePlayers.length - 1) {
        // New round - winner starts
        startNewRound(room);
    } else {
        // Move to next player
        moveToNextPlayer(room);
    }

    room.turnStartTime = Date.now(); // Reset turn timer
    room.lastActivity = Date.now();
    return { success: true };
}

/**
 * Move to next active player
 */
function moveToNextPlayer(room: GameRoom) {
    const activePlayers = room.players.filter(p => p.isActive);

    // Check if only one player left
    if (activePlayers.length === 1) {
        room.phase = 'finished';
        return;
    }

    // Find next active player
    let nextTurn = (room.currentTurn + 1) % room.players.length;
    while (!room.players[nextTurn].isActive) {
        nextTurn = (nextTurn + 1) % room.players.length;
    }

    room.currentTurn = nextTurn;
}

/**
 * Start a new round after all players pass
 */
function startNewRound(room: GameRoom) {
    room.playArea = [];
    room.lastPlay = null;
    room.passedPlayers.clear();

    // Winner of last round starts
    if (room.currentRoundWinner) {
        const winnerIndex = room.players.findIndex(p => p.id === room.currentRoundWinner);
        if (winnerIndex !== -1 && room.players[winnerIndex].isActive) {
            room.currentTurn = winnerIndex;
        }
    }

    room.roundNumber++;
}
