import { NextRequest, NextResponse } from 'next/server';
import { startGame } from '@/lib/gameState';

/**
 * POST /api/rooms/[roomId]/start - Start the game
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const result = await startGame(roomId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: 'Game started successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to start game' },
            { status: 500 }
        );
    }
}
