"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getRatingTier, getRatingColor } from '@/lib/rating';
import { getGameImage } from '@/lib/gameImages';

// Mock data for demo
const mockRatings = [
  {
    gameName: "FC25",
    rating: 1850,
    gamesPlayed: 45,
    wins: 32,
    losses: 10,
    draws: 3,
    highestRating: 1920,
    lastGameAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    gameName: "Fortnite",
    rating: 2100,
    gamesPlayed: 78,
    wins: 45,
    losses: 28,
    draws: 5,
    highestRating: 2180,
    lastGameAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    gameName: "COD:MW3",
    rating: 1650,
    gamesPlayed: 23,
    wins: 15,
    losses: 7,
    draws: 1,
    highestRating: 1680,
    lastGameAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    gameName: "Rocket League",
    rating: 1200,
    gamesPlayed: 12,
    wins: 6,
    losses: 6,
    draws: 0,
    highestRating: 1250,
    lastGameAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    gameName: "Apex Legends",
    rating: 1950,
    gamesPlayed: 34,
    wins: 22,
    losses: 10,
    draws: 2,
    highestRating: 1980,
    lastGameAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
  }
];

interface GameRating {
  gameName: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  highestRating: number;
  lastGameAt?: Date;
}

interface DemoRatingDisplayProps {
  className?: string;
}

