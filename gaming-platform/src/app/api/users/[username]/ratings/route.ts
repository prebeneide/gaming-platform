import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        gameRatings: {
          orderBy: { rating: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform data for frontend
    const ratings = user.gameRatings.map(rating => ({
      gameName: rating.gameName,
      rating: rating.rating,
      gamesPlayed: rating.gamesPlayed,
      wins: rating.wins,
      losses: rating.losses,
      draws: rating.draws,
      highestRating: rating.highestRating,
      lastGameAt: rating.lastGameAt
    }));

    return NextResponse.json({
      username: user.username,
      displayName: user.displayName,
      ratings
    });

  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 