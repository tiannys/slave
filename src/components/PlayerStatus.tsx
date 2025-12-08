'use client';

import { Player } from '@/lib/types';
import { motion } from 'framer-motion';

interface PlayerStatusProps {
    players: Player[];
    currentTurn: number;
    myPlayerId?: string;
}

export default function PlayerStatus({ players, currentTurn, myPlayerId }: PlayerStatusProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {players.map((player, index) => {
                const isCurrentTurn = index === currentTurn;
                const isMe = player.id === myPlayerId;

                return (
                    <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`glass rounded-xl p-4 ${isCurrentTurn ? 'ring-4 ring-purple-400 pulse-glow' : ''
                            } ${isMe ? 'bg-purple-500/20' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${player.isActive ? 'bg-green-400' : 'bg-gray-400'
                                    }`} />
                                <p className={`font-bold ${isMe ? 'text-purple-300' : 'text-white'}`}>
                                    {player.name} {isMe && '(You)'}
                                </p>
                            </div>
                            {isCurrentTurn && (
                                <span className="text-xs bg-purple-600 px-2 py-1 rounded-full animate-pulse">
                                    Turn
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-purple-400">
                                {player.cardsRemaining}
                            </p>
                            <p className="text-xs text-purple-300">cards</p>
                        </div>
                        {player.position && (
                            <p className="text-xs text-purple-300 mt-2 capitalize">
                                {player.position.replace('-', ' ')}
                            </p>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
