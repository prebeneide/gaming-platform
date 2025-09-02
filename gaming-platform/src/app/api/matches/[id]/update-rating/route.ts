import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { calculateRatingChange } from '@/lib/rating';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchId = params.id;
    const { winnerId, loserId, isDraw } = await request.json();

    // Validate match exists and is completed
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participants: {
          include: { user: true }
        },
        result: true
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status !== 'completed') {
      return NextResponse.json({ error: 'Match not completed' }, { status: 400 });
    }

    // Get or create ratings for both players
    const gameName = match.gameName;
    
    // Get winner rating
    let winnerRating = await prisma.userGameRating.findUnique({
      where: { userId_gameName: { userId: winnerId, gameName } }
    });
    
    if (!winnerRating) {
      winnerRating = await prisma.userGameRating.create({
        data: {
          userId: winnerId,
          gameName,
          rating: 1200,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          highestRating: 1200
        }
      });
    }

    // Get loser rating
    let loserRating = await prisma.userGameRating.findUnique({
      where: { userId_gameName: { userId: loserId, gameName } }
    });
    
    if (!loserRating) {
      loserRating = await prisma.userGameRating.create({
        data: {
          userId: loserId,
          gameName,
          rating: 1200,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          highestRating: 1200
        }
      });
    }

    // Calculate new ratings
    let ratingCalculation;
    if (isDraw) {
      // For draws, both players get small rating changes based on their relative ratings
      const ratingDiff = Math.abs(winnerRating.rating - loserRating.rating);
      const drawRatingChange = Math.max(1, Math.floor(ratingDiff / 100)); // Small change for draws
      
      ratingCalculation = {
        winnerNewRating: winnerRating.rating + drawRatingChange,
        loserNewRating: loserRating.rating - drawRatingChange,
        winnerRatingChange: drawRatingChange,
        loserRatingChange: -drawRatingChange
      };
    } else {
      // Normal win/loss calculation
      ratingCalculation = calculateRatingChange(
        winnerRating.rating,
        loserRating.rating,
        'competitive'
      );
    }

    // Update winner rating
    await prisma.userGameRating.update({
      where: { id: winnerRating.id },
      data: {
        rating: ratingCalculation.winnerNewRating,
        gamesPlayed: { increment: 1 },
        wins: isDraw ? { increment: 0 } : { increment: 1 },
        draws: isDraw ? { increment: 1 } : { increment: 0 },
        highestRating: Math.max(winnerRating.highestRating, ratingCalculation.winnerNewRating),
        lastGameAt: new Date()
      }
    });

    // Update loser rating
    await prisma.userGameRating.update({
      where: { id: loserRating.id },
      data: {
        rating: ratingCalculation.loserNewRating,
        gamesPlayed: { increment: 1 },
        losses: isDraw ? { increment: 0 } : { increment: 1 },
        draws: isDraw ? { increment: 1 } : { increment: 0 },
        lastGameAt: new Date()
      }
    });

    // Log rating changes
    await prisma.ratingChange.createMany({
      data: [
        {
          matchId,
          userId: winnerId,
          gameName,
          ratingBefore: winnerRating.rating,
          ratingAfter: ratingCalculation.winnerNewRating,
          ratingChange: ratingCalculation.winnerRatingChange,
          opponentRating: loserRating.rating,
          ratingDifference: winnerRating.rating - loserRating.rating
        },
        {
          matchId,
          userId: loserId,
          gameName,
          ratingBefore: loserRating.rating,
          ratingAfter: ratingCalculation.loserNewRating,
          ratingChange: ratingCalculation.loserRatingChange,
          opponentRating: winnerRating.rating,
          ratingDifference: loserRating.rating - winnerRating.rating
        }
      ]
    });

    return NextResponse.json({
      success: true,
      winner: {
        userId: winnerId,
        oldRating: winnerRating.rating,
        newRating: ratingCalculation.winnerNewRating,
        change: ratingCalculation.winnerRatingChange
      },
      loser: {
        userId: loserId,
        oldRating: loserRating.rating,
        newRating: ratingCalculation.loserNewRating,
        change: ratingCalculation.loserRatingChange
      }
    });

  } catch (error) {
    console.error('Error updating ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 