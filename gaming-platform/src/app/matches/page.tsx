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
}

// --- SIMPLE MATCHCARD (default) ---
function MatchCard({ match }: { match: Match }) {
  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";
  return (
    <div className="w-full max-w-xl mx-auto bg-neutral-950 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden">
      {/* Top: Creator info */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-pink-500 flex-shrink-0">
          <Image
            src={match.creator.image || "/Images/default-avatar.png"}
            alt={match.creator.displayName || match.creator.username}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <div className="font-bold text-lg text-white">{match.creator.displayName || match.creator.username}</div>
          <div className="text-xs text-gray-400">Created {new Date(match.createdAt).toLocaleString()}</div>
        </div>
      </div>
      {/* Media section */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {/* User-uploaded media if exists, else game image */}
        {match.mediaUrl ? (
          match.mediaType === "video" ? (
            <video src={match.mediaUrl} controls className="w-full h-full object-cover" />
          ) : (
            <Image src={match.mediaUrl} alt="Match media" fill className="object-cover" />
          )
        ) : (
          <Image src={gameImg} alt={match.gameName} fill className="object-cover opacity-80" />
        )}
        {/* Game logo overlay */}
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
          }`}>{match.status}</div>
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
        <Link href={`/matches/${match.id}`} className="mt-4 w-full block text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 rounded-lg hover:opacity-90 transition">
          View Details
        </Link>
      </div>
    </div>
  );
}
// --- END SIMPLE MATCHCARD ---

// --- DELUXE MATCHCARD (kommentert ut, aktiver ved behov) ---
/*
function MatchCard({ match }: { match: Match }) {
  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";
  return (
    <div className="w-full max-w-xl mx-auto bg-neutral-950 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-2xl group">
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-pink-500 flex-shrink-0">
          <Image
            src={match.creator.image || "/Images/default-avatar.png"}
            alt={match.creator.displayName || match.creator.username}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <div className="font-bold text-lg text-white">{match.creator.displayName || match.creator.username}</div>
          <div className="text-xs text-gray-400">Created {new Date(match.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {match.mediaUrl ? (
          match.mediaType === "video" ? (
            <video src={match.mediaUrl} controls className="w-full h-full object-cover rounded-b-2xl" />
          ) : (
            <Image src={match.mediaUrl} alt="Match media" fill className="object-cover rounded-b-2xl" />
          )
        ) : (
          <Image src={gameImg} alt={match.gameName} fill className="object-cover opacity-80 rounded-b-2xl" />
        )}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none rounded-b-2xl" />
        <div className="absolute top-2 left-2 px-3 py-1 text-xs font-bold text-pink-400 rounded-lg backdrop-blur-sm bg-black/40 border border-pink-400 shadow-md">
          {match.gameName}
        </div>
      </div>
      <div className="p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">{match.name}</div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-md border-2 ${
            match.status === 'open'
              ? 'bg-green-600/90 border-green-400 text-white animate-pulse'
              : match.status === 'in_progress'
              ? 'bg-yellow-600/90 border-yellow-400 text-white animate-pulse'
              : 'bg-gray-700 border-gray-400 text-white'
          }`}>{match.status}</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded shadow">{match.gameMode}</span>
          <span className="bg-gradient-to-r from-yellow-400 to-pink-500 text-white px-2 py-1 rounded shadow">{match.competitionType}</span>
          <span className="bg-gradient-to-r from-blue-500 to-green-400 text-white px-2 py-1 rounded shadow">{match.competitionFormat}</span>
          {match.matchType && <span className="bg-gradient-to-r from-purple-500 to-pink-400 text-white px-2 py-1 rounded shadow">{match.matchType}</span>}
          <span className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-2 py-1 rounded shadow">{match.platform}</span>
          <span className="bg-gradient-to-r from-pink-700 to-pink-900 text-white px-2 py-1 rounded shadow">{match.visibility}</span>
        </div>
        <div className="flex items-center gap-6 mt-2">
          <div>
            <div className="text-pink-400 font-bold text-lg drop-shadow">${match.buyIn.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Buy-in</div>
          </div>
          <div>
            <div className="text-yellow-400 font-bold text-lg drop-shadow">${match.potentialWinnings.toFixed(2)}</div>
            <div className="text-xs text-gray-400">To Winner</div>
          </div>
          <div>
            <div className="text-white font-bold text-lg drop-shadow">{match.currentPlayers}/{match.maxPlayers}</div>
            <div className="text-xs text-gray-400">Players</div>
          </div>
        </div>
        <Link href={`/matches/${match.id}`} className="mt-4 w-full block text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 rounded-lg shadow-lg hover:from-pink-400 hover:to-purple-500 hover:shadow-pink-500/40 transition-all duration-200">
          View Details
        </Link>
      </div>
    </div>
  );
}
*/
// --- SLUTT DELUXE MATCHCARD ---

export default function MatchFeedPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      try {
        const res = await fetch("/api/matches", { method: "GET" });
        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err) {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Match Feed</h1>
      {loading ? (
        <div className="text-center text-lg">Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className="text-center text-gray-400">No matches found.</div>
      ) : (
        <div className="flex flex-col gap-8">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
} 