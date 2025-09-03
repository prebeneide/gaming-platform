import { prisma } from "./prisma";
import { getRatingTier } from "./rating"; // Import the new rating system

export interface UserStatsData {
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winPercent: number;
  winLossRatio: number;
  rating: number;
  ratingTier: string;
  last10Results: string[];
  gameRatings?: any[]; // Add gameRatings to the interface
}

// Remove the old getRatingTier function - use the one from rating.ts

// Calculate user statistics from completed matches
export async function calculateUserStatsFromMatches(userId: string): Promise<UserStatsData> {
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
          resultType: true
        }
      }
    },
    orderBy: {
      result: {
        completedAt: 'desc'
      }
    }
  });

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
  
  // Get the user's best game rating to display as overall rating
  let bestRating = 1200; // Default rating
  let bestRatingTier = 'Unranked';
  let gameRatings: any[] = [];
  
  try {
    gameRatings = await prisma.userGameRating.findMany({
      where: { userId },
      orderBy: { rating: 'desc' }
    });
    
    if (gameRatings.length > 0) {
      bestRating = gameRatings[0].rating;
      bestRatingTier = getRatingTier(bestRating); // Use the new rating system
    }
  } catch (error) {
    console.error('Error fetching game ratings for stats:', error);
  }
  
  // Get last 10 results (most recent first, but we want oldest first for display)
  const last10 = last10Results.slice(-10).reverse();

  return {
    matchesPlayed,
    wins,
    losses,
    draws,
    winPercent,
    winLossRatio,
    rating: bestRating,
    ratingTier: bestRatingTier,
    last10Results: last10,
    gameRatings // Include gameRatings in the response
  };
}

// Update user statistics in database
export async function updateUserStats(userId: string): Promise<void> {
  const stats = await calculateUserStatsFromMatches(userId);
  
  await prisma.userStats.upsert({
    where: { userId },
    update: {
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winPercent: stats.winPercent,
      winLossRatio: stats.winLossRatio,
      rating: stats.rating,
      ratingTier: stats.ratingTier,
      last10Results: stats.last10Results,
      updatedAt: new Date()
    },
    create: {
      userId,
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winPercent: stats.winPercent,
      winLossRatio: stats.winLossRatio,
      rating: stats.rating,
      ratingTier: stats.ratingTier,
      last10Results: stats.last10Results
    }
  });
  
  // Also sync with game ratings to ensure consistency
  try {
  } catch (syncError) {
    console.error('Error syncing stats after update:', syncError);
  }
}

