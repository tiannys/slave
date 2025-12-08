'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GameBoard from '@/components/GameBoard';

export default function GameRoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params?.roomId as string;
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ensure component is mounted before accessing localStorage
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Get player ID from localStorage (client-side only)
        const storedPlayerId = localStorage.getItem('playerId');

        if (!storedPlayerId) {
            setError('No player ID found');
            setTimeout(() => router.push('/'), 2000);
            return;
        }

        setPlayerId(storedPlayerId);

        // Verify room still exists
        fetch(`/api/rooms/${roomId}`)
            .then(res => {
                if (!res.ok) {
                    setError('Room not found - server may have restarted');
                    localStorage.removeItem('playerId');
                    setTimeout(() => router.push('/'), 2000);
                } else {
                    setLoading(false);
                }
            })
            .catch(() => {
                setError('Failed to connect to room');
                setTimeout(() => router.push('/'), 2000);
            });
    }, [router, mounted, roomId]);

    // Show loading or error state
    if (!mounted || loading || error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass-intense rounded-2xl p-8 text-center">
                    {error ? (
                        <>
                            <p className="text-xl text-red-300 mb-4">⚠️ {error}</p>
                            <p className="text-sm text-purple-300">Redirecting to lobby in 2 seconds...</p>
                        </>
                    ) : (
                        <p className="text-xl text-purple-200">Loading...</p>
                    )}
                </div>
            </div>
        );
    }

    if (!playerId) {
        return null;
    }

    return <GameBoard roomId={roomId} playerId={playerId} />;
}
