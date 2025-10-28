"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { FiUser, FiActivity, FiMessageSquare, FiDollarSign, FiAward, FiClock, FiArrowLeft, FiFilter, FiRefreshCw, FiPlus, FiMinus, FiWallet } from "react-icons/fi";
import Link from "next/link";
import TimeFormatter from "@/components/TimeFormatter";

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
  ipAddress?: string;
  userAgent?: string;
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
    if (!transferAmount || !transferReason) {
      alert("Please fill in all fields");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: transferType,
          amount,
          reason: transferReason
        }),
      });

      if (response.ok) {
        alert("Transfer completed successfully!");
        setShowTransferModal(false);
        setTransferAmount("");
        setTransferReason("");
        fetchUserDetails(); // Refresh user data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error processing transfer:", error);
      alert("Failed to process transfer");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin" || !user) {
    return null;
  }

  const filteredActivities = activities.filter(activity => {
    if (activityFilter === "all") return true;
    return activity.action.includes(activityFilter);
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: FiUser },
    { id: "activities", label: "Activities", icon: FiActivity },
    { id: "matches", label: "Matches", icon: FiAward },
    { id: "transactions", label: "Transactions", icon: FiDollarSign },
    { id: "messages", label: "Messages", icon: FiMessageSquare },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/users"
              className="flex items-center gap-2 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
            >
              <FiArrowLeft className="text-sm" />
              Back to Users
            </Link>
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
            </div>
          </div>
          <h1 className="text-3xl font-bold">{user.displayName || user.username}</h1>
          <p className="text-neutral-400">User ID: {user.id}</p>
        </div>

        {/* User Info Card */}
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-2">
                <div><span className="text-neutral-400">Username:</span> {user.username}</div>
                <div><span className="text-neutral-400">Email:</span> {user.email}</div>
                <div><span className="text-neutral-400">Role:</span> 
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === "admin" 
                      ? "bg-red-100 text-red-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div><span className="text-neutral-400">Created:</span> <TimeFormatter date={user.createdAt} /></div>
                <div><span className="text-neutral-400">Last Active:</span> 
                  {user.lastActiveAt ? <TimeFormatter date={user.lastActiveAt} format="relative" /> : "Never"}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Social Links</h3>
              <div className="space-y-2">
                {user.discord && <div><span className="text-neutral-400">Discord:</span> {user.discord}</div>}
                {user.twitter && <div><span className="text-neutral-400">Twitter:</span> {user.twitter}</div>}
                {user.twitch && <div><span className="text-neutral-400">Twitch:</span> {user.twitch}</div>}
                {user.steam && <div><span className="text-neutral-400">Steam:</span> {user.steam}</div>}
                {user.psn && <div><span className="text-neutral-400">PSN:</span> {user.psn}</div>}
                {user.xbox && <div><span className="text-neutral-400">Xbox:</span> {user.xbox}</div>}
              </div>
            </div>
          </div>
          {user.bio && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Bio</h3>
              <p className="text-neutral-300">{user.bio}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="text-center">
              <p className="text-neutral-400 text-sm">Activities</p>
              <p className="text-2xl font-bold text-blue-400">{user._count.activityLogs}</p>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="text-center">
              <p className="text-neutral-400 text-sm">Matches</p>
              <p className="text-2xl font-bold text-green-400">{user._count.matchParticipations}</p>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="text-center">
              <p className="text-neutral-400 text-sm">Messages</p>
              <p className="text-2xl font-bold text-purple-400">{user._count.sentMessages + user._count.globalMessages + user._count.matchMessages}</p>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="text-center">
              <p className="text-neutral-400 text-sm">Transactions</p>
              <p className="text-2xl font-bold text-orange-400">{user._count.transactions}</p>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="text-center">
              <p className="text-neutral-400 text-sm">Wallet Balance</p>
              <p className="text-2xl font-bold text-yellow-400">${user.wallet?.balance?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="border-b border-neutral-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-purple-500 text-purple-400"
                        : "border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-300"
                    }`}
                  >
                    <Icon className="text-sm" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Social Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-neutral-700 rounded-lg p-4 text-center">
                      <p className="text-neutral-400 text-sm">Followers</p>
                      <p className="text-xl font-bold text-blue-400">{user._count.followers}</p>
                    </div>
                    <div className="bg-neutral-700 rounded-lg p-4 text-center">
                      <p className="text-neutral-400 text-sm">Following</p>
                      <p className="text-xl font-bold text-green-400">{user._count.following}</p>
                    </div>
                    <div className="bg-neutral-700 rounded-lg p-4 text-center">
                      <p className="text-neutral-400 text-sm">Friends Sent</p>
                      <p className="text-xl font-bold text-purple-400">{user._count.friendRequestsSent}</p>
                    </div>
                    <div className="bg-neutral-700 rounded-lg p-4 text-center">
                      <p className="text-neutral-400 text-sm">Friends Received</p>
                      <p className="text-xl font-bold text-orange-400">{user._count.friendRequestsReceived}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activities" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Activity Log</h3>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="bg-neutral-700 text-white px-3 py-1 rounded-lg text-sm"
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
                                <p className="font-medium text-white">{actionType}</p>
                                {activity.entityType && (
                                  <p className="text-sm text-neutral-400">
                                    {activity.entityType} {activity.entityId && `#${activity.entityId.slice(0, 8)}`}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <TimeFormatter date={activity.createdAt} format="time" />
                                <p className="text-xs text-neutral-500">
                                  <TimeFormatter date={activity.createdAt} format="relative" />
                                </p>
                              </div>
                            </div>
                            {activity.details && typeof activity.details === 'object' && (
                              <div className="mt-3 bg-neutral-800 rounded p-3 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(activity.details as Record<string, any>).map(([key, value]) => {
                                    if (typeof value === 'object') return null;
                                    return (
                                      <div key={key}>
                                        <span className="text-neutral-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                                        <span className="text-neutral-200">{String(value)}</span>
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
                <h3 className="text-lg font-semibold mb-4">Match History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {matches.map((match) => (
                    <div key={match.id} className="bg-neutral-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{match.name}</p>
                          <p className="text-sm text-neutral-400">{match.gameName}</p>
                          <p className="text-xs text-neutral-500">
                            Buy-in: ${match.buyInAmount} • Status: {match.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <TimeFormatter date={match.createdAt} format="time" />
                          <p className="text-xs text-neutral-500">
                            <TimeFormatter date={match.createdAt} format="relative" />
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => {
                    const isPositive = transaction.type.includes('deposit') || 
                                     transaction.type.includes('payout') || 
                                     transaction.type.includes('refund') ||
                                     transaction.type.includes('admin_deposit');
                    const amountColor = isPositive ? 'text-green-400' : 'text-red-400';
                    const amountPrefix = isPositive ? '+' : '-';
                    
                    return (
                      <div key={transaction.id} className="bg-neutral-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{transaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                            <p className="text-sm text-neutral-400">
                              {transaction.status}
                            </p>
                            {transaction.description && (
                              <p className="text-xs text-neutral-500">{transaction.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${amountColor}`}>
                              {amountPrefix}${transaction.amount.toFixed(2)}
                            </p>
                            <TimeFormatter date={transaction.createdAt} format="time" />
                            <p className="text-xs text-neutral-500">
                              <TimeFormatter date={transaction.createdAt} format="relative" />
                            </p>
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
                <h3 className="text-lg font-semibold mb-4">Message History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div key={message.id} className="bg-neutral-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{message.type} message</p>
                          <p className="text-sm text-neutral-400">{message.content}</p>
                          {message.match && (
                            <p className="text-xs text-neutral-500">
                              Match: {message.match.name} ({message.match.gameName})
                            </p>
                          )}
                          {message.recipient && (
                            <p className="text-xs text-neutral-500">
                              To: {message.recipient.username}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <TimeFormatter date={message.createdAt} format="time" />
                          <p className="text-xs text-neutral-500">
                            <TimeFormatter date={message.createdAt} format="relative" />
                          </p>
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
      </div>
    </div>
  );
}
