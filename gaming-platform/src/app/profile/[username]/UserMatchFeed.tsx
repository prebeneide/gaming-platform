"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const gameImages: Record<string, string> = {
  "FC25": "/Images/FC25/98678603c00b2f99573ac233ce0e1780.jpg",
  "Fortnite": "/Images/Fortnite/c3c2a2242cc7e196f639bd78bc8bacfa.jpg",
  "Rocket League": "/Images/RocketLeague/d37e92eaeab39c4e1cb20495cb903bb7.jpg",
  "COD:MW2": "/Images/COD-ModernWarfare2/aa11186dc69287ff7192992845d8585b.jpg",
  "COD:MW3": "/Images/COD-ModernWarfare3/b248a47671cc9b3d3f7c1fdd23a0a8a5.jpg",
  "Apex Legends": "/Images/ApexLegends/45e8fbf182fa6f0e180a02793180f91e.jpg",
  "Battlefield V": "/Images/BattlefieldV/battlefield-5-pc-game-ea-app-cover.jpg",
  "Battlefield 2042": "/Images/Battlefield2042/Battlefield_2042_cover_art.jpg",
  "COD: Black Ops 6": "/Images/COD-BlackOps6/BO6_KA_SECONDARY_240724_16x9_Trio_B.jpg",
};

interface Match {
  id: string;
  name: string;
  gameName: string;
  gameMode: string;
  competitionType: string;
  competitionFormat: string;
  matchType?: string;
  platform: string;
  buyIn: number;
  totalPot: number;
  potentialWinnings: number;
  visibility: string;
  status: string;
  maxPlayers: number;
  currentPlayers: number;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    displayName?: string;
    image?: string;
  };
  participants?: Array<{
    id: string;
    status: string;
    buyInPaid?: boolean;
    hasReportedResult?: boolean;
    reportedWinnerId?: string;
    reportedResult?: string;
    proofImageUrl?: string;
    proofUploadedAt?: string;
    user: {
      id: string;
      username: string;
      displayName?: string;
      image?: string;
    };
  }>;
  result?: {
    id: string;
    winnerId?: string;
    resultType: string;
    status: string;
    payoutAmount?: number;
    createdAt: string;
    completedAt?: string;
  };
}

// Modified MatchCard that adds a role badge
function UserMatchCard({ match, username }: { match: Match; username: string }) {
  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";
  const isCreator = match.creator.username === username;
  
  return (
    <div className="w-full max-w-xl mx-auto bg-neutral-950 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden">
      {/* Top: Creator info with role badge */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-pink-500 flex-shrink-0">
          <Image
            src={match.creator.image || "/default-avatar.svg"}
            alt={match.creator.displayName || match.creator.username}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg text-white">{match.creator.displayName || match.creator.username}</div>
          <div className="text-xs text-gray-400">Created {new Date(match.createdAt).toLocaleString()}</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          isCreator 
            ? "bg-purple-600 text-white" 
            : "bg-blue-600 text-white"
        }`}>
          {isCreator ? "CREATED" : "JOINED"}
        </div>
      </div>

      {/* Media section */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {match.mediaUrl ? (
          match.mediaType === "video" ? (
            <video src={match.mediaUrl} controls className="w-full h-full object-cover" />
          ) : (
            <Image src={match.mediaUrl} alt="Match media" fill className="object-cover" />
          )
        ) : (
          <Image src={gameImg} alt={match.gameName} fill className="object-cover opacity-80" />
        )}
        <div className="absolute top-2 left-2 bg-black bg-opacity-60 rounded-lg px-3 py-1 text-xs font-bold text-pink-400">
          {match.gameName}
        </div>
      </div>

      {/* Match info */}
      <div className="p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">{match.name}</div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            match.status === 'open' ? 'bg-green-700 text-white' :
            match.status === 'countdown' ? 'bg-orange-600 text-white' :
            match.status === 'ready' ? 'bg-yellow-600 text-white' :
            match.status === 'in_progress' ? 'bg-blue-600 text-white' :
            match.status === 'cancelled' ? 'bg-gray-600 text-white' :
            'bg-gray-700 text-white'
          }`}>
            {match.status === 'in_progress' ? 'IN PROGRESS' : match.status.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
          <span className="bg-neutral-800 rounded px-2 py-1">{match.gameMode}</span>
          <span className="bg-neutral-800 rounded px-2 py-1">{match.competitionType}</span>
          <span className="bg-neutral-800 rounded px-2 py-1">{match.competitionFormat}</span>
          {match.matchType && <span className="bg-neutral-800 rounded px-2 py-1">{match.matchType}</span>}
          <span className="bg-neutral-800 rounded px-2 py-1">{match.platform}</span>
          <span className="bg-neutral-800 rounded px-2 py-1">{match.visibility}</span>
        </div>

        <div className="flex items-center gap-6 mt-2">
          <div>
            <div className="text-pink-400 font-bold text-lg">${match.buyIn.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Buy-in</div>
          </div>
          <div>
            <div className="text-yellow-400 font-bold text-lg">${match.potentialWinnings.toFixed(2)}</div>
            <div className="text-xs text-gray-400">To Winner</div>
          </div>
          <div>
            <div className="text-white font-bold text-lg">{match.currentPlayers}/{match.maxPlayers}</div>
            <div className="text-xs text-gray-400">Players</div>
          </div>
        </div>

        <Link 
          href={`/matches/${match.id}`} 
          className="mt-4 w-full block text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 rounded-lg hover:opacity-90 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default function UserMatchFeed({ username }: { username: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserMatches() {
      try {
        const response = await fetch(`/api/users/${username}/matches`);
        if (response.ok) {
          const data = await response.json();
          setMatches(data.matches);
        } else {
          setError("Failed to load matches");
        }
      } catch (err) {
        setError("Failed to load matches");
      } finally {
        setLoading(false);
      }
    }

    fetchUserMatches();
  }, [username]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
          <div className="text-gray-400 mt-4">Loading matches...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="text-center py-8">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-8">
          <div className="text-gray-400">No matches found for this user.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-center text-pink-400">Match History</h2>
      <div className="flex flex-col gap-8">
        {matches.map((match) => (
          <UserMatchCard key={match.id} match={match} username={username} />
        ))}
      </div>
    </div>
  );
} 