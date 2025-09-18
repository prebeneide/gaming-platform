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

export default function UserDashboard({ user, unifiedStats, socialStats, friends = [] }: { 
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

  const recentMatches = [
    {
      id: 1,
      opponent: "player123",
      opponentImage: "/default-avatar.svg",
      date: "2024-05-10",
      time: "19:30",
      result: "Win",
      console: "PS5",
      game: "FIFA 24",
      prize: "100 kr",
      type: "1v1",
    },
    {
      id: 2,
      opponent: "gamerX",
      opponentImage: "/default-avatar.svg",
      date: "2024-05-09",
      time: "21:15",
      result: "Loss",
      console: "Xbox",
      game: "Call of Duty",
      prize: "5 coins",
      type: "2v2",
    },
    {
      id: 3,
      opponent: "noobmaster",
      opponentImage: "/default-avatar.svg",
      date: "2024-05-08",
      time: "17:05",
      result: "Win",
      console: "PC",
      game: "Rocket League",
      prize: "50 kr",
      type: "3v3",
    },
  ];

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
                  <button
                    onClick={() => {
                      // Navigate to match creation with invitation parameters
                      const params = new URLSearchParams({
                        invite: friend.username,
                        visibility: 'private'
                      });
                      window.location.href = `/matches/new?${params.toString()}`;
                    }}
                    className="mt-2 px-3 py-1 rounded bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition disabled:opacity-50"
                    disabled={friend.status === "offline"}
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Siste matcher */}
        <div>
          <h2 className="text-xl font-semibold text-pink-400 mb-2 text-center">Recent Matches</h2>
          <div className={`hidden lg:grid grid-cols-9 font-medium border-b ${lightMode ? "border-gray-300" : "border-gray-800"} pb-1 mb-1 ${secondaryText}`}>
            <div className="text-left pl-2 col-span-2">Opponent</div>
            <div className="text-center">Game</div>
            <div className="text-center">Result</div>
            <div className="text-center">Console</div>
            <div className="text-center">Prize</div>
            <div className="text-center">Type</div>
            <div className="text-center">Time</div>
            <div className="text-right pr-2">Date</div>
          </div>
          <ul className={lightMode ? "divide-y divide-gray-200" : "divide-y divide-gray-800"}>
            {recentMatches.map(match => (
              <li key={match.id}
                  className={`py-4 px-2 lg:py-2 lg:grid lg:grid-cols-9 lg:items-center flex flex-col gap-2 lg:gap-0 ${tertiaryText}`}>
                {/* Desktop/tabellvisning */}
                <span className="hidden lg:flex items-center gap-2 text-left col-span-2">
                  vs <b>{match.opponent}</b>
                  <UserAvatar 
                    user={{
                      image: match.opponentImage,
                      username: match.opponent,
                      displayName: match.opponent
                    }}
                    size={28}
                    ring={true}
                  />
                </span>
                <span className="hidden lg:block text-center">{match.game}</span>
                <span className={
                  "hidden lg:block " +
                  (match.result === "Win"
                    ? "text-green-400 text-center"
                    : match.result === "Loss"
                    ? "text-red-400 text-center"
                    : "text-orange-400 text-center")
                }>{match.result}</span>
                <span className="hidden lg:block text-center">{match.console}</span>
                <span className="hidden lg:block text-center">{match.prize}</span>
                <span className="hidden lg:block text-center">{match.type}</span>
                <span className={`hidden lg:block text-center text-sm ${secondaryText}`}>{match.time}</span>
                <span className={`hidden lg:block text-right pr-2 text-sm ${secondaryText}`}>{match.date}</span>

                {/* Kortvisning for mindre skjermer */}
                <div className="flex lg:hidden items-center gap-3 flex-wrap">
                  <UserAvatar 
                    user={{
                      image: match.opponentImage,
                      username: match.opponent,
                      displayName: match.opponent
                    }}
                    size={32}
                    ring={true}
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold">vs {match.opponent}</span>
                    <span className={`${secondaryText} text-xs`}>{match.game}</span>
                  </div>
                  <span className={
                    (match.result === "Win"
                      ? "text-green-400"
                      : match.result === "Loss"
                      ? "text-red-400"
                      : "text-orange-400") + " font-semibold ml-auto"
                  }>{match.result}</span>
                </div>
                <div className={`flex lg:hidden flex-wrap gap-4 text-xs ${secondaryText} mt-1`}>
                  <span>{match.console}</span>
                  <span>{match.prize}</span>
                  <span>{match.type}</span>
                  <span>{match.time}</span>
                  <span className="ml-auto">{match.date}</span>
                </div>
              </li>
            ))}
          </ul>
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