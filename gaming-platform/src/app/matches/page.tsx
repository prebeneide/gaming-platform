"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiSearch } from "react-icons/fi";
import UserAvatar from "@/components/UserAvatar";

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
    agreedBy: string[];
    disputedBy: string[];
    payoutAmount?: number;
    createdAt: string;
    completedAt?: string;
  };
}

// --- SIMPLE MATCHCARD (current active version) ---
function MatchCard({ match }: { match: Match }) {
  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";
  
  // Helper: Format visibility for display
  const formatVisibility = (visibility: string) => {
    switch (visibility) {
      case 'invite_only':
        return 'Invite Only';
      case 'friends':
        return 'Friends Only';
      case 'public':
        return 'Public';
      default:
        return visibility.charAt(0).toUpperCase() + visibility.slice(1);
    }
  };
  
  return (
    <div className="w-full max-w-xl mx-auto bg-neutral-950 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden">
      {/* Top: Creator info */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <UserAvatar 
          user={{
            image: match.creator.image,
            username: match.creator.username,
            displayName: match.creator.displayName
          }}
          size={44}
          ring={true}
        />
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
          }`}>
            {match.status === 'in_progress' ? 'IN PROGRESS' : match.status.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-gray-300">
          <span className="bg-neutral-800 rounded px-2 py-1">{match.gameMode.charAt(0).toUpperCase() + match.gameMode.slice(1)}</span>
          <span className="bg-neutral-800 rounded px-2 py-1">{match.competitionType.charAt(0).toUpperCase() + match.competitionType.slice(1)}</span>
          <span className="bg-neutral-800 rounded px-2 py-1">{match.competitionFormat.charAt(0).toUpperCase() + match.competitionFormat.slice(1)}</span>
          {match.matchType && <span className="bg-neutral-800 rounded px-2 py-1">{match.matchType.charAt(0).toUpperCase() + match.matchType.slice(1)}</span>}
          <span className="bg-neutral-800 rounded px-2 py-1">{match.platform.charAt(0).toUpperCase() + match.platform.slice(1)}</span>
          <span className="bg-neutral-800 rounded px-2 py-1">{formatVisibility(match.visibility)}</span>
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

        {/* Match Result Section - Only show if completed */}
        {match.status === 'completed' && match.result && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
            <div className="text-green-400 font-bold text-sm mb-2">🏆 Winner</div>
            {match.participants && match.result.winnerId && (
              <div className="text-white font-semibold">
                {match.participants.find(p => p.user.id === match.result?.winnerId)?.user.displayName || 
                 match.participants.find(p => p.user.id === match.result?.winnerId)?.user.username}
              </div>
            )}
            <div className="text-xs text-green-300 mt-1">
              Completed: {new Date(match.result.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Participants Section - Only show if completed */}
        {match.status === 'completed' && match.participants && (
          <div className="mt-3">
            <div className="text-white font-semibold text-sm mb-2">Participants</div>
            <div className="space-y-2">
              {match.participants.map((participant) => {
                const isWinner = match.result?.winnerId === participant.user.id;
                return (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserAvatar 
                        user={{
                          image: participant.user.image,
                          username: participant.user.username,
                          displayName: participant.user.displayName
                        }}
                        size={24}
                        ring={true}
                      />
                      <span className="text-sm text-gray-300">
                        {participant.user.displayName || participant.user.username}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      isWinner 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {isWinner ? 'Winner' : 'Participant'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <Link href={`/matches/${match.id}`} className="mt-4 w-full block text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-2 rounded-lg hover:opacity-90 transition">
          View Details
        </Link>
      </div>
    </div>
  );
}
// --- END SIMPLE MATCHCARD ---

// --- DELUXE MATCHCARD (enhanced version with all features - commented out) ---
/*
function DeluxeMatchCard({ match }: { match: Match }) {
  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";
  
  // Helper: Format visibility for display
  const formatVisibility = (visibility: string) => {
    switch (visibility) {
      case 'invite_only':
        return 'Invite Only';
      case 'friends':
        return 'Friends Only';
      case 'public':
        return 'Public';
      default:
        return visibility.charAt(0).toUpperCase() + visibility.slice(1);
    }
  };
  
  return (
    <div className="w-full max-w-xl mx-auto bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 rounded-3xl shadow-2xl border border-neutral-700/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-pink-500/20 hover:shadow-2xl group backdrop-blur-sm">
      <div className="flex items-center gap-4 px-6 pt-6 pb-3 bg-gradient-to-r from-neutral-900/50 to-transparent">
        <div className="relative">
          <UserAvatar 
            user={{
              image: match.creator.image,
              username: match.creator.username,
              displayName: match.creator.displayName
            }}
            size={48}
            ring={true}
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full border-2 border-neutral-950 animate-pulse"></div>
        </div>
        <div className="flex-1">
          <div className="font-bold text-xl text-white group-hover:text-pink-300 transition-colors duration-300">
            {match.creator.displayName || match.creator.username}
          </div>
          <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
            Created {new Date(match.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {match.mediaUrl ? (
          match.mediaType === "video" ? (
            <video src={match.mediaUrl} controls className="w-full h-full object-cover" />
          ) : (
            <Image src={match.mediaUrl} alt="Match media" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          )
        ) : (
          <Image src={gameImg} alt={match.gameName} fill className="object-cover opacity-80 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
        )}
        
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        
        <div className="absolute top-3 left-3 px-4 py-2 text-sm font-bold text-pink-400 rounded-xl backdrop-blur-md bg-black/60 border border-pink-400/50 shadow-lg group-hover:bg-pink-500/20 group-hover:border-pink-400 transition-all duration-300">
          {match.gameName}
        </div>
        
        <div className="absolute top-3 right-3">
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg border-2 backdrop-blur-sm ${
            match.status === 'open' 
              ? 'bg-green-600/90 border-green-400 text-white animate-pulse shadow-green-500/50' 
              : match.status === 'countdown' 
              ? 'bg-orange-600/90 border-orange-400 text-white animate-pulse shadow-orange-500/50'
              : match.status === 'ready' 
              ? 'bg-yellow-600/90 border-yellow-400 text-white animate-pulse shadow-yellow-500/50'
              : match.status === 'in_progress' 
              ? 'bg-blue-600/90 border-blue-400 text-white animate-pulse shadow-blue-500/50'
              : match.status === 'cancelled' 
              ? 'bg-gray-600/90 border-gray-400 text-white shadow-gray-500/50'
              : 'bg-gray-700/90 border-gray-400 text-white shadow-gray-500/50'
          }`}>
            {match.status === 'in_progress' ? 'IN PROGRESS' : match.status.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>
      </div>
      
      <div className="p-6 flex flex-col gap-4 bg-gradient-to-b from-transparent to-neutral-900/30">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white group-hover:text-pink-200 transition-colors duration-300">
            {match.name}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1.5 rounded-full shadow-lg hover:shadow-pink-500/30 transition-all duration-200">
            {match.gameMode.charAt(0).toUpperCase() + match.gameMode.slice(1)}
          </span>
          <span className="bg-gradient-to-r from-yellow-400 to-pink-500 text-white px-3 py-1.5 rounded-full shadow-lg hover:shadow-yellow-500/30 transition-all duration-200">
            {match.competitionType.charAt(0).toUpperCase() + match.competitionType.slice(1)}
          </span>
          <span className="bg-gradient-to-r from-blue-500 to-green-400 text-white px-3 py-1.5 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all duration-200">
            {match.competitionFormat.charAt(0).toUpperCase() + match.competitionFormat.slice(1)}
          </span>
          {match.matchType && (
            <span className="bg-gradient-to-r from-purple-500 to-pink-400 text-white px-3 py-1.5 rounded-full shadow-lg hover:shadow-purple-500/30 transition-all duration-200">
              {match.matchType.charAt(0).toUpperCase() + match.matchType.slice(1)}
            </span>
          )}
          <span className="bg-gradient-to-r from-gray-600 to-gray-800 text-white px-3 py-1.5 rounded-full shadow-lg hover:shadow-gray-500/30 transition-all duration-200">
            {match.platform.charAt(0).toUpperCase() + match.platform.slice(1)}
          </span>
          <span className="bg-gradient-to-r from-pink-600 to-pink-800 text-white px-3 py-1.5 rounded-full shadow-lg hover:shadow-pink-500/30 transition-all duration-200">
            {formatVisibility(match.visibility)}
          </span>
        </div>
        
        <div className="flex items-center gap-8 mt-4">
          <div className="text-center group-hover:scale-105 transition-transform duration-200">
            <div className="text-pink-400 font-bold text-2xl drop-shadow-lg group-hover:text-pink-300 transition-colors duration-300">
              ${match.buyIn.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Buy-in</div>
          </div>
          <div className="text-center group-hover:scale-105 transition-transform duration-200">
            <div className="text-yellow-400 font-bold text-2xl drop-shadow-lg group-hover:text-yellow-300 transition-colors duration-300">
              ${match.potentialWinnings.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">To Winner</div>
          </div>
          <div className="text-center group-hover:scale-105 transition-transform duration-200">
            <div className="text-white font-bold text-2xl drop-shadow-lg group-hover:text-pink-200 transition-colors duration-300">
              {match.currentPlayers}/{match.maxPlayers}
            </div>
            <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Players</div>
          </div>
        </div>

        {match.status === 'completed' && match.result && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-2xl text-center backdrop-blur-sm shadow-lg group-hover:shadow-green-500/20 transition-all duration-300">
            <div className="text-green-400 font-bold text-lg mb-2 drop-shadow-lg">🏆 Winner</div>
            {match.participants && match.result.winnerId && (
              <div className="text-white font-semibold text-xl group-hover:text-green-200 transition-colors duration-300">
                {match.participants.find(p => p.user.id === match.result?.winnerId)?.user.displayName || 
                 match.participants.find(p => p.user.id === match.result?.winnerId)?.user.username}
              </div>
            )}
            <div className="text-xs text-green-300 mt-2 group-hover:text-green-200 transition-colors duration-300">
              Completed: {new Date(match.result.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {match.status === 'completed' && match.participants && (
          <div className="mt-4 p-4 bg-gradient-to-r from-neutral-800/50 to-neutral-700/50 rounded-2xl backdrop-blur-sm border border-neutral-600/30">
            <div className="text-white font-semibold text-lg mb-3 group-hover:text-pink-200 transition-colors duration-300">Participants</div>
            <div className="space-y-3">
              {match.participants.map((participant) => {
                const isWinner = match.result?.winnerId === participant.user.id;
                return (
                  <div key={participant.id} className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/50 group-hover:bg-neutral-800/70 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        user={{
                          image: participant.user.image,
                          username: participant.user.username,
                          displayName: participant.user.displayName
                        }}
                        size={28}
                        ring={true}
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">
                        {participant.user.displayName || participant.user.username}
                      </span>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-all duration-200 ${
                      isWinner 
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-yellow-500/30 group-hover:shadow-yellow-500/50' 
                        : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 shadow-gray-500/30 group-hover:shadow-gray-500/50'
                    }`}>
                      {isWinner ? 'Winner' : 'Participant'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <Link href={`/matches/${match.id}`} className="mt-6 w-full block text-center bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 text-white font-bold py-3 rounded-2xl shadow-lg hover:from-pink-400 hover:via-purple-500 hover:to-pink-400 hover:shadow-pink-500/40 hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] relative overflow-hidden">
          <span className="relative z-10">View Details</span>
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
      </div>
    </div>
  );
}
*/
// --- END DELUXE MATCHCARD ---

export default function MatchFeedPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtreringsstate
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Chip-filtrering
  const [activeFilters, setActiveFilters] = useState<{
    game: string[];
    format: string[];
    buyIn: string[];
    status: string[];
    platform: string[];
    competitionType: string[];
    coopVersus: string[];
  }>({
    game: [],
    format: [],
    buyIn: [],
    status: [],
    platform: [],
    competitionType: [],
    coopVersus: []
  });

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

  // Filtrer matches basert på valgte filtre
  const filteredMatches = matches.filter(match => {
    // Dropdown-filtrering
    if (selectedGame && match.gameName !== selectedGame) return false;
    
    // Chip-filtrering
    if (activeFilters.game.length > 0 && !activeFilters.game.includes(match.gameName)) return false;
    if (activeFilters.format.length > 0 && !activeFilters.format.includes(match.competitionFormat)) return false;
    if (activeFilters.competitionType && activeFilters.competitionType.length > 0 && !activeFilters.competitionType.includes(match.competitionType)) return false;
    if (activeFilters.coopVersus && activeFilters.coopVersus.length > 0) {
      // Check if match is coop or versus based on matchType field
      // Only FC25 and Rocket League with 1v1 format have matchType
      const gamesWithMatchType = ['FC25', 'Rocket League'];
      const hasMatchType = gamesWithMatchType.includes(match.gameName) && match.competitionFormat === '1v1';
      
      if (hasMatchType) {
        // For games that support matchType, check the actual value
        const matchType = match.matchType?.toLowerCase() || '';
        const matchesCoopVersus = activeFilters.coopVersus.some(filter => {
          if (filter === 'coop') return matchType === 'coop';
          if (filter === 'versus') return matchType === 'versus';
          return false;
        });
        
        if (!matchesCoopVersus) return false;
      } else {
        // For games that don't support matchType, exclude them when coop/versus filter is active
        return false;
      }
    }
    if (activeFilters.buyIn.length > 0) {
      const buyIn = match.buyIn;
      const matchesBuyIn = activeFilters.buyIn.some(filter => {
        if (filter === "free") return buyIn === 0;
        if (filter === "1-10") return buyIn >= 1 && buyIn <= 10;
        if (filter === "10-50") return buyIn >= 10 && buyIn <= 50;
        if (filter === "50+") return buyIn >= 50;
        return false;
      });
      if (!matchesBuyIn) return false;
    }
    if (activeFilters.status.length > 0 && !activeFilters.status.includes(match.status)) return false;
    if (activeFilters.platform.length > 0 && !activeFilters.platform.includes(match.platform)) return false;
    
    // Søkefiltrering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        match.name.toLowerCase().includes(query) ||
        match.creator.username.toLowerCase().includes(query) ||
        match.creator.displayName?.toLowerCase().includes(query) ||
        match.gameName.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Hjelpefunksjoner for chip-filtrering
  const toggleFilter = (category: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const clearAllFilters = () => {
    setSelectedGame("");
    setSearchQuery("");
    setActiveFilters({
      game: [],
      format: [],
      buyIn: [],
      status: [],
      platform: [],
      competitionType: [],
      coopVersus: []
    });
  };

  // Unike verdier for dropdowns
  const uniqueGames = [...new Set(matches.map(m => m.gameName))];
  const uniqueFormats = [...new Set(matches.map(m => m.competitionFormat))];
  const uniqueStatuses = [...new Set(matches.map(m => m.status))];
  const uniquePlatforms = [...new Set(matches.map(m => m.platform))];
  const uniqueCompetitionTypes = [...new Set(matches.map(m => m.competitionType))];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Match Feed</h1>
      
      {/* Filtrering: Dropdown + Chips */}
      <div className="max-w-4xl mx-auto mb-8 p-6 bg-neutral-950 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-bold mb-4 text-pink-400">Filter Matches</h2>
        
        {/* Dropdowns for hovedkategorier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="bg-neutral-900 text-white px-4 py-2 rounded-lg border border-neutral-700 focus:border-pink-500 focus:outline-none"
          >
            <option value="">All Games</option>
            {uniqueGames.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiSearch />
            </div>
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 text-white pl-10 pr-4 py-2 rounded-lg border border-neutral-700 focus:border-pink-500 focus:outline-none"
            />
          </div>
        </div>
        
        {/* Chips for rask filtrering */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Format:</h3>
            <div className="flex flex-wrap gap-2">
              {uniqueFormats.map(format => (
                <button
                  key={format}
                  onClick={() => toggleFilter("format", format)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.format.includes(format)
                      ? "bg-blue-500 text-white"
                      : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Type:</h3>
            <div className="flex flex-wrap gap-2">
              {uniqueCompetitionTypes.map(type => (
                <button
                  key={type}
                  onClick={() => toggleFilter("competitionType", type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.competitionType.includes(type)
                      ? "bg-orange-500 text-white"
                      : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Mode (FC25 & Rocket League only):</h3>
            <div className="flex flex-wrap gap-2">
              {["coop", "versus"].map(mode => (
                <button
                  key={mode}
                  onClick={() => toggleFilter("coopVersus", mode)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.coopVersus.includes(mode)
                      ? "bg-teal-500 text-white"
                      : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Buy-in:</h3>
            <div className="flex flex-wrap gap-2">
              {["free", "1-10", "10-50", "50+"].map(buyIn => (
                <button
                  key={buyIn}
                  onClick={() => toggleFilter("buyIn", buyIn)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.buyIn.includes(buyIn)
                      ? "bg-pink-500 text-white"
                      : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                  }`}
                >
                  {buyIn === "free" ? "Free" : buyIn === "1-10" ? "$1-10" : buyIn === "10-50" ? "$10-50" : "$50+"}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Status:</h3>
            <div className="flex flex-wrap gap-2">
              {uniqueStatuses.map(status => (
                <button
                  key={status}
                  onClick={() => toggleFilter("status", status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.status.includes(status)
                      ? "bg-green-500 text-white"
                      : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                  }`}
                >
                  {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Platform:</h3>
            <div className="flex flex-wrap gap-2">
              {uniquePlatforms.map(platform => (
                <button
                  key={platform}
                  onClick={() => toggleFilter("platform", platform)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.platform.includes(platform)
                      ? "bg-purple-500 text-white"
                      : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <button
          onClick={clearAllFilters}
          className="mt-4 bg-neutral-800 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
      {loading ? (
        <div className="text-center text-lg">Loading matches...</div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center text-gray-400">
          {matches.length === 0 ? "No matches found." : "No matches match your filters."}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
} 