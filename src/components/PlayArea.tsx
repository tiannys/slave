'use client';

import { PlayedCards } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayAreaProps {
    playArea: PlayedCards[];
    lastPlay: PlayedCards | null;
}

export default function PlayArea({ playArea, lastPlay }: PlayAreaProps) {
    const getCardColor = (suit: string) => {
        return suit === '♥' || suit === '♦' ? 'red' : 'black';
    };

    return (
        <div className="glass-intense rounded-2xl p-8 min-h-64">
            <h3 className="text-xl font-bold text-purple-200 mb-6 text-center">
                Play Area
            </h3>

            <div className="flex flex-col items-center justify-center space-y-4">
                <AnimatePresence mode="wait">
                    {lastPlay ? (
                        <motion.div
                            key={lastPlay.timestamp}
                            initial={{ scale: 0.8, opacity: 0, y: -20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="text-center"
                        >
                            <p className="text-sm text-purple-300 mb-3">
                                {lastPlay.playerName} played:
                            </p>
                            <div className="flex gap-2 justify-center">
                                {lastPlay.cards.map((card, index) => (
                                    <motion.div
                                        key={card.id}
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`playing-card ${getCardColor(card.suit)} scale-125`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl">{card.suit}</span>
                                            <span className="text-xl font-bold">{card.rank}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-purple-300/70 text-center py-12"
                        >
                            Waiting for first play...
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Play history indicator */}
            {playArea.length > 0 && (
                <div className="mt-6 text-center">
                    <p className="text-xs text-purple-300/50">
                        {playArea.length} play(s) this round
                    </p>
                </div>
            )}
        </div>
    );
}
