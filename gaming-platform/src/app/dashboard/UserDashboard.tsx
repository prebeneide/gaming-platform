"use client";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import Link from "next/link";
import SocialCounts from "@/components/SocialCounts";
import UserAvatar from "@/components/UserAvatar";
import UnifiedStatsDisplay from "@/components/UnifiedStatsDisplay";
import { UnifiedUserStats } from "@/lib/unifiedStats";
import { getGameImage } from "@/lib/gameImages";

export default function UserDashboard({ user, unifiedStats, socialStats, friends = [], recentMatches = [] }: { 
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
  unifiedStats: UnifiedUserStats;
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

  // Helper function to format date and time
  const formatMatchDateTime = (date: Date) => {
    const now = new Date();
    const matchDate = new Date(date);
    const timeDiff = now.getTime() - matchDate.getTime();
    const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) {
      return {
        date: "Today",
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
    } else if (daysAgo === 1) {
      return {
        date: "Yesterday",
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
    } else if (daysAgo < 7) {
      return {
        date: `${daysAgo} days ago`,
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      };
    } else {
      return {
        date: matchDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
        time: matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
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
        
        {/* Unified Statistics Display */}
        <div className="w-full mb-4 sm:mb-6">
          <UnifiedStatsDisplay 
            stats={unifiedStats}
            isOwnProfile={true}
          />
      </div>

        {/* Friends Online - Only show if user has friends */}
        {friends.length > 0 && (
      <div className="mt-4">
        <h2 className="text-xl font-semibold text-pink-400 mb-4 text-center">Friends Online</h2>
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
          <h2 className="text-2xl font-bold text-pink-400 mb-6 text-center">Recent Matches</h2>
          
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
                  <div key={match.id} className={`relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                    lightMode 
                      ? "bg-white shadow-sm" 
                      : "bg-gradient-to-r from-neutral-900 to-neutral-800 shadow-lg"
                  }`}>
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
                        <div className="flex items-center gap-1.5">
                          <UserAvatar 
                            user={{
                              image: match.opponent.image,
                              username: match.opponent.username,
                              displayName: match.opponent.displayName
                            }}
                            size={24}
                            ring={true}
                          />
      <div>
                            <div className="font-bold text-xs">
                              vs {match.opponent.displayName || match.opponent.username}
                            </div>
                            <div className="text-xs text-gray-400">@{match.opponent.username}</div>
                          </div>
        </div>
                        
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
                      
                      {/* Match Details - Fixed layout for consistent alignment */}
                      <div className="grid grid-cols-12 gap-1 items-center">
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
                          <div className="font-semibold text-xs">{match.platform}</div>
                        </div>
                        <div className="col-span-3 text-center">
                          <div className="text-xs text-gray-400 mb-0.5">Prize</div>
                          <div className="font-semibold text-xs text-green-400">
                            {match.prize > 0 ? `$${match.prize.toFixed(2)}` : 'No prize'}
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="text-xs text-gray-400 mb-0.5">Format</div>
                          <div className="font-semibold text-xs">{match.type}</div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="text-xs text-gray-400 mb-0.5">Time</div>
                          <div className="font-semibold text-xs text-gray-400">
                            {dateTime.time}
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