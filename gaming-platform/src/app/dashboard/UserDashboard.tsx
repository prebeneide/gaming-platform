"use client";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { FiDollarSign, FiPlus } from "react-icons/fi";
import Link from "next/link";
import SocialCounts from "@/components/SocialCounts";
import UserAvatar from "@/components/UserAvatar";
import UnifiedStatsDisplay from "@/components/UnifiedStatsDisplay";
import { UnifiedUserStats } from "@/lib/unifiedStats";
import { getGameImage } from "@/lib/gameImages";
import MatchCard, { Match } from "@/components/MatchCard";
import GlobalChatWidget from "@/components/GlobalChatWidget";

// Games list for Create Game slider
const games = [
  {
    id: 1,
    name: 'FC25',
    image: '/Images/FC25/98678603c00b2f99573ac233ce0e1780.jpg',
  },
  {
    id: 2,
    name: 'Fortnite',
    image: '/Images/Fortnite/c3c2a2242cc7e196f639bd78bc8bacfa.jpg',
  },
  {
    id: 3,
    name: 'Rocket League',
    image: '/Images/RocketLeague/d37e92eaeab39c4e1cb20495cb903bb7.jpg',
  },
  {
    id: 4,
    name: 'COD:MW2',
    image: '/Images/COD-ModernWarfare2/aa11186dc69287ff7192992845d8585b.jpg',
  },
  {
    id: 5,
    name: 'COD:MW3',
    image: '/Images/COD-ModernWarfare3/b248a47671cc9b3d3f7c1fdd23a0a8a5.jpg',
  },
  {
    id: 6,
    name: 'Apex Legends',
    image: '/Images/ApexLegends/45e8fbf182fa6f0e180a02793180f91e.jpg',
  },
  {
    id: 7,
    name: 'Battlefield V',
    image: '/Images/BattlefieldV/battlefield-5-pc-game-ea-app-cover.jpg',
  },
  {
    id: 8,
    name: 'Battlefield 2042',
    image: '/Images/Battlefield2042/Battlefield_2042_cover_art.jpg',
  },
  {
    id: 9,
    name: 'COD: Black Ops 6',
    image: '/Images/COD-BlackOps6/BO6_KA_SECONDARY_240724_16x9_Trio_B.jpg',
  },
];

// CreateGameSlider component
function CreateGameSlider() {
  const router = useRouter();

  const handleGameSelect = (gameId: number) => {
    const params = new URLSearchParams();
    params.set('gameId', gameId.toString());
    router.push(`/matches/new/details?${params.toString()}`);
  };

  return (
    <div className="flex flex-row gap-4 overflow-x-auto pb-2 hide-scrollbar">
      {games.map((game) => (
        <button
          key={game.id}
          onClick={() => handleGameSelect(game.id)}
          className="flex flex-col items-center gap-2 p-4 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-all min-w-[140px] max-w-[140px] group"
        >
          <div className="relative w-24 h-32 rounded-lg overflow-hidden">
            <Image
              src={game.image}
              alt={game.name}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-lg group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <span className="text-sm font-semibold text-center text-white">
            {game.name}
          </span>
        </button>
      ))}
    </div>
  );
}

// FriendsRecentMatches component that fetches data from /api/matches like match feed
function FriendsRecentMatches({ currentUserId }: { currentUserId: string }) {
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Loading friends' matches...</div>
      </div>
    );
  }

  // Filter out cancelled matches and user's own matches
  const friendsMatches = matches.filter(match => 
    match.status !== 'cancelled' && match.creator.id !== currentUserId
  );

  if (friendsMatches.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">No recent matches from friends</div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
      {friendsMatches.slice(0, 6).map((match) => (
        <div key={match.id} className="w-80 flex-shrink-0">
          <MatchCard match={match} />
        </div>
      ))}
    </div>
  );
}

