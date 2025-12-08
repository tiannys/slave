'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameRoom, Card } from '@/lib/types';
import { canPlayerPlay } from '@/lib/gameLogic';
import PlayerHand from './PlayerHand';
import PlayArea from './PlayArea';
import PlayerStatus from './PlayerStatus';
import { motion } from 'framer-motion';

interface GameBoardProps {
    roomId: string;
    playerId: string;
}

export default function GameBoard({ roomId, playerId }: GameBoardProps) {
    const [room, setRoom] = useState<GameRoom | null>(null);
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(30);

    // Fetch room state
    const fetchRoomState = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${roomId}`);
            if (!res.ok) return;

            const data = await res.json();
            setRoom(data.room);
        } catch (err) {
            console.error('Failed to fetch room state:', err);
        }
    }, [roomId]);

    // Poll for updates every 1.5 seconds
    useEffect(() => {
        fetchRoomState();
        const interval = setInterval(fetchRoomState, 1500);
        return () => clearInterval(interval);
    }, [fetchRoomState]);

    // Update timer countdown every second
    useEffect(() => {
        if (!room || room.phase !== 'playing') return;

        const updateTimer = () => {
            const now = Date.now();
            const elapsed = now - room.turnStartTime;
            const remaining = Math.max(0, Math.ceil((room.turnTimeLimit - elapsed) / 1000));
            setTimeRemaining(remaining);
        };

        updateTimer(); // Initial update
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [room]);

    // Start game
    async function handleStartGame() {
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/rooms/${roomId}/start`, {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to start game');
            } else {
                await fetchRoomState();
            }
        } catch (err) {
            setError('Failed to start game');
        } finally {
            setLoading(false);
        }
    }

    // Toggle card selection
    function handleCardClick(cardId: string) {
        setSelectedCards((prev) => {
            if (prev.includes(cardId)) {
                return prev.filter((id) => id !== cardId);
            }
            return [...prev, cardId];
        });
    }

    // Play selected cards
    async function handlePlayCards() {
        if (selectedCards.length === 0) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/rooms/${roomId}/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId,
                    cardIds: selectedCards,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Invalid play');
            } else {
                setSelectedCards([]);
                await fetchRoomState();
            }
        } catch (err) {
            setError('Failed to play cards');
        } finally {
            setLoading(false);
        }
    }

    // Pass turn
    async function handlePass() {
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/rooms/${roomId}/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId,
                    action: 'pass',
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to pass');
            } else {
                await fetchRoomState();
            }
        } catch (err) {
            setError('Failed to pass turn');
        } finally {
            setLoading(false);
        }
    }

    if (!room) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass-intense rounded-2xl p-8">
                    <p className="text-xl text-purple-200">Loading game...</p>
                </div>
            </div>
        );
    }

    const myPlayer = room.players.find((p) => p.id === playerId);
    const isMyTurn = room.players[room.currentTurn]?.id === playerId;
    const canPlay = myPlayer
        ? canPlayerPlay(myPlayer.hand, room.lastPlay, room.playArea.length === 0)
        : false;

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">
                        SLAVE
                    </h1>
                    <p className="text-purple-300">
                        Room: <span className="font-mono font-bold">{roomId}</span> •
                        Round {room.roundNumber}
                    </p>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass bg-red-500/20 border-red-500 rounded-xl p-4 mb-6 text-center"
                    >
                        <p className="text-red-300">{error}</p>
                    </motion.div>
                )}

                {/* Waiting Phase */}
                {room.phase === 'waiting' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-intense rounded-2xl p-8 mb-8 text-center"
                    >
                        <h2 className="text-2xl font-bold mb-4 text-purple-200">
                            Waiting for Players...
                        </h2>
                        <p className="text-purple-300 mb-6">
                            {room.players.length}/4 players joined
                        </p>

                        {room.players.length === 4 ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStartGame}
                                disabled={loading}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold hover:from-purple-500 hover:to-pink-500 transition-all glow disabled:opacity-50"
                            >
                                {loading ? 'Starting...' : '🎮 Start Game'}
                            </motion.button>
                        ) : (
                            <p className="text-purple-300/70">
                                Share this room code with your friends!
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Playing Phase */}
                {room.phase === 'playing' && (
                    <>
                        {/* Player Status */}
                        <PlayerStatus
                            players={room.players}
                            currentTurn={room.currentTurn}
                            myPlayerId={playerId}
                        />

                        {/* Turn Indicator */}
                        {isMyTurn && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="my-6 text-center"
                            >
                                <p className="text-2xl font-bold text-purple-300 animate-pulse">
                                    🎯 Your Turn!
                                </p>
                                <div className={`mt-2 text-lg font-bold ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-purple-400'
                                    }`}>
                                    ⏱️ {timeRemaining}s
                                </div>
                            </motion.div>
                        )}

                        {/* Timer for other players */}
                        {!isMyTurn && room.phase === 'playing' && (
                            <div className="my-6 text-center">
                                <p className="text-lg text-purple-300">
                                    Waiting for {room.players[room.currentTurn]?.name}...
                                </p>
                                <div className={`mt-1 text-sm ${timeRemaining <= 10 ? 'text-red-400' : 'text-purple-400'
                                    }`}>
                                    ⏱️ {timeRemaining}s remaining
                                </div>
                            </div>
                        )}

                        {/* Play Area */}
                        <div className="my-8">
                            <PlayArea playArea={room.playArea} lastPlay={room.lastPlay} />
                        </div>

                        {/* Player Hand */}
                        {myPlayer && (
                            <PlayerHand
                                cards={myPlayer.hand}
                                selectedCards={selectedCards}
                                onCardClick={handleCardClick}
                                onPlay={handlePlayCards}
                                onPass={handlePass}
                                canPlay={canPlay}
                                isMyTurn={isMyTurn}
                            />
                        )}
                    </>
                )}

                {/* Finished Phase */}
                {room.phase === 'finished' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-intense rounded-2xl p-8 text-center"
                    >
                        <h2 className="text-3xl font-bold mb-6 text-gradient">
                            🏆 Game Over!
                        </h2>
                        <div className="space-y-4">
                            {room.players
                                .filter((p) => !p.isActive)
                                .map((player, index) => (
                                    <div
                                        key={player.id}
                                        className="glass rounded-xl p-4 flex items-center justify-between"
                                    >
                                        <span className="text-2xl">
                                            {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '💀'}
                                        </span>
                                        <span className="font-bold text-xl">{player.name}</span>
                                        <span className="text-purple-300 capitalize">
                                            {player.position || 'Unknown'}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