// Update statistics for all participants in a match
export async function updateStatsForMatchParticipants(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: {
        select: {
          userId: true
        }
      },
      result: {
        select: {
          winnerId: true,
          resultType: true
        }
      }
    }
  });

  if (!match || !match.result) return;

  // Update stats for all participants
  const updatePromises = match.participants.map(participant => 
    updateUserStats(participant.userId)
  );

  await Promise.all(updatePromises);
  
  // Also ensure game ratings are updated for this match
  if (match.result.resultType === 'win' && match.result.winnerId) {
    const winnerId = match.result.winnerId;
    const losers = match.participants
      .filter(p => p.userId !== winnerId)
      .map(p => p.userId);

    // Update ratings for each winner-loser combination
    for (const loserId of losers) {
      try {
        // Check if ratings already exist for this match
        const existingRatingChange = await prisma.ratingChange.findFirst({
          where: {
            matchId: match.id,
            userId: winnerId
          }
        });

        if (!existingRatingChange) {
          // Import and call the rating update function directly
          const { calculateRatingChange } = await import('./rating');
          
          // Get match game name
          const matchWithGame = await prisma.match.findUnique({
            where: { id: matchId },
            select: { gameName: true }
          });
          
          if (matchWithGame) {
            // Get or create ratings for both players
            let winnerRating = await prisma.userGameRating.findUnique({
              where: { userId_gameName: { userId: winnerId, gameName: matchWithGame.gameName } }
            });
            
            if (!winnerRating) {
              winnerRating = await prisma.userGameRating.create({
                data: {
                  userId: winnerId,
                  gameName: matchWithGame.gameName,
                  rating: 1200,
                  gamesPlayed: 0,
                  wins: 0,
                  losses: 0,
                  draws: 0,
                  highestRating: 1200
                }
              });
            }

            let loserRating = await prisma.userGameRating.findUnique({
              where: { userId_gameName: { userId: loserId, gameName: matchWithGame.gameName } }
            });
            
            if (!loserRating) {
              loserRating = await prisma.userGameRating.create({
                data: {
                  userId: loserId,
                  gameName: matchWithGame.gameName,
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
            const ratingCalculation = calculateRatingChange(
              winnerRating.rating,
              loserRating.rating,
              'competitive'
            );

            // Update winner rating
            await prisma.userGameRating.update({
              where: { id: winnerRating.id },
              data: {
                rating: ratingCalculation.winnerNewRating,
                gamesPlayed: { increment: 1 },
                wins: { increment: 1 },
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
                losses: { increment: 1 },
                lastGameAt: new Date()
              }
            });

            // Log rating changes
            await prisma.ratingChange.createMany({
              data: [
                {
                  matchId,
                  userId: winnerId,
                  gameName: matchWithGame.gameName,
                  ratingBefore: winnerRating.rating,
                  ratingAfter: ratingCalculation.winnerNewRating,
                  ratingChange: ratingCalculation.winnerRatingChange,
                  opponentRating: loserRating.rating,
                  ratingDifference: winnerRating.rating - loserRating.rating
                },
                {
                  matchId,
                  userId: loserId,
                  gameName: matchWithGame.gameName,
                  ratingBefore: loserRating.rating,
                  ratingAfter: ratingCalculation.loserNewRating,
                  ratingChange: ratingCalculation.loserRatingChange,
                  opponentRating: winnerRating.rating,
                  ratingDifference: loserRating.rating - winnerRating.rating
                }
              ]
            });
          }
        }
      } catch (ratingError) {
        console.error(`Error updating rating for match ${matchId}:`, ratingError);
      }
    }
  } else if (match.result.resultType === 'draw') {
    // Handle draws - update ratings for all participant pairs
    const participants = match.participants.map(p => p.userId);
    
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        try {
          const player1 = participants[i];
          const player2 = participants[j];
          
          // Check if ratings already exist for this match
          const existingRatingChange = await prisma.ratingChange.findFirst({
            where: {
              matchId: match.id,
              userId: player1
            }
          });

          if (!existingRatingChange) {
            // Get match game name
            const matchWithGame = await prisma.match.findUnique({
              where: { id: matchId },
              select: { gameName: true }
            });
            
            if (matchWithGame) {
              // Get or create ratings for both players
              let player1Rating = await prisma.userGameRating.findUnique({
                where: { userId_gameName: { userId: player1, gameName: matchWithGame.gameName } }
              });
              
              if (!player1Rating) {
                player1Rating = await prisma.userGameRating.create({
                  data: {
                    userId: player1,
                    gameName: matchWithGame.gameName,
                    rating: 1200,
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    highestRating: 1200
                  }
                });
              }

              let player2Rating = await prisma.userGameRating.findUnique({
                where: { userId_gameName: { userId: player2, gameName: matchWithGame.gameName } }
              });
              
              if (!player2Rating) {
                player2Rating = await prisma.userGameRating.create({
                  data: {
                    userId: player2,
                    gameName: matchWithGame.gameName,
                    rating: 1200,
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    highestRating: 1200
                  }
                });
              }

              // For draws, both players get small rating changes
              const ratingDiff = Math.abs(player1Rating.rating - player2Rating.rating);
              const drawRatingChange = Math.max(1, Math.floor(ratingDiff / 100));
              
              // Update player1 rating
              await prisma.userGameRating.update({
                where: { id: player1Rating.id },
                data: {
                  gamesPlayed: { increment: 1 },
                  draws: { increment: 1 },
                  lastGameAt: new Date()
                }
              });

              // Update player2 rating
              await prisma.userGameRating.update({
                where: { id: player2Rating.id },
                data: {
                  gamesPlayed: { increment: 1 },
                  draws: { increment: 1 },
                  lastGameAt: new Date()
                }
              });

              // Log rating changes for draws
              await prisma.ratingChange.createMany({
                data: [
                  {
                    matchId,
                    userId: player1,
                    gameName: matchWithGame.gameName,
                    ratingBefore: player1Rating.rating,
                    ratingAfter: player1Rating.rating,
                    ratingChange: 0,
                    opponentRating: player2Rating.rating,
                    ratingDifference: player1Rating.rating - player2Rating.rating
                  },
                  {
                    matchId,
                    userId: player2,
                    gameName: matchWithGame.gameName,
                    ratingBefore: player2Rating.rating,
                    ratingAfter: player2Rating.rating,
                    ratingChange: 0,
                    opponentRating: player1Rating.rating,
                    ratingDifference: player2Rating.rating - player1Rating.rating
                  }
                ]
              });
            }
          }
        } catch (ratingError) {
          console.error(`Error updating draw rating for match ${matchId}:`, ratingError);
        }
      }
    }
  }
}

// Update ratings for existing matches
export async function updateRatingsForExistingMatches(userId: string): Promise<void> {
  try {
    // Get all completed matches for this user
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
        status: 'completed',
        result: {
          status: 'agreed'
        }
      },
      include: {
        result: {
          select: {
            winnerId: true,
            resultType: true
          }
        },
        participants: {
          select: {
            userId: true
          }
        }
      }
    });

    for (const match of matches) {
      if (match.result && match.result.resultType === 'win' && match.result.winnerId) {
        const winnerId = match.result.winnerId;
        const losers = match.participants
          .filter(p => p.userId !== winnerId)
          .map(p => p.userId);

        // Update ratings for each winner-loser combination
        for (const loserId of losers) {
          try {
            // Check if ratings already exist for this match
            const existingRatingChange = await prisma.ratingChange.findFirst({
              where: {
                matchId: match.id,
                userId: winnerId
              }
            });

            if (!existingRatingChange) {
              // Call the rating update API
              await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/matches/${match.id}/update-rating`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  winnerId,
                  loserId
                })
              });
            }
          } catch (ratingError) {
            console.error(`Error updating rating for match ${match.id}:`, ratingError);
          }
        }
      } else if (match.result && match.result.resultType === 'draw') {
        // Handle draws - update ratings for all participant pairs
        const participants = match.participants.map(p => p.userId);
        
        for (let i = 0; i < participants.length; i++) {
          for (let j = i + 1; j < participants.length; j++) {
            try {
              const player1 = participants[i];
              const player2 = participants[j];
              
              // Check if ratings already exist for this match
              const existingRatingChange = await prisma.ratingChange.findFirst({
                where: {
                  matchId: match.id,
                  userId: player1
                }
              });

              if (!existingRatingChange) {
                // Call the rating update API for draw
                await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/matches/${match.id}/update-rating`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    winnerId: player1,
                    loserId: player2,
                    isDraw: true
                  })
                });
              }
            } catch (ratingError) {
              console.error(`Error updating draw rating for match ${match.id}:`, ratingError);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating ratings for existing matches:', error);
  }
}

