/**
 * Rating system utilities - Chess.com style ELO rating
 * Rating range: 200-3200+
 */

export interface RatingCalculation {
  winnerRatingChange: number;
  loserRatingChange: number;
  winnerNewRating: number;
  loserNewRating: number;
}

/**
 * Calculate rating changes for a match result
 * @param winnerRating - Winner's rating before match
 * @param loserRating - Loser's rating before match
 * @param gameType - Type of game (affects K-factor)
 * @returns Rating changes for both players
 */
export function calculateRatingChange(
  winnerRating: number,
  loserRating: number,
  gameType: 'competitive' | 'casual' = 'competitive'
): RatingCalculation {
  // Casual games don't affect rating
  if (gameType === 'casual') {
    return {
      winnerRatingChange: 0,
      loserRatingChange: 0,
      winnerNewRating: winnerRating,
      loserNewRating: loserRating
    };
  }

  // Calculate expected score using ELO formula
  const ratingDifference = loserRating - winnerRating;
  const expectedScore = 1 / (1 + Math.pow(10, ratingDifference / 400));

  // Get K-factor based on rating (like chess.com)
  const winnerKFactor = getKFactor(winnerRating);
  const loserKFactor = getKFactor(loserRating);

  // Calculate rating changes
  const winnerRatingChange = Math.round(winnerKFactor * (1 - expectedScore));
  const loserRatingChange = Math.round(loserKFactor * (0 - (1 - expectedScore)));

  // Apply changes
  const winnerNewRating = Math.max(200, winnerRating + winnerRatingChange);
  const loserNewRating = Math.max(200, loserRating + loserRatingChange);

  return {
    winnerRatingChange,
    loserRatingChange,
    winnerNewRating,
    loserNewRating
  };
}

/**
 * Get K-factor based on rating (like chess.com)
 * Higher K-factor = more rating change per game
 * @param rating - Current player rating
 * @returns K-factor for rating calculations
 */
function getKFactor(rating: number): number {
  if (rating < 1000) return 40;        // Beginners: rapid rating changes
  if (rating < 1500) return 32;        // Intermediate: moderate changes
  if (rating < 2000) return 24;        // Advanced: slower changes
  if (rating < 2500) return 16;        // Expert: slow changes
  return 12;                            // Master: very slow changes
}

/**
 * Get rating tier/rank based on rating
 * @param rating - Player's current rating
 * @returns Rating tier name
 */
export function getRatingTier(rating: number): string {
  if (rating >= 3000) return 'Legend';
  if (rating >= 2800) return 'Grandmaster';
  if (rating >= 2600) return 'International Master';
  if (rating >= 2400) return 'Master';
  if (rating >= 2200) return 'Expert';
  if (rating >= 2000) return 'Advanced';
  if (rating >= 1800) return 'Intermediate';
  if (rating >= 1600) return 'Beginner';
  if (rating >= 1400) return 'Novice';
  if (rating >= 1200) return 'Rookie';
  if (rating >= 1000) return 'Bronze';
  if (rating >= 800) return 'Iron';
  return 'Unranked';
}

/**
 * Get rating color for UI display
 * @param rating - Player's current rating
 * @returns Tailwind CSS color class
 */
export function getRatingColor(rating: number): string {
  if (rating >= 3000) return 'text-purple-500';      // Legend
  if (rating >= 2800) return 'text-red-500';         // Grandmaster
  if (rating >= 2600) return 'text-orange-500';      // International Master
  if (rating >= 2400) return 'text-yellow-500';      // Master
  if (rating >= 2200) return 'text-green-500';       // Expert
  if (rating >= 2000) return 'text-blue-500';        // Advanced
  if (rating >= 1800) return 'text-indigo-500';      // Intermediate
  if (rating >= 1600) return 'text-purple-400';      // Beginner
  if (rating >= 1400) return 'text-pink-400';        // Novice
  if (rating >= 1200) return 'text-gray-300';        // Rookie
  if (rating >= 1000) return 'text-amber-600';       // Bronze
  if (rating >= 800) return 'text-stone-500';        // Iron
  return 'text-gray-400';                            // Unranked
} 