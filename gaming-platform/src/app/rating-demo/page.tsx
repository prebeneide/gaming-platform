import React from 'react';
import DemoRatingDisplay from '@/components/DemoRatingDisplay';

export default function RatingDemoPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🎮 Rating System Demo</h1>
          <p className="text-xl text-neutral-400">
            See how the new rating system will look on user profiles!
          </p>
        </div>

        {/* Rating Display */}
        <div className="mb-12">
          <DemoRatingDisplay />
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
            <h3 className="text-xl font-bold mb-4 text-green-400">✨ Features</h3>
            <ul className="space-y-2 text-neutral-300">
              <li>• Rating range: 200-3200+ (som chess.com)</li>
              <li>• Per-spill rating (FC25, Fortnite, COD, etc.)</li>
              <li>• Rating tiers: Iron → Bronze → Rookie → Beginner → Expert → Master → Grandmaster → Legend</li>
              <li>• Progress bar som viser hvor nær du er til neste tier</li>
              <li>• Statistikk: Wins, Losses, Games, Peak Rating</li>
              <li>• Win rate beregning</li>
              <li>• Spill selector for å bytte mellom spill</li>
            </ul>
          </div>

          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
            <h3 className="text-xl font-bold mb-4 text-blue-400">🎯 How it works</h3>
            <ul className="space-y-2 text-neutral-300">
              <li>• Win against higher rating = +25-50 points</li>
              <li>• Lose against lower rating = -15-30 points</li>
              <li>• K-factor system: Beginners get faster rating changes</li>
              <li>• Rating updates automatically after each match</li>
              <li>• Each user has separate rating per game</li>
              <li>• Profile shows the game with highest rating</li>
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-12 p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-700/30">
          <h3 className="text-xl font-bold mb-4 text-purple-400">🚀 Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-300">
            <div>
              <strong>1. Fix Prisma:</strong><br/>
              Solve database issues and get the rating system working with real data
            </div>
            <div>
              <strong>2. Integrate on profiles:</strong><br/>
              Add rating display to user profiles and dashboard
            </div>
            <div>
              <strong>3. Rating updates:</strong><br/>
              Connect with match results for automatic rating changes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 