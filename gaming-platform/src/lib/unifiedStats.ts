import { prisma } from './prisma';
import { getRatingTier } from './rating';

export interface UnifiedUserStats {
  // Overall statistics (calculated from all matches)
  overall: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winPercent: number;
    winLossRatio: number;
    last10Results: string[];
    bestRating: number;
    bestRatingTier: string;
  };
  
  // Game-specific ratings (from UserGameRating table)
  gameRatings: Array<{
    id: string;
    gameName: string;
    rating: number;
    ratingTier: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    highestRating: number;
    lastGameAt: Date | null;
  }>;
}

/**
 * Calculate unified user statistics from Match table (single source of truth)
 * and combine with game-specific ratings
 */
export async function getUnifiedUserStats(userId: string): Promise<UnifiedUserStats> {
  // 1. Get all completed matches for this user
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { creatorId: userId },
        {
          participants: {
            some: {
              userId: userId
            }
          }
        }
      ],
      result: {
        status: 'agreed' // Only count agreed/completed results
      }
    },
    include: {
      result: {
        select: {
          winnerId: true,
          resultType: true,
          completedAt: true
        }
      }
    },
    orderBy: {
      result: {
        completedAt: 'desc'
      }
    }
  });

  // 2. Calculate overall statistics
  let matchesPlayed = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  const last10Results: string[] = [];

  matches.forEach(match => {
    if (match.result) {
      matchesPlayed++;
      
      if (match.result.resultType === 'win') {
        if (match.result.winnerId === userId) {
          wins++;
          last10Results.push('W');
        } else {
          losses++;
          last10Results.push('L');
        }
      } else if (match.result.resultType === 'draw') {
        draws++;
        last10Results.push('D');
      }
    }
  });

  // Calculate percentages and ratios
  const winPercent = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
  const winLossRatio = losses > 0 ? parseFloat((wins / losses).toFixed(2)) : wins > 0 ? wins : 0;
  
  // Get last 10 results (most recent first, but we want oldest first for display)
  const last10 = last10Results.slice(-10).reverse();

  // 3. Get game-specific ratings
  const gameRatings = await prisma.userGameRating.findMany({
    where: { userId },
    orderBy: { rating: 'desc' }
  });

  // 4. Calculate best overall rating
  let bestRating = 1200; // Default rating
  let bestRatingTier = 'Unranked';
  
  if (gameRatings.length > 0) {
    bestRating = gameRatings[0].rating;
    bestRatingTier = getRatingTier(bestRating);
  }

  // 5. Format game ratings with tier information
  const formattedGameRatings = gameRatings.map(rating => ({
    id: rating.id,
    gameName: rating.gameName,
    rating: rating.rating,
    ratingTier: getRatingTier(rating.rating),
    gamesPlayed: rating.gamesPlayed,
    wins: rating.wins,
    losses: rating.losses,
    draws: rating.draws,
    highestRating: rating.highestRating,
    lastGameAt: rating.lastGameAt
  }));

  return {
    overall: {
      matchesPlayed,
      wins,
      losses,
      draws,
      winPercent,
      winLossRatio,
      last10Results: last10,
      bestRating,
      bestRatingTier
    },
    gameRatings: formattedGameRatings
  };
}
