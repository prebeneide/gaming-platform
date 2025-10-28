"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiUsers, FiActivity, FiDollarSign, FiAward, FiClock, FiAlertTriangle } from "react-icons/fi";

interface AdminStats {
  totalUsers: number;
  totalMatches: number;
  totalTransactions: number;
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchAdminStats();
  }, [session, status, router]);

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-neutral-400">Overview of platform activity and statistics</p>
            </div>
            <div className="flex gap-3">
              <a
                href="/admin/users"
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <FiUsers className="text-lg" />
                User Management
              </a>
              <a
                href="/admin/disputes"
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <FiAlertTriangle className="text-lg" />
                Disputes
              </a>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-pink-400">{stats?.totalUsers || 0}</p>
              </div>
              <FiUsers className="text-2xl text-pink-400" />
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Matches</p>
                <p className="text-2xl font-bold text-green-400">{stats?.totalMatches || 0}</p>
              </div>
              <FiAward className="text-2xl text-green-400" />
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Transactions</p>
                <p className="text-2xl font-bold text-blue-400">{stats?.totalTransactions || 0}</p>
              </div>
              <FiDollarSign className="text-2xl text-blue-400" />
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Recent Activity</p>
                <p className="text-2xl font-bold text-orange-400">{stats?.recentActivity?.length || 0}</p>
              </div>
              <FiActivity className="text-2xl text-orange-400" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiClock className="text-orange-400" />
            Recent Activity
          </h2>
          
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-neutral-400">
                      {activity.entityType} • {activity.user?.username || "System"}
                    </p>
                  </div>
                  <div className="text-sm text-neutral-400">
                    {new Date(activity.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
