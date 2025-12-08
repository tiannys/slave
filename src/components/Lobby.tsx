'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Room {
    id: string;
    playerCount: number;
    phase: string;
    players: { name: string }[];
}

export default function Lobby() {
    const router = useRouter();
    const [playerName, setPlayerName] = useState('');
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 3000);
        return () => clearInterval(interval);
    }, []);

    async function fetchRooms() {
        try {
            const res = await fetch('/api/rooms');
            const data = await res.json();
            setRooms(data.rooms || []);
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
        }
    }

    async function createRoom() {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: playerName.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create room');
                setLoading(false);
                return;
            }

            // Store player info in localStorage
            localStorage.setItem('playerId', data.playerId);
            localStorage.setItem('playerName', playerName.trim());

            // Navigate to game room
            router.push(`/game/${data.roomId}`);
        } catch (err) {
            setError('Failed to create room');
            setLoading(false);
        }
    }

    async function joinRoom(roomId: string) {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/rooms/${roomId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: playerName.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to join room');
                setLoading(false);
                return;
            }

            localStorage.setItem('playerId', data.playerId);
            localStorage.setItem('playerName', playerName.trim());

            router.push(`/game/${roomId}`);
        } catch (err) {
            setError('Failed to join room');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold mb-4 text-gradient animate-gradient">
                        SLAVE
                    </h1>
                    <p className="text-xl text-purple-300">
                        Multiplayer Card Game • Real-time Action
                    </p>
                </div>

                {/* Name Input */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-intense rounded-2xl p-8 mb-8"
                >
                    <label className="block text-lg mb-3 text-purple-200">
                        Enter Your Name
                    </label>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                        placeholder="Your name..."
                        className="w-full px-6 py-4 rounded-xl glass text-white placeholder-purple-300/50 text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                        maxLength={20}
                    />
                    {error && (
                        <p className="mt-3 text-red-400 text-sm">{error}</p>
                    )}
                </motion.div>

                {/* Create Room Button */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={createRoom}
                    disabled={loading}
                    className="w-full py-5 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold mb-8 hover:from-purple-500 hover:to-pink-500 transition-all glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating...' : '🎮 Create New Game'}
                </motion.button>

                {/* Available Rooms */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-intense rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span className="text-purple-400">🎲</span>
                        Available Rooms
                    </h2>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {rooms.length === 0 ? (
                            <p className="text-purple-300/70 text-center py-8">
                                No active rooms. Create one to start playing!
                            </p>
                        ) : (
                            rooms
                                .filter(room => room.phase === 'waiting' && room.playerCount < 4)
                                .map((room) => (
                                    <motion.div
                                        key={room.id}
                                        whileHover={{ scale: 1.02 }}
                                        className="glass rounded-xl p-5 flex items-center justify-between cursor-pointer hover:bg-white/20 transition-all"
                                        onClick={() => joinRoom(room.id)}
                                    >
                                        <div>
                                            <p className="font-bold text-lg">Room {room.id}</p>
                                            <p className="text-sm text-purple-300">
                                                {room.players.map(p => p.name).join(', ')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-purple-400">
                                                {room.playerCount}/4
                                            </p>
                                            <p className="text-xs text-purple-300">Players</p>
                                        </div>
                                    </motion.div>
                                ))
                        )}
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-8 text-purple-300/60 text-sm"
                >
                    4 players required to start • Click join to enter a room
                </motion.p>
            </motion.div>
        </div>
    );
}
