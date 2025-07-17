"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiSearch, FiX } from "react-icons/fi";

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

// --- SIMPLE MATCHCARD (default) ---
function MatchCard({ match }: { match: Match }) {
  const gameImg = gameImages[match.gameName] || "/Images/default-game.jpg";
  return (
    <div className="w-full max-w-xl mx-auto bg-neutral-950 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden">
      {/* Top: Creator info */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-pink-500 flex-shrink-0">
          <Image
            src={match.creator.image || "/default-avatar.svg"}
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
      const matchType = match.matchType?.toLowerCase() || '';
      
      const matchesCoopVersus = activeFilters.coopVersus.some(filter => {
        if (filter === 'coop') return matchType === 'coop';
        if (filter === 'versus') return matchType === 'versus';
        return false;
      });
      
      if (!matchesCoopVersus) return false;
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
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Mode:</h3>
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