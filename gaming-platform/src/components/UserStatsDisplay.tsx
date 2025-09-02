import React from "react";
import { getRatingColor } from "@/lib/rating";

interface UserStatsDisplayProps {
  userStats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    rating: number;
    ratingTier: string;
    winPercent: number;
    winLossRatio: number;
    last10Results: string[];
  } | null;
  className?: string;
}

export default function UserStatsDisplay({ 
  userStats, 
  className = "" 
}: UserStatsDisplayProps) {
  if (!userStats) {
    return (
      <div className={`p-4 bg-neutral-900 rounded-lg text-center ${className}`}>
        <div className="text-gray-400">No statistics available yet</div>
        <div className="text-sm text-gray-500 mt-2">Play your first match to see your stats!</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-neutral-900 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{userStats.matchesPlayed}</div>
          <div className="text-gray-400 text-sm">Matches</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{userStats.wins}</div>
          <div className="text-gray-400 text-sm">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{userStats.losses}</div>
          <div className="text-gray-400 text-sm">Losses</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getRatingColor(userStats.rating)}`}>{userStats.rating}</div>
          <div className="text-gray-400 text-sm">{userStats.ratingTier}</div>
        </div>
      </div>
      
      {/* Additional stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-neutral-900 rounded-lg">
        <div className="text-center">
          <div className="text-xl font-bold text-pink-400">{userStats.winPercent}%</div>
          <div className="text-gray-400 text-sm">Win%</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-400">{userStats.winLossRatio}</div>
          <div className="text-gray-400 text-sm">Win/Loss Ratio</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold tracking-widest flex justify-center gap-1">
            {userStats.last10Results?.length > 0 ? (
              userStats.last10Results.map((res, idx) => (
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
              ))
            ) : (
              <span className="text-gray-500 text-sm">No matches yet</span>
            )}
          </div>
          <div className="text-gray-400 text-sm">Form (last 10)</div>
        </div>
      </div>
    </div>
  );
}
