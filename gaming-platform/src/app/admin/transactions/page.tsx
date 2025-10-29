"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiDollarSign, FiSearch, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiGift, FiCreditCard, FiCheckCircle, FiClock, FiXCircle, FiAlertCircle } from "react-icons/fi";
import AdminLayout from "@/components/AdminLayout";
import TimeFormatter from "@/components/TimeFormatter";
import Link from "next/link";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
  };
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchTransactions();
  }, [session, status, router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/admin/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        transaction.type.toLowerCase().includes(searchLower) ||
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.id.toLowerCase().includes(searchLower) ||
        transaction.user.username.toLowerCase().includes(searchLower) ||
        transaction.user.email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Transaction type filter
    if (transactionFilter !== "all") {
      if (transactionFilter === "deposits" && !transaction.type.includes("deposit")) return false;
      if (transactionFilter === "withdrawals" && !transaction.type.includes("withdrawal")) return false;
      if (transactionFilter === "match_related" && !transaction.type.includes("match")) return false;
      if (transactionFilter === "admin" && !transaction.type.includes("admin")) return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (transaction.status !== statusFilter) return false;
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

  // Calculate totals
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const completedAmount = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading transactions...</div>
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
            <h1 className="text-3xl font-bold text-white">All Transactions</h1>
            <p className="text-neutral-400 mt-2">
              View and manage all platform transactions
            </p>
          </div>
          <button
            onClick={fetchTransactions}
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
                <p className="text-neutral-400 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
              </div>
              <FiDollarSign className="text-2xl text-blue-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-white">${totalAmount.toFixed(2)}</p>
              </div>
              <FiTrendingUp className="text-2xl text-green-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {filteredTransactions.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <FiCheckCircle className="text-2xl text-green-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Completed Amount</p>
                <p className="text-2xl font-bold text-green-400">${completedAmount.toFixed(2)}</p>
              </div>
              <FiCreditCard className="text-2xl text-purple-400" />
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
                placeholder="Search transactions, users, IDs..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm border border-neutral-600"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
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
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="p-6 border-b border-neutral-700">
            <h2 className="text-xl font-semibold text-white">
              Transactions ({filteredTransactions.length})
            </h2>
          </div>
          <div className="divide-y divide-neutral-700 max-h-[600px] overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <div className="p-6 text-center text-neutral-400">
                No transactions found
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const isPositive = transaction.type.includes('deposit') || 
                                 transaction.type.includes('payout') || 
                                 transaction.type.includes('refund') ||
                                 transaction.type.includes('admin_deposit');
                const amountColor = isPositive ? 'text-green-400' : 'text-red-400';
                const amountPrefix = isPositive ? '+' : '-';
                
                return (
                  <div key={transaction.id} className="p-6 hover:bg-neutral-750 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-white">
                                {transaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              {getTransactionStatusIcon(transaction.status)}
                              <span className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded">
                                {transaction.status}
                              </span>
                            </div>
                            <Link 
                              href={`/admin/users/${transaction.user.id}`}
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {transaction.user.displayName || transaction.user.username} ({transaction.user.email})
                            </Link>
                            <p className="text-xs text-neutral-500 mt-1">
                              Transaction ID: {transaction.id.slice(0, 8)}...
                            </p>
                            {transaction.description && (
                              <p className="text-xs text-neutral-400 mt-1 break-words">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${amountColor}`}>
                              {amountPrefix}${transaction.amount.toFixed(2)}
                            </p>
                            <div className="text-xs text-neutral-400 mt-1">
                              <TimeFormatter date={transaction.createdAt} format="date" />
                            </div>
                            <div className="text-xs text-neutral-400">
                              <TimeFormatter date={transaction.createdAt} format="time" />
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">
                              <TimeFormatter date={transaction.createdAt} format="relative" />
                            </div>
                          </div>
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
