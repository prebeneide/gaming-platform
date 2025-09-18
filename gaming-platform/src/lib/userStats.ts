import { prisma } from "./prisma";

/**
 * Update statistics for all participants in a match
 * This function is called when a match result is reported
 * It updates the UserGameRating table with new ratings and statistics
 */
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

  // Update game ratings for this match
  if (match.result.resultType === 'win' && match.result.winnerId) {
    const winnerId = match.result.winnerId;
    const losers = match.participants
      .filter(p => p.userId !== winnerId)
      .map(p => p.userId);

    // Update ratings for each winner-loser combination
    for (const loserId of losers) {
      try {
        // Get match with game name
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
                id: `rating_${winnerId}_${matchWithGame.gameName}_${Date.now()}`,
                userId: winnerId,
                gameName: matchWithGame.gameName,
                rating: 1200,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                highestRating: 1200,
                updatedAt: new Date()
              }
            });
          }

          let loserRating = await prisma.userGameRating.findUnique({
            where: { userId_gameName: { userId: loserId, gameName: matchWithGame.gameName } }
          });
          
          if (!loserRating) {
            loserRating = await prisma.userGameRating.create({
              data: {
                id: `rating_${loserId}_${matchWithGame.gameName}_${Date.now()}`,
                userId: loserId,
                gameName: matchWithGame.gameName,
                rating: 1200,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                highestRating: 1200,
                updatedAt: new Date()
              }
            });
          }

          // Calculate new ratings using the rating system
          const { calculateRatingChange } = await import('./rating');
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
              lastGameAt: new Date(),
              updatedAt: new Date()
            }
          });

          // Update loser rating
          await prisma.userGameRating.update({
            where: { id: loserRating.id },
            data: {
              rating: ratingCalculation.loserNewRating,
              gamesPlayed: { increment: 1 },
              losses: { increment: 1 },
              lastGameAt: new Date(),
              updatedAt: new Date()
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

          // Get match with game name
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
                  id: `rating_${player1}_${matchWithGame.gameName}_${Date.now()}`,
                  userId: player1,
                  gameName: matchWithGame.gameName,
                  rating: 1200,
                  gamesPlayed: 0,
                  wins: 0,
                  losses: 0,
                  draws: 0,
                  highestRating: 1200,
                  updatedAt: new Date()
                }
              });
            }

            let player2Rating = await prisma.userGameRating.findUnique({
              where: { userId_gameName: { userId: player2, gameName: matchWithGame.gameName } }
            });
            
            if (!player2Rating) {
              player2Rating = await prisma.userGameRating.create({
                data: {
                  id: `rating_${player2}_${matchWithGame.gameName}_${Date.now()}`,
                  userId: player2,
                  gameName: matchWithGame.gameName,
                  rating: 1200,
                  gamesPlayed: 0,
                  wins: 0,
                  losses: 0,
                  draws: 0,
                  highestRating: 1200,
                  updatedAt: new Date()
                }
              });
}

            // For draws, both players get small rating changes
            const ratingDiff = Math.abs(player1Rating.rating - player2Rating.rating);
            
            // Update player1 rating
            await prisma.userGameRating.update({
              where: { id: player1Rating.id },
              data: {
                gamesPlayed: { increment: 1 },
                draws: { increment: 1 },
                lastGameAt: new Date(),
                updatedAt: new Date()
              }
            });

            // Update player2 rating
            await prisma.userGameRating.update({
              where: { id: player2Rating.id },
              data: {
                gamesPlayed: { increment: 1 },
                draws: { increment: 1 },
                lastGameAt: new Date(),
                updatedAt: new Date()
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
        } catch (ratingError) {
          console.error(`Error updating draw rating for match ${matchId}:`, ratingError);
        }
      }
    }
  }
}
