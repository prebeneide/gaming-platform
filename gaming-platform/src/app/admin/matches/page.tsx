"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiAward, FiSearch, FiRefreshCw, FiUsers, FiDollarSign, FiCalendar, FiActivity, FiClock } from "react-icons/fi";
import AdminLayout from "@/components/AdminLayout";
import TimeFormatter from "@/components/TimeFormatter";
import Link from "next/link";

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
  createdAt: string;
  scheduledAt?: string;
  creator: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    image?: string;
  };
  participants: Array<{
    id: string;
    userId: string;
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
    resultType?: string;
    status?: string;
    payoutAmount?: number;
    createdAt?: string;
    completedAt?: string;
  };
}

export default function AdminMatchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gameFilter, setGameFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchMatches();
  }, [session, status, router]);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/admin/matches");
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter matches
  const filteredMatches = matches.filter(match => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        match.name.toLowerCase().includes(searchLower) ||
        match.gameName.toLowerCase().includes(searchLower) ||
        match.id.toLowerCase().includes(searchLower) ||
        match.creator.username.toLowerCase().includes(searchLower) ||
        match.creator.email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (match.status !== statusFilter) return false;
    }

    // Game filter
    if (gameFilter !== "all") {
      if (match.gameName !== gameFilter) return false;
    }

    // Date filter
    if (dateFilter !== "all") {
      const matchDate = new Date(match.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "today" && daysDiff > 0) return false;
      if (dateFilter === "week" && daysDiff > 7) return false;
      if (dateFilter === "month" && daysDiff > 30) return false;
    }

    return true;
  });

  // Get unique games for filter
  const uniqueGames = Array.from(new Set(matches.map(m => m.gameName))).sort();

  // Calculate stats
  const totalPot = filteredMatches.reduce((sum, m) => sum + m.totalPot, 0);
  const completedMatches = filteredMatches.filter(m => m.status === 'completed').length;
  const activeMatches = filteredMatches.filter(m => ['open', 'countdown', 'ready', 'in_progress'].includes(m.status)).length;

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading matches...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">All Matches</h1>
            <p className="text-neutral-400 mt-2">
              View and manage all platform matches
            </p>
          </div>
          <button
            onClick={fetchMatches}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <FiRefreshCw className="text-sm" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Matches</p>
                <p className="text-2xl font-bold text-white">{filteredMatches.length}</p>
              </div>
              <FiAward className="text-2xl text-blue-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Active Matches</p>
                <p className="text-2xl font-bold text-green-400">{activeMatches}</p>
              </div>
              <FiActivity className="text-2xl text-green-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-yellow-400">{completedMatches}</p>
              </div>
              <FiAward className="text-2xl text-yellow-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Pot</p>
                <p className="text-2xl font-bold text-purple-400">${totalPot.toFixed(2)}</p>
              </div>
              <FiDollarSign className="text-2xl text-purple-400" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search matches, games, creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm border border-neutral-600"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="countdown">Countdown</option>
              <option value="ready">Ready</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm border border-neutral-600"
            >
              <option value="all">All Games</option>
              {uniqueGames.map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm border border-neutral-600"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className="text-sm text-neutral-400 mt-4">
            Showing {filteredMatches.length} of {matches.length} matches
          </div>
        </div>

        {/* Matches List */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="p-6 border-b border-neutral-700">
            <h2 className="text-xl font-semibold text-white">
              Matches ({filteredMatches.length})
            </h2>
          </div>
          <div className="divide-y divide-neutral-700 max-h-[600px] overflow-y-auto">
            {filteredMatches.length === 0 ? (
              <div className="p-6 text-center text-neutral-400">
                No matches found
              </div>
            ) : (
              filteredMatches.map((match) => {
                const statusColors: Record<string, string> = {
                  'open': 'bg-green-600 text-white',
                  'countdown': 'bg-orange-600 text-white',
                  'ready': 'bg-yellow-600 text-white',
                  'in_progress': 'bg-blue-600 text-white',
                  'completed': 'bg-neutral-600 text-white',
                  'cancelled': 'bg-red-600 text-white',
                };

                return (
                  <div key={match.id} className="p-6 hover:bg-neutral-750 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white text-lg">{match.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[match.status] || 'bg-neutral-600 text-white'}`}>
                            {match.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded">
                            Match ID: {match.id.slice(0, 8)}...
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-neutral-400 mb-1">Game: <span className="text-white">{match.gameName}</span></p>
                            <p className="text-sm text-neutral-400 mb-1">Platform: <span className="text-white capitalize">{match.platform}</span></p>
                            <p className="text-sm text-neutral-400 mb-1">Mode: <span className="text-white capitalize">{match.gameMode}</span></p>
                            <Link 
                              href={`/admin/users/${match.creator.id}`}
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Creator: {match.creator.displayName || match.creator.username}
                            </Link>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-400 mb-1">
                              Buy-in: <span className="text-white">${match.buyIn.toFixed(2)}</span>
                            </p>
                            <p className="text-sm text-neutral-400 mb-1">
                              Pot: <span className="text-white">${match.totalPot.toFixed(2)}</span>
                            </p>
                            <p className="text-sm text-neutral-400 mb-1">
                              Potential Winnings: <span className="text-green-400">${match.potentialWinnings.toFixed(2)}</span>
                            </p>
                            <p className="text-sm text-neutral-400 mb-1">
                              Players: <span className="text-white">{match.currentPlayers}/{match.maxPlayers}</span>
                            </p>
                          </div>
                        </div>

                        {match.participants.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-neutral-400 mb-2">Participants:</p>
                            <div className="flex flex-wrap gap-2">
                              {match.participants.map((participant) => (
                                <Link
                                  key={participant.id}
                                  href={`/admin/users/${participant.user.id}`}
                                  className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded hover:bg-neutral-600 transition-colors"
                                >
                                  {participant.user.displayName || participant.user.username}
                                  {match.result?.winnerId === participant.user.id && (
                                    <span className="ml-1 text-yellow-400">🏆</span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.result && (
                          <div className="mt-3 p-3 bg-neutral-700 rounded-lg">
                            <p className="text-sm font-semibold text-white mb-1">Result:</p>
                            <p className="text-xs text-neutral-300">
                              Status: {match.result.status} | 
                              Type: {match.result.resultType} | 
                              {match.result.payoutAmount && ` Payout: $${match.result.payoutAmount.toFixed(2)}`}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <Link
                          href={`/matches/${match.id}`}
                          className="block mb-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                          View Match
                        </Link>
                        <div className="text-xs text-neutral-400 mt-2">
                          <TimeFormatter date={match.createdAt} format="date" />
                        </div>
                        <div className="text-xs text-neutral-400">
                          <TimeFormatter date={match.createdAt} format="time" />
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          <TimeFormatter date={match.createdAt} format="relative" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
