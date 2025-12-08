import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/gameState';

/**
 * GET /api/rooms/[roomId] - Get room state
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const room = getRoom(roomId);

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // Return room state (hands are visible only to respective players on client)
        return NextResponse.json({ room });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch room' },
            { status: 500 }
        );
    }
}
