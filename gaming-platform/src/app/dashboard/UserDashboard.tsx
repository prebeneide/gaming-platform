"use client";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import Link from "next/link";
import UserStats from "./UserStats";

export default function UserDashboard({ user }: { user: {
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
} }) {
  const router = useRouter();
  const [lightMode, setLightMode] = useState(false);

  // Mock-statistikk og matcher
  const stats = {
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
  const last10 = ["W", "L", "D", "L", "W", "W", "W", "L", "D", "D"];

  // Win% og Win/Loss Ratio
  const winPercent = stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;
  const winLossRatio = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : "∞";

  // Dynamiske tekstfarger for lys/mørk modus
  const secondaryText = lightMode ? "text-gray-700" : "text-gray-400";
  const tertiaryText = lightMode ? "text-gray-800" : "text-gray-300";

  // Mock-venner
  const friends = [
    {
      id: 1,
      name: "alexgamer",
      image: "/default-avatar.svg",
      status: "online",
      game: "FIFA 24",
      console: "PS5",
    },
    {
      id: 2,
      name: "lisa_pro",
      image: "/default-avatar.svg",
      status: "recent",
      game: "Rocket League",
      console: "PC",
    },
    {
      id: 3,
      name: "noobmaster",
      image: "/default-avatar.svg",
      status: "offline",
      game: null,
      console: null,
    },
    {
      id: 4,
      name: "sarah",
      image: "/default-avatar.svg",
      status: "online",
      game: "Call of Duty",
      console: "Xbox",
    },
    {
      id: 5,
      name: "mario",
      image: "/default-avatar.svg",
      status: "recent",
      game: null,
      console: null,
    },
  ];

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className={
      `${lightMode ? "bg-gray-100 text-gray-800 border-gray-300" : "bg-neutral-950 text-white"} p-8 rounded-xl shadow-xl w-full max-w-none md:w-11/12 lg:w-10/12 xl:w-9/12 mx-auto flex flex-col gap-8`
    }>
      <button
        className={`absolute right-8 top-8 w-12 h-12 flex items-center justify-center rounded-full shadow transition border-2 z-10
          ${lightMode ? "bg-yellow-100 border-yellow-300 hover:bg-yellow-200" : "bg-gray-800 border-gray-700 hover:bg-gray-700"}`}
        onClick={() => setLightMode((prev) => !prev)}
        aria-label="Toggle light/dark mode"
        style={{ zIndex: 10 }}
      >
        <span className="text-2xl transition-all duration-300">
          {lightMode ? <FaMoon color="#374151" /> : <FaSun color="#fde047" />}
        </span>
      </button>
      <div className="flex flex-col items-center justify-center mb-2">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full w-16 h-16 flex items-center justify-center">
            <div className="bg-neutral-950 rounded-full w-15 h-15 flex items-center justify-center">
              <Image
                src={user.image || "/default-avatar.svg"}
                alt="Profile picture"
                width={60}
                height={60}
                className="rounded-full object-cover w-15 h-15"
                priority
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            {user.username || user.email}!
          </span>
        </div>
      </div>
      {/* Brukerinformasjon */}
      <div className={`text-lg ${tertiaryText} text-center flex flex-col gap-1`}>
        <div><b>Email:</b> {user.email}</div>
        <div><b>Username:</b> {user.username}</div>
        <div><b>User ID:</b> {user.id}</div>
        <div><b>Registered:</b> {stats.registeredAt}</div>
      </div>
      {/* Statistikk */}
      <UserStats stats={stats} winPercent={winPercent} winLossRatio={winLossRatio} last10={last10} secondaryText={secondaryText} />
      {/* Friends Online */}
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
                <Image src={friend.image} alt={friend.name + " avatar"} width={48} height={48} className="rounded-full border border-pink-400 bg-neutral-950 border-neutral-950" />
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
                  ? "Recently active"
                  : "Offline"}
                {friend.game && (
                  <span> • {friend.game} ({friend.console})</span>
                )}
              </span>
              <button
                className="mt-2 px-3 py-1 rounded bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition disabled:opacity-50"
                disabled={friend.status === "offline"}
              >
                Invite
              </button>
            </div>
          ))}
        </div>
      </div>
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
                <Image
                  src={match.opponentImage}
                  alt={match.opponent + " avatar"}
                  width={28}
                  height={28}
                  className="rounded-full border border-pink-400 bg-neutral-950 border-neutral-950"
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
                <Image
                  src={match.opponentImage}
                  alt={match.opponent + " avatar"}
                  width={32}
                  height={32}
                  className="rounded-full border border-pink-400 bg-neutral-950 border-neutral-950"
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
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition">Start New Match</button>
        <button className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition">View All Matches</button>
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
    </div>
  );
} 