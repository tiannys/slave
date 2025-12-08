// Card suits and ranks
export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number; // 3=3, 4=4, ..., J=11, Q=12, K=13, A=14, 2=15
    id: string; // Unique identifier for React keys
}

export interface Player {
    id: string;
    name: string;
    hand: Card[];
    cardsRemaining: number;
    isActive: boolean;
    position?: 'president' | 'vice-president' | 'vice-scum' | 'scum'; // End-of-round ranking
}

export interface PlayedCards {
    playerId: string;
    playerName: string;
    cards: Card[];
    timestamp: number;
}

export type GamePhase = 'waiting' | 'playing' | 'round-end' | 'finished';

export interface GameRoom {
    id: string;
    players: Player[];
    currentTurn: number; // Index of player whose turn it is
    phase: GamePhase;
    playArea: PlayedCards[];
    lastPlay: PlayedCards | null;
    currentRoundWinner: string | null; // Player ID of current round winner
    passedPlayers: Set<string>; // Players who passed this round
    createdAt: number;
    lastActivity: number;
    roundNumber: number;
    turnStartTime: number; // Timestamp when current turn started
    turnTimeLimit: number; // Time limit per turn in milliseconds (30000 = 30 sec)
}

export interface CreateRoomRequest {
    playerName: string;
}

export interface JoinRoomRequest {
    playerName: string;
}

export interface PlayCardsRequest {
    playerId: string;
    cardIds: string[];
}

export interface GameState {
    room: GameRoom;
    myPlayerId?: string;
}