export default function UserDashboard({ user, walletBalance, unifiedStats, socialStats, friends = [], recentMatches = [], preferences }: { 
  user: {
    email?: string | null;
    username?: string | null;
    id?: string | null;
    image?: string | null;
    displayName?: string | null;
    bio?: string | null;
    discord?: string | null;
    twitter?: string | null;
    twitch?: string | null;
    steam?: string | null;
    psn?: string | null;
    xbox?: string | null;
    customGames?: any;
  };
  walletBalance?: number;
  unifiedStats: UnifiedUserStats;
  preferences?: {
    timeFormat?: string;
    dateFormat?: string;
    timezone?: string;
  };
  socialStats?: {
    followers: number;
    following: number;
    friends: number;
  };
  friends?: Array<{
    id: string;
    name: string;
    username: string;
    image?: string | null;
    status: "online" | "recent" | "offline";
    lastActiveAt?: Date | null;
  }>;
  recentMatches?: Array<{
    id: string;
    game: string;
    result: string;
    platform: string;
    buyIn: number;
    prize: number;
    type: string;
    createdAt: Date;
    opponent: {
      username: string;
      displayName?: string | null;
      image?: string | null;
    };
  }>;
}) {
  const router = useRouter();
  const [lightMode, setLightMode] = useState(false);

  // Use real statistics if available, otherwise fallback to mock data
  const stats = unifiedStats ? {
    matchesPlayed: unifiedStats.overall.matchesPlayed,
    wins: unifiedStats.overall.wins,
    losses: unifiedStats.overall.losses,
    draws: unifiedStats.overall.draws,
    rank: unifiedStats.overall.bestRatingTier,
    registeredAt: "2024-05-01", // This could be fetched from user data
  } : {
    matchesPlayed: 14,
    wins: 7,
    losses: 5,
    draws: 2,
    rank: "Gold III",
    registeredAt: "2024-05-01",
  };

  // Helper function to format date and time based on user preferences
  const formatMatchDateTime = (date: Date) => {
    const now = new Date();
    const matchDate = new Date(date);
    const timeDiff = now.getTime() - matchDate.getTime();
    const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Use preferences or defaults
    const timeFormat = preferences?.timeFormat || "12";
    const hour12 = timeFormat === "12";
    
    if (daysAgo === 0) {
      return {
        date: "Today",
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12 })
      };
    } else if (daysAgo === 1) {
      return {
        date: "Yesterday",
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12 })
      };
    } else if (daysAgo < 7) {
      return {
        date: `${daysAgo} days ago`,
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12 })
      };
    } else {
      return {
        date: matchDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12 })
      };
    }
  };

  // Form: de 10 siste kampene (W/L/D)
  const last10 = unifiedStats ? unifiedStats.overall.last10Results : ["W", "L", "D", "L", "W", "W", "W", "L", "D", "D"];

  // Win% og Win/Loss Ratio
  const winPercent = unifiedStats ? unifiedStats.overall.winPercent : (stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0);
  const winLossRatio = unifiedStats ? unifiedStats.overall.winLossRatio : (stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : "∞");

  // Dynamiske tekstfarger for lys/mørk modus
  const secondaryText = lightMode ? "text-gray-700" : "text-gray-400";
  const tertiaryText = lightMode ? "text-gray-800" : "text-gray-300";

  // Mock-venner
  // Helper function to format last active time
  const formatLastActive = (lastActiveAt: Date | null | undefined) => {
    if (!lastActiveAt) return "Never";
    
    const now = new Date();
    const diffMs = now.getTime() - lastActiveAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleSignOut = async () => {
    // Start redirect først
    router.push("/login");
    // Deretter sign out
    await signOut({ redirect: false });
  };

  return (
    <div className={`min-h-screen ${lightMode ? 'bg-gray-50' : 'bg-black'} text-white transition-colors duration-300`}>
      <button
        className={`absolute right-4 sm:right-8 top-4 sm:top-8 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full shadow transition border-2 z-10
          ${lightMode ? "bg-yellow-100 border-yellow-300 hover:bg-yellow-200" : "bg-gray-800 border-gray-700 hover:bg-gray-700"}`}
        onClick={() => setLightMode((prev) => !prev)}
        aria-label="Toggle light/dark mode"
        style={{ zIndex: 10 }}
      >
        <span className="text-xl sm:text-2xl transition-all duration-300">
          {lightMode ? <FaMoon color="#374151" /> : <FaSun color="#fde047" />}
        </span>
      </button>
      
      {/* Responsive container with max-width for large screens */}
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <UserAvatar user={user} size={60} ring={true} />
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold signup-gradient-text">
            {user.username || user.email}!
          </span>
        </div>
      </div>
      
      {/* Sosiale statistikk */}
      {socialStats && (
          <div className="mb-4 sm:mb-6 w-full">
          <SocialCounts username={(user.username as string) || ""} counts={socialStats} condensed />
        </div>
      )}

      {/* Wallet Section */}
      <div className="w-full mb-4 sm:mb-6">
        <div className={`relative overflow-hidden rounded-2xl p-6 ${
          lightMode 
            ? "bg-gradient-to-r from-pink-500 to-purple-600" 
            : "bg-gradient-to-r from-pink-600 to-purple-700"
        } shadow-lg`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-3">
                  <FiDollarSign className="text-2xl text-white" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">Wallet Balance</h3>
                  <p className="text-white/80 text-sm">Available funds</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-bold text-white">
                  ${walletBalance?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/wallet" className="flex-1">
                <button className="w-full px-4 py-3 bg-white text-pink-600 font-semibold rounded-lg hover:bg-gray-100 transition flex items-center justify-center">
                  <span>View Wallet</span>
                </button>
              </Link>
              <Link href="/wallet?deposit=true" className="flex-1">
                <button className="w-full px-4 py-3 bg-white/20 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/30 transition flex items-center justify-center gap-2">
                  <FiPlus />
                  <span>Add Funds</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
        
        {/* Unified Statistics Display */}
        <div className="w-full mb-4 sm:mb-6">
          <UnifiedStatsDisplay 
            stats={unifiedStats}
            isOwnProfile={true}
          />
      </div>

      {/* Global Chat Widget */}
      <div className="w-full mb-4 sm:mb-6">
        <GlobalChatWidget />
      </div>

        {/* Create a Game Section */}
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">Create a Game</h2>
          <CreateGameSlider />
        </div>

        {/* Friends Online - Only show if user has friends */}
        {friends.length > 0 && (
      <div className="mt-4">
        <h2 className="text-xl font-semibold text-white mb-4 text-center">Friends Online</h2>
        <div className="flex flex-row gap-4 overflow-x-auto pb-2 hide-scrollbar">
          {friends.map(friend => (
            <div
              key={friend.id}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl shadow border transition min-w-[220px] min-h-[150px] max-w-xs
                ${lightMode
                  ? friend.status === "online"
                    ? "bg-green-50 border-green-100"
                    : friend.status === "recent"
                    ? "bg-yellow-50 border-yellow-100"
                    : "bg-gray-100 border-gray-200"
                  : "bg-neutral-900 border-neutral-950"}
              `}
            >
              <div className="relative mb-1">
                    <UserAvatar 
                      user={{
                        image: friend.image,
                        username: friend.username,
                        displayName: friend.name
                      }}
                      size={48}
                      ring={true}
                    />
                <span className={`absolute -bottom-1 -right-1 block w-4 h-4 rounded-full border-2 border-white ${
                  friend.status === "online"
                    ? "bg-green-400"
                    : friend.status === "recent"
                    ? "bg-yellow-400"
                    : "bg-gray-400"
                }`}></span>
              </div>
              <span className="font-semibold text-lg text-center w-full truncate">{friend.name}</span>
              <span className="text-xs text-center w-full truncate text-gray-500">
                {friend.status === "online"
                  ? "Online"
                  : friend.status === "recent"
                      ? `Recently active • ${formatLastActive(friend.lastActiveAt)}`
                      : `Offline • ${formatLastActive(friend.lastActiveAt)}`}
              </span>
                  <div className="flex gap-2 mt-2">
              <button
                      onClick={() => {
                        // Navigate to match creation with invitation parameters
                        const params = new URLSearchParams({
                          invite: friend.username,
                          visibility: 'private'
                        });
                        window.location.href = `/matches/new?${params.toString()}`;
                      }}
                      className="px-3 py-1 rounded bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition disabled:opacity-50"
                disabled={friend.status === "offline"}
              >
                Invite
              </button>
                    <button
                      onClick={() => {
                        // Navigate to personal chat with this friend
                        window.location.href = `/chat/${friend.username}`;
                      }}
                      className="px-3 py-1 rounded bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition"
                    >
                      Chat
                    </button>
                  </div>
            </div>
          ))}
        </div>
      </div>
        )}
        {/* Recent Matches - Modern Card Design */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">My Recent Matches</h2>
          
          {recentMatches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No matches yet</div>
              <div className="text-gray-500 text-sm">Start playing to see your match history here!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recentMatches.map((match, index) => {
                const dateTime = formatMatchDateTime(match.createdAt);
                const gameImg = getGameImage(match.game);
                
                return (
              <div 
                key={match.id} 
                onClick={() => {
                  window.location.href = `/matches/${match.id}`;
                }}
                className={`relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer ${
                  lightMode 
                    ? "bg-white shadow-sm" 
                    : "bg-gradient-to-r from-neutral-900 to-neutral-800 shadow-lg"
                }`}
              >
                    {/* Background Game Image */}
                    <div className="absolute inset-0 opacity-20">
                      <img 
                        src={gameImg} 
                        alt={match.game}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="relative p-2">
                      <div className="flex items-center justify-between mb-1">
                    {/* Opponent Info */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/profile/${match.opponent.username}`;
                      }}
                      className="flex items-center gap-1.5 hover:bg-pink-500/10 rounded-lg p-2 -m-2 transition-all duration-200 hover:scale-105 group"
                    >
                      <UserAvatar 
                        user={{
                          image: match.opponent.image,
                          username: match.opponent.username,
                          displayName: match.opponent.displayName
                        }}
                        size={24}
                        ring={true}
                      />
                      <div className="text-left">
                        <div className="font-bold text-xs group-hover:text-pink-300 transition-colors duration-200">
                          vs {match.opponent.displayName || match.opponent.username}
                        </div>
                        <div className="text-xs text-gray-400 group-hover:text-pink-400/80 transition-colors duration-200">
                          @{match.opponent.username}
                        </div>
        </div>
                    </button>
                        
                        {/* Result Badge */}
                        <div className={`px-1.5 py-0.5 rounded-full font-bold text-xs ${
                          match.result === "Win"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : match.result === "Loss"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        }`}>
                          {match.result}
                        </div>
                      </div>
                      
                      {/* Match Details - Responsive layout */}
                      {/* Desktop: Single row grid */}
                      <div className="hidden sm:grid grid-cols-12 gap-1 items-center">
                        {/* Game Image - Separate column for perfect alignment */}
                        <div className="col-span-1 text-center">
                          <div className="w-12 h-12 flex items-center justify-center mx-auto p-2">
                            <img src={gameImg} alt={match.game} className="w-8 h-8 rounded-full" />
                          </div>
                        </div>
                        {/* Game Name */}
                        <div className="col-span-2 text-center">
                          <div className="text-xs text-gray-400 mb-0.5">Game</div>
                          <div className="font-semibold text-xs truncate">{match.game}</div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="text-xs text-gray-400 mb-0.5">Platform</div>
                          <div className="font-semibold text-xs truncate">{match.platform}</div>
                        </div>
                        <div className="col-span-3 text-center">
                          <div className="text-xs text-gray-400 mb-0.5">Prize</div>
                          <div className="font-semibold text-xs text-green-400 truncate">
                            {match.prize > 0 ? `$${match.prize.toFixed(2)}` : 'No prize'}
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="text-xs text-gray-400 mb-0.5">Format</div>
                          <div className="font-semibold text-xs truncate">{match.type}</div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="text-xs text-gray-400 mb-0.5">Time</div>
                          <div className="font-semibold text-xs text-gray-400 truncate">
                            {dateTime.time}
                          </div>
                        </div>
                      </div>

                      {/* Mobile/Tablet: Two rows layout */}
                      <div className="sm:hidden space-y-2">
                        {/* First row: Game image, name, and platform */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 p-1">
                            <img src={gameImg} alt={match.game} className="w-8 h-8 rounded-full" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-400 mb-0.5">Game</div>
                            <div className="font-semibold text-xs">{match.game}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-0.5">Platform</div>
                            <div className="font-semibold text-xs">{match.platform}</div>
                          </div>
                        </div>
                        
                        {/* Second row: Prize, format, and time */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-0.5">Prize</div>
                            <div className="font-semibold text-xs text-green-400">
                              {match.prize > 0 ? `$${match.prize.toFixed(2)}` : 'No prize'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-0.5">Format</div>
                            <div className="font-semibold text-xs">{match.type}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-0.5">Time</div>
                            <div className="font-semibold text-xs text-gray-400">
                              {dateTime.time}
                            </div>
                          </div>
                        </div>
                      </div>
                </div>
              </div>
                );
              })}
              </div>
          )}
      </div>

      {/* Friends Recent Matches - Only show if user has friends */}
      {friends.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Friends Recent Matches</h2>
          
          <FriendsRecentMatches currentUserId={user.id || ""} />
        </div>
      )}
      {/* CTA-knapper */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
        <Link href="/matches/new">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition">Create a new match</button>
        </Link>
        <Link href="/matches">
          <button className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition">View All Matches</button>
        </Link>
        <Link href="/profile/edit">
          <button className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-2 px-6 rounded-lg transition">Edit Profile</button>
        </Link>
      </div>
      <div className="text-center mt-4">
        <button
          onClick={handleSignOut}
          className="text-pink-400 hover:underline"
        >
          Log out
        </button>
      </div>
      <style jsx>{`
        .signup-gradient-text {
          background: linear-gradient(90deg, #00c6fb, #8b5cf6, #f6369a);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
        }
        .profile-gradient-ring {
          background: conic-gradient(
            from 200deg,
            #00c6fb 0deg,
            #8b5cf6 120deg,
            #f6369a 240deg,
            #00c6fb 360deg
          );
        }
      `}</style>
      </div>
    </div>
  );
} 