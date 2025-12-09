import { GameRoom, Player, Card } from './types';
import { createDeck, distributeCards, getStartingPlayer } from './gameLogic';
import { db } from './firebaseConfig';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';

const ROOMS_COLLECTION = 'rooms';
const ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes

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
 * Clean up inactive rooms (called on-demand)
 */
async function cleanupInactiveRooms() {
    try {
        const roomsRef = collection(db, ROOMS_COLLECTION);
        const snapshot = await getDocs(roomsRef);
        const now = Date.now();

        const deletePromises = snapshot.docs
            .filter(doc => {
                const room = doc.data() as GameRoom;
                return now - room.lastActivity > ROOM_TIMEOUT;
            })
            .map(doc => deleteDoc(doc.ref));

        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error cleaning up rooms:', error);
    }
}

/**
 * Create a new game room
 */
export async function createRoom(playerName: string): Promise<{ roomId: string; playerId: string }> {
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
        passedPlayers: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
        roundNumber: 1,
        turnStartTime: Date.now(),
        turnTimeLimit: 30000, // 30 seconds
    };

    await setDoc(doc(db, ROOMS_COLLECTION, roomId), room);
    return { roomId, playerId };
}

/**
 * Get a room by ID
 */
export async function getRoom(roomId: string): Promise<GameRoom | null> {
    try {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            return null;
        }

        const room = roomSnap.data() as GameRoom;

        // Check for auto-pass if turn timer expired (only during playing phase)
        if (room.phase === 'playing') {
            const now = Date.now();
            const turnDuration = now - room.turnStartTime;

            if (turnDuration >= room.turnTimeLimit) {
                // Auto-pass the current player's turn
                const currentPlayer = room.players[room.currentTurn];
                if (currentPlayer && currentPlayer.isActive) {
                    console.log(`Auto-passing turn for player ${currentPlayer.name} (timeout)`);
                    await passTurn(roomId, currentPlayer.id);
                    // Re-fetch the room after auto-pass
                    const updatedSnap = await getDoc(roomRef);
                    return updatedSnap.exists() ? (updatedSnap.data() as GameRoom) : null;
                }
            }
        }

        // Update last activity
        await updateDoc(roomRef, {
            lastActivity: Date.now(),
        });

        return room;
    } catch (error) {
        console.error('Error getting room:', error);
        return null;
    }
}

/**
 * Get all active rooms
 */
export async function getAllRooms(): Promise<GameRoom[]> {
    try {
        // Clean up inactive rooms first
        await cleanupInactiveRooms();

        const roomsRef = collection(db, ROOMS_COLLECTION);
        const snapshot = await getDocs(roomsRef);

        return snapshot.docs.map(doc => doc.data() as GameRoom);
    } catch (error) {
        console.error('Error getting all rooms:', error);
        return [];
    }
}

/**
 * Add a player to a room
 */
export async function joinRoom(
    roomId: string,
    playerName: string
): Promise<{ success: boolean; playerId?: string; error?: string }> {
    try {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            return { success: false, error: 'Room not found' };
        }

        const room = roomSnap.data() as GameRoom;

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

        await updateDoc(roomRef, {
            players: room.players,
            lastActivity: room.lastActivity,
        });

        return { success: true, playerId };
    } catch (error) {
        console.error('Error joining room:', error);
        return { success: false, error: 'Failed to join room' };
    }
}

/**
 * Remove a player from a room
 */
export async function leaveRoom(roomId: string, playerId: string): Promise<boolean> {
    try {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            return false;
        }

        const room = roomSnap.data() as GameRoom;
        room.players = room.players.filter(p => p.id !== playerId);

        // Delete room if empty
        if (room.players.length === 0) {
            await deleteDoc(roomRef);
        } else {
            await updateDoc(roomRef, {
                players: room.players,
                lastActivity: Date.now(),
            });
        }

        return true;
    } catch (error) {
        console.error('Error leaving room:', error);
        return false;
    }
}

/**
 * Start the game (distribute cards)
 */
export async function startGame(roomId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            return { success: false, error: 'Room not found' };
        }

        const room = roomSnap.data() as GameRoom;

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
        room.turnStartTime = Date.now();
        room.lastActivity = Date.now();

        await updateDoc(roomRef, {
            players: room.players,
            currentTurn: room.currentTurn,
            phase: room.phase,
            turnStartTime: room.turnStartTime,
            lastActivity: room.lastActivity,
        });

        return { success: true };
    } catch (error) {
        console.error('Error starting game:', error);
        return { success: false, error: 'Failed to start game' };
    }
}

/**
 * Play cards from a player's hand
 */
export async function playCards(
    roomId: string,
    playerId: string,
    cards: Card[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            return { success: false, error: 'Room not found' };
        }

        const room = roomSnap.data() as GameRoom;

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
        room.passedPlayers = []; // Reset passed players

        // Check if player finished all cards
        if (player.hand.length === 0) {
            player.isActive = false;
        }

        // Move to next active player
        moveToNextPlayer(room);
        room.turnStartTime = Date.now(); // Reset turn timer for next player
        room.lastActivity = Date.now();

        await updateDoc(roomRef, {
            players: room.players,
            playArea: room.playArea,
            lastPlay: room.lastPlay,
            currentRoundWinner: room.currentRoundWinner,
            passedPlayers: room.passedPlayers,
            currentTurn: room.currentTurn,
            phase: room.phase,
            turnStartTime: room.turnStartTime,
            lastActivity: room.lastActivity,
        });

        return { success: true };
    } catch (error) {
        console.error('Error playing cards:', error);
        return { success: false, error: 'Failed to play cards' };
    }
}

/**
 * Pass turn (player cannot or chooses not to play)
 */
export async function passTurn(
    roomId: string,
    playerId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            return { success: false, error: 'Room not found' };
        }

        const room = roomSnap.data() as GameRoom;

        const currentPlayer = room.players[room.currentTurn];
        if (currentPlayer.id !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        // Add to passed players array
        if (!room.passedPlayers.includes(playerId)) {
            room.passedPlayers.push(playerId);
        }

        // Check if all active players except winner have passed
        const activePlayers = room.players.filter(p => p.isActive);
        const passedCount = room.passedPlayers.filter(
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

        await updateDoc(roomRef, {
            passedPlayers: room.passedPlayers,
            currentTurn: room.currentTurn,
            phase: room.phase,
            playArea: room.playArea,
            lastPlay: room.lastPlay,
            roundNumber: room.roundNumber,
            turnStartTime: room.turnStartTime,
            lastActivity: room.lastActivity,
        });

        return { success: true };
    } catch (error) {
        console.error('Error passing turn:', error);
        return { success: false, error: 'Failed to pass turn' };
    }
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
    room.passedPlayers = [];

    // Winner of last round starts
    if (room.currentRoundWinner) {
        const winnerIndex = room.players.findIndex(p => p.id === room.currentRoundWinner);
        if (winnerIndex !== -1 && room.players[winnerIndex].isActive) {
            room.currentTurn = winnerIndex;
        }
    }

    room.roundNumber++;
}
