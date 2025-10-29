"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { FiUser, FiActivity, FiMessageSquare, FiDollarSign, FiAward, FiClock, FiRefreshCw, FiPlus, FiMinus, FiTrendingUp, FiTrendingDown, FiCreditCard, FiGift, FiXCircle, FiCheckCircle, FiAlertCircle, FiSearch, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import TimeFormatter from "@/components/TimeFormatter";
import AdminLayout from "@/components/AdminLayout";

interface UserDetails {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  image?: string;
  role: string;
  createdAt: string;
  lastActiveAt?: string;
  discord?: string;
  twitter?: string;
  twitch?: string;
  steam?: string;
  psn?: string;
  xbox?: string;
  wallet?: {
    id: string;
    balance: number;
    currency: string;
  };
  _count: {
    activityLogs: number;
    createdMatches: number;
    matchParticipations: number;
    transactions: number;
    sentMessages: number;
    receivedMessages: number;
    globalMessages: number;
    matchMessages: number;
    followers: number;
    following: number;
    friendRequestsSent: number;
    friendRequestsReceived: number;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  createdAt: string;
}

interface Match {
  id: string;
  name: string;
  gameName: string;
  status: string;
  buyInAmount: number;
  createdAt: string;
  completedAt?: string;
  result?: {
    winnerId?: string;
    payoutAmount?: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  type: 'global' | 'match' | 'private';
  match?: {
    name: string;
    gameName: string;
  };
  recipient?: {
    username: string;
  };
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const resolvedParams = use(params);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activityFilter, setActivityFilter] = useState("all");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferType, setTransferType] = useState<"deposit" | "withdraw">("deposit");
  const [transferReason, setTransferReason] = useState("");
  
  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchUserDetails();
  }, [session, status, router, resolvedParams.id]);

  const fetchUserDetails = async () => {
    try {
      const [userRes, activitiesRes, matchesRes, transactionsRes, messagesRes] = await Promise.all([
        fetch(`/api/admin/users/${resolvedParams.id}`),
        fetch(`/api/admin/users/${resolvedParams.id}/activities`),
        fetch(`/api/admin/users/${resolvedParams.id}/matches`),
        fetch(`/api/admin/users/${resolvedParams.id}/transactions`),
        fetch(`/api/admin/users/${resolvedParams.id}/messages`)
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || []);
      }

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData.matches || []);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions || []);
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setMessages(messagesData.messages || []);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: transferType,
          amount: parseFloat(transferAmount),
          reason: transferReason,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowTransferModal(false);
        setTransferAmount("");
        setTransferReason("");
        await fetchUserDetails(); // Refresh data
        alert(`Transfer successful! New balance: $${data.newBalance.toFixed(2)}`);
      } else {
        const error = await response.json();
        alert(`Transfer failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Error processing transfer:", error);
      alert("Failed to process transfer");
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    
    // Validation
    if (!newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: resolvedParams.id,
          newPassword,
          confirmPassword,
          isAdminAction: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        await fetchUserDetails(); // Refresh data
        alert("Password changed successfully!");
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!session || session.user.role !== "admin" || !user) {
    return null;
  }

  const filteredActivities = activities.filter(activity => {
    if (activityFilter === "all") return true;
    if (activityFilter === "match") return activity.action.includes("match");
    if (activityFilter === "message") return activity.action.includes("message") || activity.action.includes("chat");
    if (activityFilter === "transaction") return activity.action.includes("deposit") || activity.action.includes("withdrawal") || activity.action.includes("payment");
    if (activityFilter === "social") return activity.action.includes("friend") || activity.action.includes("follow");
    if (activityFilter === "profile") return activity.action.includes("profile") || activity.action.includes("preferences");
    return true;
  });

  // Filter transactions with search and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        transaction.type.toLowerCase().includes(searchLower) ||
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.id.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Transaction type filter
    if (transactionFilter !== "all") {
      if (transactionFilter === "deposits" && !transaction.type.includes("deposit")) return false;
      if (transactionFilter === "withdrawals" && !transaction.type.includes("withdrawal")) return false;
      if (transactionFilter === "match_related" && !transaction.type.includes("match")) return false;
      if (transactionFilter === "admin" && !transaction.type.includes("admin")) return false;
    }

    // Date filter
    if (dateFilter !== "all") {
      const transactionDate = new Date(transaction.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "today" && daysDiff > 0) return false;
      if (dateFilter === "week" && daysDiff > 7) return false;
      if (dateFilter === "month" && daysDiff > 30) return false;
    }

    return true;
  });

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    if (type.includes('deposit') || type.includes('payout')) return <FiTrendingUp className="text-green-500" />;
    if (type.includes('withdrawal') || type.includes('payment')) return <FiTrendingDown className="text-red-500" />;
    if (type.includes('refund')) return <FiGift className="text-blue-500" />;
    if (type.includes('admin')) return <FiCreditCard className="text-purple-500" />;
    return <FiDollarSign className="text-neutral-400" />;
  };

  // Get transaction status icon
  const getTransactionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="text-green-500" />;
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'failed': return <FiXCircle className="text-red-500" />;
      default: return <FiAlertCircle className="text-neutral-400" />;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FiUser },
    { id: "activities", label: "Activities", icon: FiActivity },
    { id: "matches", label: "Matches", icon: FiAward },
    { id: "transactions", label: "Transactions", icon: FiDollarSign },
    { id: "messages", label: "Messages", icon: FiMessageSquare },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{user.displayName || user.username}</h1>
            <p className="text-neutral-400 mt-2">User ID: {user.id}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchUserDetails}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <FiRefreshCw className="text-sm" />
              Refresh
            </button>
            <button
              onClick={() => {
                setTransferType("deposit");
                setShowTransferModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <FiPlus className="text-sm" />
              Add Money
            </button>
            <button
              onClick={() => {
                setTransferType("withdraw");
                setShowTransferModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <FiMinus className="text-sm" />
              Remove Money
            </button>
            <button
              onClick={() => {
                setShowPasswordModal(true);
                setPasswordError("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <FiLock className="text-sm" />
              Change Password
            </button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-2">
                <div><span className="text-neutral-400">Username:</span> {user.username}</div>
                <div><span className="text-neutral-400">Email:</span> {user.email}</div>
                <div><span className="text-neutral-400">Role:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    user.role === "admin" ? "bg-purple-600 text-white" : "bg-green-600 text-white"
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div><span className="text-neutral-400">Created:</span> <TimeFormatter date={user.createdAt} /></div>
                {user.lastActiveAt && (
                  <div><span className="text-neutral-400">Last Active:</span> <TimeFormatter date={user.lastActiveAt} /></div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-700 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-neutral-400 text-sm">Activities</p>
                    <p className="text-2xl font-bold text-white">{user._count.activityLogs}</p>
                  </div>
                </div>
                <div className="bg-neutral-700 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-neutral-400 text-sm">Matches</p>
                    <p className="text-2xl font-bold text-white">{user._count.createdMatches}</p>
                  </div>
                </div>
                <div className="bg-neutral-700 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-neutral-400 text-sm">Transactions</p>
                    <p className="text-2xl font-bold text-white">{user._count.transactions}</p>
                  </div>
                </div>
                <div className="bg-neutral-700 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-neutral-400 text-sm">Messages</p>
                    <p className="text-2xl font-bold text-white">{user._count.sentMessages + user._count.receivedMessages}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        {user.wallet && (
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="text-center">
              <p className="text-neutral-400 text-sm">Wallet Balance</p>
              <p className="text-2xl font-bold text-yellow-400">${user.wallet?.balance?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="flex border-b border-neutral-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white border-b-2 border-purple-400"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  <Icon className="text-lg" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">User Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-neutral-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Social Stats</h4>
                    <div className="space-y-1 text-sm">
                      <div>Followers: {user._count.followers}</div>
                      <div>Following: {user._count.following}</div>
                      <div>Friend Requests Sent: {user._count.friendRequestsSent}</div>
                      <div>Friend Requests Received: {user._count.friendRequestsReceived}</div>
                    </div>
                  </div>
                  <div className="bg-neutral-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Match Stats</h4>
                    <div className="space-y-1 text-sm">
                      <div>Created Matches: {user._count.createdMatches}</div>
                      <div>Participated Matches: {user._count.matchParticipations}</div>
                    </div>
                  </div>
                  <div className="bg-neutral-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Communication</h4>
                    <div className="space-y-1 text-sm">
                      <div>Sent Messages: {user._count.sentMessages}</div>
                      <div>Received Messages: {user._count.receivedMessages}</div>
                      <div>Global Messages: {user._count.globalMessages}</div>
                      <div>Match Messages: {user._count.matchMessages}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activities" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Activity Log</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Showing {filteredActivities.length} of {activities.length} activities
                    </p>
                  </div>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm border border-neutral-600"
                  >
                    <option value="all">All Activities</option>
                    <option value="match">Match Activities</option>
                    <option value="message">Messages</option>
                    <option value="transaction">Transactions</option>
                    <option value="social">Social Activities</option>
                    <option value="profile">Profile Changes</option>
                  </select>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredActivities.map((activity) => {
                    const actionType = activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const iconMap: Record<string, string> = {
                      'Match Created': 'text-green-500',
                      'Match Joined': 'text-blue-500',
                      'Match Left': 'text-red-500',
                      'Match Ready Status Changed': 'text-yellow-500',
                      'Match Result Reported': 'text-purple-500',
                      'Friend Request Sent': 'text-blue-500',
                      'Follow User': 'text-green-500',
                      'Unfollow User': 'text-red-500',
                      'Profile Updated': 'text-blue-500',
                      'Preferences Updated': 'text-purple-500',
                      'Deposit Initiated': 'text-green-500',
                      'Withdrawal Initiated': 'text-red-500',
                      'Buy In Paid': 'text-orange-500',
                      'Global Chat Message': 'text-blue-500',
                      'Match Chat Message': 'text-purple-500',
                    };
                    const iconColor = iconMap[actionType] || 'text-neutral-400';

                    return (
                      <div key={activity.id} className="bg-neutral-700 rounded-lg p-4 hover:bg-neutral-650 border border-transparent hover:border-neutral-600 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 ${iconColor}`}>
                            <FiActivity className="text-lg" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-white">{actionType}</p>
                                  <span className="text-xs bg-neutral-600 text-neutral-300 px-2 py-1 rounded">
                                    Activity ID: {activity.id.slice(0, 8)}...
                                  </span>
                                </div>
                                {activity.entityType && (
                                  <p className="text-sm text-neutral-400 mt-1">
                                    {activity.entityType} {activity.entityId && `#${activity.entityId.slice(0, 8)}`}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-neutral-300">
                                  <TimeFormatter date={activity.createdAt} format="date" />
                                </div>
                                <div className="text-sm text-neutral-300">
                                  <TimeFormatter date={activity.createdAt} format="time" />
                                </div>
                                <div className="text-xs text-neutral-500 mt-1">
                                  <TimeFormatter date={activity.createdAt} format="relative" />
                                </div>
                              </div>
                            </div>
                            {activity.details && typeof activity.details === 'object' && (
                              <div className="mt-3 bg-neutral-800 rounded p-3 text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {Object.entries(activity.details as Record<string, any>).map(([key, value]) => {
                                    if (typeof value === 'object') return null;
                                    return (
                                      <div key={key} className="flex items-start gap-2">
                                        <span className="text-neutral-400 capitalize font-medium min-w-0 flex-shrink-0">
                                          {key.replace(/([A-Z])/g, ' $1')}:
                                        </span>
                                        <span className="text-neutral-200 break-words">{String(value)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "matches" && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">Match History</h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    Showing {matches.length} matches
                  </p>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {matches.map((match) => (
                    <div key={match.id} className="bg-neutral-700 rounded-lg p-4 hover:bg-neutral-650 border border-transparent hover:border-neutral-600 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-white">{match.name}</p>
                            <span className="text-xs bg-neutral-600 text-neutral-300 px-2 py-1 rounded">
                              Match ID: {match.id.slice(0, 8)}...
                            </span>
                          </div>
                          <p className="text-sm text-neutral-400 mb-1">
                            Game: {match.gameName}
                          </p>
                          <p className="text-sm text-neutral-400 mb-1">
                            Buy-in: ${match.buyInAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-neutral-400 mb-2">
                            Status: <span className="capitalize">{match.status}</span>
                          </p>
                          {match.result && (
                            <div className="mt-2 p-2 bg-neutral-800 rounded text-xs">
                              <p className="text-neutral-300">
                                Winner: {match.result.winnerId ? match.result.winnerId.slice(0, 8) + '...' : 'N/A'}
                              </p>
                              <p className="text-neutral-300">
                                Payout: ${match.result.payoutAmount?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-neutral-300">
                            <TimeFormatter date={match.createdAt} format="date" />
                          </div>
                          <div className="text-sm text-neutral-300">
                            <TimeFormatter date={match.createdAt} format="time" />
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            <TimeFormatter date={match.createdAt} format="relative" />
                          </div>
                          {match.completedAt && (
                            <div className="text-xs text-neutral-500 mt-2">
                              Completed: <TimeFormatter date={match.completedAt} format="date" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                {/* Search and Filter Controls */}
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <select
                      value={transactionFilter}
                      onChange={(e) => setTransactionFilter(e.target.value)}
                      className="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm border border-neutral-600"
                    >
                      <option value="all">All Types</option>
                      <option value="deposits">Deposits</option>
                      <option value="withdrawals">Withdrawals</option>
                      <option value="match_related">Match Related</option>
                      <option value="admin">Admin Actions</option>
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
                  <div className="text-sm text-neutral-400">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTransactions.map((transaction) => {
                    const isPositive = transaction.type.includes('deposit') || 
                                     transaction.type.includes('payout') || 
                                     transaction.type.includes('refund') ||
                                     transaction.type.includes('admin_deposit');
                    const amountColor = isPositive ? 'text-green-400' : 'text-red-400';
                    const amountPrefix = isPositive ? '+' : '-';
                    
                    return (
                      <div key={transaction.id} className="bg-neutral-700 rounded-lg p-4 hover:bg-neutral-650 border border-transparent hover:border-neutral-600 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-white">
                                    {transaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </p>
                                  {getTransactionStatusIcon(transaction.status)}
                                </div>
                                <p className="text-sm text-neutral-400 mt-1">
                                  Transaction ID: {transaction.id.slice(0, 8)}...
                                </p>
                                {transaction.description && (
                                  <p className="text-xs text-neutral-500 mt-1 break-words">
                                    {transaction.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${amountColor}`}>
                                  {amountPrefix}${transaction.amount.toFixed(2)}
                                </p>
                                <div className="text-xs text-neutral-500 mt-1">
                                  <TimeFormatter date={transaction.createdAt} format="date" />
                                </div>
                                <div className="text-xs text-neutral-500">
                                  <TimeFormatter date={transaction.createdAt} format="time" />
                                </div>
                                <div className="text-xs text-neutral-600 mt-1">
                                  <TimeFormatter date={transaction.createdAt} format="relative" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">Message History</h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    Showing {messages.length} messages
                  </p>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div key={message.id} className="bg-neutral-700 rounded-lg p-4 hover:bg-neutral-650 border border-transparent hover:border-neutral-600 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-white capitalize">{message.type} Message</p>
                            <span className="text-xs bg-neutral-600 text-neutral-300 px-2 py-1 rounded">
                              Message ID: {message.id.slice(0, 8)}...
                            </span>
                          </div>
                          <p className="text-sm text-neutral-300 mb-2 break-words">{message.content}</p>
                          {message.match && (
                            <div className="mt-2 p-2 bg-neutral-800 rounded text-xs">
                              <p className="text-neutral-300">
                                Match: {message.match.name} ({message.match.gameName})
                              </p>
                            </div>
                          )}
                          {message.recipient && (
                            <div className="mt-2 p-2 bg-neutral-800 rounded text-xs">
                              <p className="text-neutral-300">
                                To: {message.recipient.username}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-neutral-300">
                            <TimeFormatter date={message.createdAt} format="date" />
                          </div>
                          <div className="text-sm text-neutral-300">
                            <TimeFormatter date={message.createdAt} format="time" />
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            <TimeFormatter date={message.createdAt} format="relative" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-lg p-6 w-full max-w-md border border-neutral-700">
              <h3 className="text-xl font-bold mb-4">
                {transferType === "deposit" ? "Add Money" : "Remove Money"}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <textarea
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    rows={3}
                    placeholder="Reason for this transfer..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleTransfer}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      transferType === "deposit"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {transferType === "deposit" ? "Add Money" : "Remove Money"}
                  </button>
                  <button
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferAmount("");
                      setTransferReason("");
                    }}
                    className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-lg p-6 w-full max-w-md border border-neutral-700">
              <h3 className="text-xl font-bold mb-4 text-white">
                Change Password for {user.displayName || user.username}
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-neutral-400 mb-4">
                  As admin, you can reset this user's password. They will need to log in with the new password.
                </p>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      className={`w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500 pr-10 ${
                        passwordError ? "border-red-500" : ""
                      }`}
                      placeholder="Enter new password (min. 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showNewPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-yellow-400 text-xs mt-1">Password must be at least 8 characters</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                      }}
                      className={`w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500 pr-10 ${
                        passwordError ? "border-red-500" : ""
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-yellow-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                {passwordError && (
                  <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{passwordError}</p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError("");
                    }}
                    className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}