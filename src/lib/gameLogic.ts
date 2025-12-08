import { Card, Suit, Rank, PlayedCards } from './types';

// Card value mapping
const RANK_VALUES: Record<Rank, number> = {
    '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15
};

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

/**
 * Create a standard 52-card deck
 */
export function createDeck(): Card[] {
    const deck: Card[] = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                suit,
                rank,
                value: RANK_VALUES[rank],
                id: `${suit}-${rank}`
            });
        }
    }

    return deck;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Distribute cards evenly to 4 players
 */
export function distributeCards(deck: Card[]): Card[][] {
    const shuffled = shuffleArray(deck);
    const hands: Card[][] = [[], [], [], []];

    shuffled.forEach((card, index) => {
        hands[index % 4].push(card);
    });

    // Sort each hand by card value
    hands.forEach(hand => {
        hand.sort((a, b) => a.value - b.value);
    });

    return hands;
}

/**
 * Validate if a card play is legal
 */
export function validatePlay(
    cards: Card[],
    lastPlay: PlayedCards | null,
    isFirstPlay: boolean
): { valid: boolean; reason?: string } {
    // Must play at least one card
    if (cards.length === 0) {
        return { valid: false, reason: 'Must play at least one card' };
    }

    // All cards must have the same rank
    const firstRank = cards[0].rank;
    if (!cards.every(card => card.rank === firstRank)) {
        return { valid: false, reason: 'All cards must have the same rank' };
    }

    // If this is the first play of the round, it's valid
    if (isFirstPlay || !lastPlay) {
        return { valid: true };
    }

    // Must play the same number of cards as last play
    if (cards.length !== lastPlay.cards.length) {
        return {
            valid: false,
            reason: `Must play ${lastPlay.cards.length} card(s)`
        };
    }

    // Cards must be higher value than last play
    const currentValue = cards[0].value;
    const lastValue = lastPlay.cards[0].value;

    if (currentValue <= lastValue) {
        return {
            valid: false,
            reason: 'Cards must be higher than previous play'
        };
    }

    return { valid: true };
}

/**
 * Check if a player can make any valid play
 */
export function canPlayerPlay(
    hand: Card[],
    lastPlay: PlayedCards | null,
    isFirstPlay: boolean
): boolean {
    if (isFirstPlay || !lastPlay) {
        return hand.length > 0;
    }

    const requiredCount = lastPlay.cards.length;
    const lastValue = lastPlay.cards[0].value;

    // Group cards by rank
    const rankGroups = new Map<Rank, Card[]>();
    hand.forEach(card => {
        if (!rankGroups.has(card.rank)) {
            rankGroups.set(card.rank, []);
        }
        rankGroups.get(card.rank)!.push(card);
    });

    // Check if any group can beat the last play
    for (const [rank, cards] of rankGroups) {
        if (cards.length >= requiredCount && cards[0].value > lastValue) {
            return true;
        }
    }

    return false;
}

/**
 * Get the player who should start (has 3 of clubs or lowest card)
 */
export function getStartingPlayer(players: { hand: Card[] }[]): number {
    // Find player with 3 of clubs
    for (let i = 0; i < players.length; i++) {
        if (players[i].hand.some(card => card.rank === '3' && card.suit === '♣')) {
            return i;
        }
    }

    // Fallback: find player with lowest card
    let lowestValue = Infinity;
    let startingPlayer = 0;

    players.forEach((player, index) => {
        if (player.hand.length > 0 && player.hand[0].value < lowestValue) {
            lowestValue = player.hand[0].value;
            startingPlayer = index;
        }
    });

    return startingPlayer;
}

/**
 * Determine rankings at end of round
 */
export function calculateRankings(
    finishOrder: string[]
): Map<string, 'president' | 'vice-president' | 'vice-scum' | 'scum'> {
    const rankings = new Map();

    if (finishOrder.length >= 1) rankings.set(finishOrder[0], 'president');
    if (finishOrder.length >= 2) rankings.set(finishOrder[1], 'vice-president');
    if (finishOrder.length >= 3) rankings.set(finishOrder[2], 'vice-scum');
    if (finishOrder.length >= 4) rankings.set(finishOrder[3], 'scum');

    return rankings;
}
