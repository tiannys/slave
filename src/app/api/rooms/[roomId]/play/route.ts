import { NextRequest, NextResponse } from 'next/server';
import { playCards, passTurn, getRoom } from '@/lib/gameState';
import { validatePlay } from '@/lib/gameLogic';

/**
 * POST /api/rooms/[roomId]/play - Play cards or pass turn
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const body = await request.json();
        const { playerId, cardIds, action } = body;

        if (!playerId) {
            return NextResponse.json(
                { error: 'Player ID is required' },
                { status: 400 }
            );
        }

        // Handle pass action
        if (action === 'pass') {
            const result = passTurn(roomId, playerId);

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                message: 'Turn passed'
            });
        }

        // Handle play cards action
        if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
            return NextResponse.json(
                { error: 'Card IDs are required' },
                { status: 400 }
            );
        }

        const room = getRoom(roomId);
        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        const player = room.players.find(p => p.id === playerId);
        if (!player) {
            return NextResponse.json(
                { error: 'Player not found' },
                { status: 404 }
            );
        }

        // Get selected cards from player's hand
        const selectedCards = player.hand.filter(card => cardIds.includes(card.id));

        if (selectedCards.length !== cardIds.length) {
            return NextResponse.json(
                { error: 'Invalid cards selected' },
                { status: 400 }
            );
        }

        // Validate play
        const isFirstPlay = room.playArea.length === 0;
        const validation = validatePlay(selectedCards, room.lastPlay, isFirstPlay);

        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.reason || 'Invalid play' },
                { status: 400 }
            );
        }

        // Execute play
        const result = playCards(roomId, playerId, selectedCards);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: 'Cards played successfully'
        });
    } catch (error) {
        console.error('Play error:', error);
        return NextResponse.json(
            { error: 'Failed to play cards' },
            { status: 500 }
        );
    }
}