export default function DemoRatingDisplay({ className = "" }: DemoRatingDisplayProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort ratings by rating (highest first)
  const sortedRatings = [...mockRatings].sort((a, b) => b.rating - a.rating);
  const bestRating = sortedRatings[0];

  useEffect(() => {
    if (bestRating) {
      setSelectedGame(bestRating.gameName);
    }
  }, [bestRating]);

  const selectedRating = mockRatings.find(r => r.gameName === selectedGame) || bestRating;

  return (
    <div className={`bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl ${className}`}>
      {/* Header med beste spill */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">🎮 Game Ratings</h3>
          <p className="text-neutral-400 text-sm">Your best rating: {bestRating?.gameName}</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getRatingColor(bestRating?.rating || 0)}`}>
            {bestRating?.rating}
          </div>
          <div className="text-sm text-neutral-400">{getRatingTier(bestRating?.rating || 0)}</div>
        </div>
      </div>

      {/* Spill selector */}
              <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            {sortedRatings.map((rating) => (
              <button
                key={rating.gameName}
                onClick={() => setSelectedGame(rating.gameName)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedGame === rating.gameName
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:scale-102'
                }`}
              >
                <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={getGameImage(rating.gameName)}
                    alt={rating.gameName}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
                {rating.gameName}
              </button>
            ))}
          </div>
        </div>

              {/* Valgt spill rating detaljer */}
        {selectedRating && (
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={getGameImage(selectedRating.gameName)}
                    alt={selectedRating.gameName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <h4 className="text-lg font-semibold text-white">{selectedRating.gameName}</h4>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getRatingColor(selectedRating.rating)}`}>
                  {selectedRating.rating}
                </div>
                <div className="text-sm text-neutral-400">{getRatingTier(selectedRating.rating)}</div>
              </div>
            </div>

          {/* Rating bar som viser hvor nær du er til neste tier */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-neutral-400 mb-2">
              <span>Current Tier</span>
              <span>Next Tier</span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${getTierProgress(selectedRating.rating)}%`,
                  background: `linear-gradient(90deg, ${getTierColor(selectedRating.rating)} 0%, ${getNextTierColor(selectedRating.rating)} 100%)`
                }}
              />
            </div>
          </div>

          {/* Statistikk grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{selectedRating.wins}</div>
              <div className="text-sm text-neutral-400">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{selectedRating.losses}</div>
              <div className="text-sm text-neutral-400">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{selectedRating.gamesPlayed}</div>
              <div className="text-sm text-neutral-400">Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{selectedRating.highestRating}</div>
              <div className="text-sm text-neutral-400">Peak</div>
            </div>
          </div>

          {/* Win rate */}
          <div className="mt-4 text-center">
            <div className="text-lg font-semibold text-white">
              {selectedRating.gamesPlayed > 0 
                ? `${((selectedRating.wins / selectedRating.gamesPlayed) * 100).toFixed(1)}%`
                : '0%'
              } Win Rate
            </div>
          </div>
        </div>
      )}

      {/* Alle spill oversikt (expandable) */}
      <div className="mt-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-center text-neutral-400 hover:text-white transition-colors duration-200"
        >
          {isExpanded ? '▼ Vis mindre' : '▶ Vis alle spill'}
        </button>
        
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {sortedRatings.map((rating) => (
              <div 
                key={rating.gameName}
                className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={getGameImage(rating.gameName)}
                      alt={rating.gameName}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <span className="font-medium text-white">{rating.gameName}</span>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getRatingColor(rating.rating)}`}>
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

      {/* Demo notice */}
      <div className="mt-6 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <div className="text-blue-400 text-sm text-center">
          🎯 <strong>Demo Mode:</strong> This is mock data to show how the rating system will look!
        </div>
      </div>
    </div>
  );
}

// Helper functions for tier progress and colors
function getTierProgress(rating: number): number {
  if (rating >= 3000) return 100; // Legend
  if (rating >= 2800) return 80 + ((rating - 2800) / 200) * 20;
  if (rating >= 2600) return 60 + ((rating - 2600) / 200) * 20;
  if (rating >= 2400) return 40 + ((rating - 2400) / 200) * 20;
  if (rating >= 2200) return 20 + ((rating - 2200) / 200) * 20;
  if (rating >= 2000) return ((rating - 2000) / 200) * 20;
  if (rating >= 1800) return ((rating - 1800) / 200) * 20;
  if (rating >= 1600) return ((rating - 1600) / 200) * 20;
  if (rating >= 1400) return ((rating - 1400) / 200) * 20;
  if (rating >= 1200) return ((rating - 1200) / 200) * 20;
  if (rating >= 1000) return ((rating - 1000) / 200) * 20;
  if (rating >= 800) return ((rating - 800) / 200) * 20;
  return Math.min(100, (rating / 800) * 100);
}

function getTierColor(rating: number): string {
  if (rating >= 3000) return '#a855f7'; // Purple
  if (rating >= 2800) return '#ef4444'; // Red
  if (rating >= 2600) return '#f97316'; // Orange
  if (rating >= 2400) return '#eab308'; // Yellow
  if (rating >= 2200) return '#22c55e'; // Green
  if (rating >= 2000) return '#3b82f6'; // Blue
  if (rating >= 1800) return '#6366f1'; // Indigo
  if (rating >= 1600) return '#a855f7'; // Purple
  if (rating >= 1400) return '#ec4899'; // Pink
  if (rating >= 1200) return '#d1d5db'; // Gray
  if (rating >= 1000) return '#d97706'; // Amber
  if (rating >= 800) return '#78716c'; // Stone
  return '#9ca3af'; // Gray
}

function getNextTierColor(rating: number): string {
  if (rating >= 3000) return '#a855f7'; // Purple
  if (rating >= 2800) return '#a855f7'; // Purple
  if (rating >= 2600) return '#ef4444'; // Red
  if (rating >= 2400) return '#f97316'; // Orange
  if (rating >= 2200) return '#eab308'; // Yellow
  if (rating >= 2000) return '#22c55e'; // Green
  if (rating >= 1800) return '#3b82f6'; // Blue
  if (rating >= 1600) return '#6366f1'; // Indigo
  if (rating >= 1400) return '#a855f7'; // Purple
  if (rating >= 1200) return '#ec4899'; // Pink
  if (rating >= 1000) return '#d1d5db'; // Gray
  if (rating >= 800) return '#d97706'; // Amber
  return '#78716c'; // Stone
} 