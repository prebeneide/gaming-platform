import { prisma } from "./prisma";

export interface UserStatsData {
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winPercent: number;
  winLossRatio: number;
  rank: string;
  last10Results: string[];
}

// Calculate rank based on win percentage
function calculateRank(winPercent: number): string {
  if (winPercent >= 80) return "Diamond";
  if (winPercent >= 70) return "Platinum";
  if (winPercent >= 60) return "Gold";
  if (winPercent >= 50) return "Silver";
  if (winPercent >= 30) return "Bronze";
  return "Iron";
}

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
  const rank = calculateRank(winPercent);
  
  // Get last 10 results (most recent first, but we want oldest first for display)
  const last10 = last10Results.slice(-10).reverse();

  return {
    matchesPlayed,
    wins,
    losses,
    draws,
    winPercent,
    winLossRatio,
    rank,
    last10Results: last10
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
      rank: stats.rank,
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
      rank: stats.rank,
      last10Results: stats.last10Results
    }
  });
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
      }
    }
  });

  if (!match) return;

  // Update stats for all participants
  const updatePromises = match.participants.map(participant => 
    updateUserStats(participant.userId)
  );

  await Promise.all(updatePromises);
}

// Get user statistics (from cache or calculate if not exists)
export async function getUserStats(userId: string): Promise<UserStatsData> {
  const cachedStats = await prisma.userStats.findUnique({
    where: { userId }
  });

  if (cachedStats) {
    return {
      matchesPlayed: cachedStats.matchesPlayed,
      wins: cachedStats.wins,
      losses: cachedStats.losses,
      draws: cachedStats.draws,
      winPercent: cachedStats.winPercent,
      winLossRatio: cachedStats.winLossRatio,
      rank: cachedStats.rank,
      last10Results: cachedStats.last10Results
    };
  }

  // If no cached stats, calculate and cache them
  await updateUserStats(userId);
  return getUserStats(userId); // Recursive call to get the newly cached stats
} 