// Sync existing UserStats with UserGameRating data

// Get user statistics (from cache or calculate if not exists)
export async function getUserStats(userId: string): Promise<UserStatsData> {
  const cachedStats = await prisma.userStats.findUnique({
    where: { userId }
  });

  if (cachedStats) {
    console.log(`Cached stats for user ${userId}:`, {
      matchesPlayed: cachedStats.matchesPlayed,
      wins: cachedStats.wins,
      losses: cachedStats.losses,
      draws: cachedStats.draws,
      last10Results: cachedStats.last10Results
    });
    
    // Always sync with game ratings to ensure consistency
    try {
      // Get game ratings
      const gameRatings = await prisma.userGameRating.findMany({
        where: { userId },
        orderBy: { rating: 'desc' }
      });
      
      return {
        matchesPlayed: cachedStats.matchesPlayed,
        wins: cachedStats.wins,
        losses: cachedStats.losses,
        draws: cachedStats.draws,
        winPercent: cachedStats.winPercent,
        winLossRatio: cachedStats.winLossRatio,
        rating: cachedStats.rating,
        ratingTier: cachedStats.ratingTier,
        last10Results: cachedStats.last10Results,
        gameRatings // Include gameRatings
      };
    } catch (syncError) {
      console.error('Error syncing stats:', syncError);
    }
  }

  // If no cached stats, calculate and cache them
  await updateUserStats(userId);
  
  // Also update ratings for existing matches if this is the first time
  try {
    await updateRatingsForExistingMatches(userId);
  } catch (ratingError) {
    console.error('Error updating ratings for existing matches:', ratingError);
  }
  
  // Sync with game ratings
  try {
    // Get game ratings
    const gameRatings = await prisma.userGameRating.findMany({
      where: { userId },
      orderBy: { rating: 'desc' }
    });
    
    return {
      matchesPlayed: cachedStats?.matchesPlayed || 0,
      wins: cachedStats?.wins || 0,
      losses: cachedStats?.losses || 0,
      draws: cachedStats?.draws || 0,
      winPercent: cachedStats?.winPercent || 0,
      winLossRatio: cachedStats?.winLossRatio || 0,
      rating: cachedStats?.rating || 1200,
      ratingTier: cachedStats?.ratingTier || 'Unranked',
      last10Results: cachedStats?.last10Results || [],
      gameRatings // Include gameRatings
    };
  } catch (syncError) {
    console.error('Error syncing stats:', syncError);
  }
  
  return getUserStats(userId); // Recursive call to get the newly cached stats
} 