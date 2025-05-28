import React from "react";

export type UserStatsProps = {
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    rank: string;
    registeredAt?: string;
  };
  winPercent: number | string;
  winLossRatio: number | string;
  last10: string[];
  secondaryText?: string;
};

export default function UserStats({ stats, winPercent, winLossRatio, last10, secondaryText = "text-gray-400" }: UserStatsProps) {
  return (
    <>
      {/* Statistikk */}
      <div className="flex flex-col sm:flex-row justify-center gap-8 text-center">
        <div>
          <div className="text-2xl font-bold text-pink-400">{stats.matchesPlayed}</div>
          <div className={secondaryText}>Matches Played</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
          <div className={secondaryText}>Wins</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
          <div className={secondaryText}>Losses</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-400">{stats.draws}</div>
          <div className={secondaryText}>Draws</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-400">{stats.rank}</div>
          <div className={secondaryText}>Rank</div>
        </div>
      </div>
      {/* Win%, Win/Loss Ratio og Form */}
      <div className="flex flex-col sm:flex-row justify-center gap-8 text-center mt-4">
        <div>
          <div className="text-xl font-bold text-pink-400">{winPercent}%</div>
          <div className={secondaryText}>Win%</div>
        </div>
        <div>
          <div className="text-xl font-bold text-green-400">{winLossRatio}</div>
          <div className={secondaryText}>Win/Loss Ratio</div>
        </div>
        <div>
          <div className="text-xl font-bold tracking-widest flex justify-center gap-1">
            {last10.map((res, idx) => (
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
          <div className={secondaryText}>Form (last 10)</div>
        </div>
      </div>
    </>
  );
} 