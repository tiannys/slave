import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/gameState';

/**
 * POST /api/rooms/[roomId]/join - Join a game room
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const body = await request.json();
        const { playerName } = body;

        if (!playerName || typeof playerName !== 'string') {
            return NextResponse.json(
                { error: 'Player name is required' },
                { status: 400 }
            );
        }

        const result = await joinRoom(roomId, playerName.trim());

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            playerId: result.playerId,
            message: 'Joined room successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to join room' },
            { status: 500 }
        );
    }
}
