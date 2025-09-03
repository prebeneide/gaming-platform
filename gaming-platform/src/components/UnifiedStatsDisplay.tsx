"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { getRatingColor } from '@/lib/rating';
import { getGameImage } from '@/lib/gameImages';
import { UnifiedUserStats } from '@/lib/unifiedStats';

interface UnifiedStatsDisplayProps {
  stats: UnifiedUserStats;
  className?: string;
  isOwnProfile?: boolean;
}

export default function UnifiedStatsDisplay({ 
  stats, 
  className = "", 
  isOwnProfile = false 
}: UnifiedStatsDisplayProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!stats.gameRatings || stats.gameRatings.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-xl p-3 sm:p-4 md:p-6 border border-neutral-700 shadow-xl w-full ${className}`}>
        <div className="text-center text-neutral-400">
          <div className="text-lg sm:text-xl md:text-2xl mb-2">🎮</div>
          <div className="text-sm sm:text-base md:text-lg font-semibold mb-2">No Game Ratings Yet</div>
          <div className="text-xs sm:text-sm">
            {isOwnProfile 
              ? "Start playing matches to earn ratings!" 
              : "This user hasn't played any matches yet."
            }
          </div>
        </div>
      </div>
    );
  }

  // Sort ratings by rating (highest first)
  const sortedRatings = [...stats.gameRatings].sort((a, b) => b.rating - a.rating);
  const bestRating = sortedRatings[0];

  // Set selected game to best rating if none selected
  if (!selectedGame && bestRating) {
    setSelectedGame(bestRating.gameName);
  }

  const selectedRating = stats.gameRatings.find(r => r.gameName === selectedGame) || bestRating;

  return (
    <div className={`bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-xl p-3 sm:p-4 md:p-6 border border-neutral-700 shadow-xl w-full ${className}`}>
      {/* Header */}
      <div className="text-center mb-3 sm:mb-4 md:mb-6">
        <h2 className="text-base sm:text-lg md:text-2xl font-bold text-white mb-1 sm:mb-2">Game Ratings</h2>
        <div className="text-xs sm:text-sm text-gray-400">
          Best rating: <span className="text-pink-400 font-semibold">{bestRating.gameName}</span>
        </div>
        <div className="text-right mt-1 sm:mt-2">
          <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${getRatingColor(stats.overall.bestRating)}`}>
            {stats.overall.bestRating}
          </div>
          <div className="text-xs sm:text-sm md:text-lg text-gray-300">{stats.overall.bestRatingTier}</div>
        </div>
      </div>

      {/* Game Selection Tabs - Fully responsive */}
      <div className="flex justify-center gap-1 sm:gap-2 mb-3 sm:mb-4 md:mb-6 overflow-x-auto pb-2">
        {stats.gameRatings.map((rating) => (
          <button
            key={rating.id}
            onClick={() => setSelectedGame(rating.gameName)}
            className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              selectedGame === rating.gameName
                ? 'bg-pink-500 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
          >
            {rating.gameName}
          </button>
        ))}
      </div>

      {/* Selected Game Stats - Fully responsive */}
      {selectedRating && (
        <div className="bg-neutral-800 rounded-lg p-2 sm:p-3 md:p-4 border border-neutral-700 mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={getGameImage(selectedRating.gameName)}
                  alt={selectedRating.gameName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 24px, (max-width: 768px) 32px, 48px"
                />
              </div>
              <h4 className="text-xs sm:text-sm md:text-lg font-semibold text-white">{selectedRating.gameName}</h4>
            </div>
            <div className="text-right">
              <div className={`text-sm sm:text-lg md:text-2xl font-bold ${getRatingColor(selectedRating.rating)}`}>
                {selectedRating.rating}
              </div>
              <div className="text-xs sm:text-sm text-neutral-400">{selectedRating.ratingTier}</div>
            </div>
          </div>

          {/* Game-specific stats - Responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 md:gap-4 text-center mb-2 sm:mb-3 md:mb-4">
            <div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-green-400">{selectedRating.wins}</div>
              <div className="text-gray-400 text-xs sm:text-sm">Wins</div>
            </div>
            <div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-red-400">{selectedRating.losses}</div>
              <div className="text-gray-400 text-xs sm:text-sm">Losses</div>
            </div>
            <div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-blue-400">{selectedRating.gamesPlayed}</div>
              <div className="text-gray-400 text-xs sm:text-sm">Games</div>
            </div>
            <div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-orange-400">{selectedRating.highestRating}</div>
              <div className="text-gray-400 text-xs sm:text-sm">Peak</div>
            </div>
          </div>
          
          <div className="text-pink-400 font-semibold text-center text-xs sm:text-sm md:text-base">
            {selectedRating.gamesPlayed > 0 
              ? `${((selectedRating.wins / selectedRating.gamesPlayed) * 100).toFixed(1)}% Win Rate`
              : '0% Win Rate'
            }
          </div>
        </div>
      )}

      {/* Overall Statistics - Fully responsive */}
      <div className="border-t border-neutral-700 pt-3 sm:pt-4 md:pt-6">
        <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-pink-400 mb-2 sm:mb-3 md:mb-4 text-center">Overall Statistics</h3>
        
        {/* First row - Matches, Wins, Losses, Draws - Fully responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 md:gap-8 text-center mb-2 sm:mb-3 md:mb-4">
          <div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-pink-400">{stats.overall.matchesPlayed}</div>
            <div className="text-gray-400 text-xs sm:text-sm">Matches Played</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-400">{stats.overall.wins}</div>
            <div className="text-gray-400 text-xs sm:text-sm">Wins</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-400">{stats.overall.losses}</div>
            <div className="text-gray-400 text-xs sm:text-sm">Losses</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-400">{stats.overall.draws}</div>
            <div className="text-gray-400 text-xs sm:text-sm">Draws</div>
          </div>
        </div>
        
        {/* Second row - Win%, Win/Loss Ratio, Form - Fully responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 md:gap-8 text-center">
          <div>
            <div className="text-base sm:text-lg md:text-xl font-bold text-pink-400">{stats.overall.winPercent}%</div>
            <div className="text-gray-400 text-xs sm:text-sm">Win%</div>
          </div>
          <div>
            <div className="text-base sm:text-lg md:text-xl font-bold text-green-400">{stats.overall.winLossRatio}</div>
            <div className="text-gray-400 text-xs sm:text-sm">Win/Loss Ratio</div>
          </div>
          <div>
            <div className="text-base sm:text-lg md:text-xl font-bold tracking-widest flex justify-center gap-1">
              {stats.overall.last10Results.map((res, idx) => (
                <span
                  key={idx}
                  className={
                    res === "W"
                      ? "text-green-400"
                      : res === "L"
                      ? "text-red-400"
                      : "text-orange-400"
                  }
                >
                  {res}
                </span>
              ))}
            </div>
            <div className="text-gray-400 text-xs sm:text-sm">Form (last 10)</div>
          </div>
        </div>
      </div>

      {/* Show all games (expandable) - Fully responsive */}
      <div className="mt-3 sm:mt-4 md:mt-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-center text-neutral-400 hover:text-white transition-colors duration-200 text-xs sm:text-sm"
        >
          {isExpanded ? '▼ Show less' : '▶ Show all games'}
        </button>
        
        {isExpanded && (
          <div className="mt-2 sm:mt-3 md:mt-4 space-y-1 sm:space-y-2 md:space-y-3">
            {sortedRatings.map((rating) => (
              <div 
                key={rating.id}
                className="flex items-center justify-between p-2 sm:p-2 md:p-3 bg-neutral-800 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-all duration-200"
              >
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={getGameImage(rating.gameName)}
                      alt={rating.gameName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 20px, (max-width: 768px) 24px, 32px"
                    />
                  </div>
                  <span className="font-medium text-white text-xs sm:text-sm md:text-base">{rating.gameName}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm sm:text-base md:text-lg font-bold ${getRatingColor(rating.rating)}`}>
                    {rating.rating}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {rating.gamesPlayed} games
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
