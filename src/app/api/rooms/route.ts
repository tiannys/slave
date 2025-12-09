import { NextRequest, NextResponse } from 'next/server';
import { createRoom, getAllRooms } from '@/lib/gameState';

/**
 * POST /api/rooms - Create a new game room
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { playerName } = body;

        if (!playerName || typeof playerName !== 'string') {
            return NextResponse.json(
                { error: 'Player name is required' },
                { status: 400 }
            );
        }

        const { roomId, playerId } = await createRoom(playerName.trim());

        return NextResponse.json({
            roomId,
            playerId,
            message: 'Room created successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/rooms - Get list of all active rooms
 */
export async function GET() {
    try {
        const rooms = await getAllRooms();

        // Return minimal room info (don't expose player hands)
        const roomList = rooms.map(room => ({
            id: room.id,
            playerCount: room.players.length,
            phase: room.phase,
            players: room.players.map(p => ({ name: p.name }))
        }));

        return NextResponse.json({ rooms: roomList });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch rooms' },
            { status: 500 }
        );
    }
}
