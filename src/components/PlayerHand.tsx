'use client';

import { Card } from '@/lib/types';
import { motion } from 'framer-motion';

interface PlayerHandProps {
    cards: Card[];
    selectedCards: string[];
    onCardClick: (cardId: string) => void;
    onPlay: () => void;
    onPass: () => void;
    canPlay: boolean;
    isMyTurn: boolean;
}

export default function PlayerHand({
    cards,
    selectedCards,
    onCardClick,
    onPlay,
    onPass,
    canPlay,
    isMyTurn,
}: PlayerHandProps) {
    const getCardColor = (suit: string) => {
        return suit === '♥' || suit === '♦' ? 'red' : 'black';
    };

    return (
        <div className="glass-intense rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-purple-200">
                    Your Hand ({cards.length} cards)
                </h3>
                {isMyTurn && (
                    <div className="flex gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onPass}
                            className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-semibold transition-all"
                        >
                            Pass
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onPlay}
                            disabled={selectedCards.length === 0 || !canPlay}
                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed glow"
                        >
                            Play ({selectedCards.length})
                        </motion.button>
                    </div>
                )}
            </div>

            {/* Cards */}
            <div className="flex flex-wrap gap-2 justify-center min-h-32">
                {cards.length === 0 ? (
                    <p className="text-purple-300/70 py-8">No cards remaining</p>
                ) : (
                    cards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: isMyTurn ? -10 : 0 }}
                            onClick={() => isMyTurn && onCardClick(card.id)}
                            className={`playing-card ${getCardColor(card.suit)} ${selectedCards.includes(card.id) ? 'selected' : ''
                                } ${isMyTurn ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-3xl">{card.suit}</span>
                                <span className="text-xl font-bold">{card.rank}</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
