"use client";

import { useEffect, useState } from "react";
import { FiUsers, FiActivity, FiDollarSign, FiAward, FiClock, FiAlertTriangle } from "react-icons/fi";
import AdminLayout from "@/components/AdminLayout";
import TimeFormatter from "@/components/TimeFormatter";

interface AdminStats {
  totalUsers: number;
  totalMatches: number;
  totalTransactions: number;
  activeDisputes: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    user?: {
      username: string;
    };
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading admin stats...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-neutral-400 mt-2">Overview of platform statistics and recent activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
              </div>
              <FiUsers className="text-2xl text-blue-400" />
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Matches</p>
                <p className="text-2xl font-bold text-white">{stats?.totalMatches || 0}</p>
              </div>
              <FiAward className="text-2xl text-green-400" />
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{stats?.totalTransactions || 0}</p>
              </div>
              <FiDollarSign className="text-2xl text-yellow-400" />
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Active Disputes</p>
                <p className="text-2xl font-bold text-red-400">{stats?.activeDisputes || 0}</p>
              </div>
              <FiAlertTriangle className="text-2xl text-red-400" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiUsers className="text-lg" />
              User Management
            </a>
            <a
              href="/admin/disputes"
              className="relative flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <FiAlertTriangle className="text-lg" />
              Disputes
              {stats && stats.activeDisputes > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  {stats.activeDisputes}
                </span>
              )}
            </a>
            <a
              href="/admin/activity"
              className="flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <FiActivity className="text-lg" />
              All Activity
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        {stats && stats.recentActivity.length > 0 && (
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiActivity className="text-neutral-400" />
                    <div>
                      <p className="text-white font-medium">
                        {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {activity.user?.username} • {activity.entityType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <FiClock className="text-xs" />
                    <TimeFormatter date={activity.createdAt} format="date" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}