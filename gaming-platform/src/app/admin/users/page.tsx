"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiUsers, FiSearch, FiEye, FiFilter, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";
import TimeFormatter from "@/components/TimeFormatter";

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  createdAt: string;
  lastActiveAt?: string;
  _count: {
    activityLogs: number;
    createdMatches: number;
    matchParticipations: number;
    transactions: number;
    sentMessages: number;
    receivedMessages: number;
  };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "username":
          aValue = a.username;
          bValue = b.username;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "lastActiveAt":
          aValue = a.lastActiveAt ? new Date(a.lastActiveAt) : new Date(0);
          bValue = b.lastActiveAt ? new Date(b.lastActiveAt) : new Date(0);
          break;
        case "activityCount":
          aValue = a._count.activityLogs;
          bValue = b._count.activityLogs;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">User Management</h1>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <FiRefreshCw className="text-sm" />
              Refresh
            </button>
          </div>
          <p className="text-neutral-400">Manage and monitor all platform users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-blue-400">{users.length}</p>
              </div>
              <FiUsers className="text-2xl text-blue-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Admins</p>
                <p className="text-2xl font-bold text-red-400">{users.filter(u => u.role === "admin").length}</p>
              </div>
              <FiUsers className="text-2xl text-red-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Active Today</p>
                <p className="text-2xl font-bold text-green-400">
                  {users.filter(u => u.lastActiveAt && new Date(u.lastActiveAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <FiUsers className="text-2xl text-green-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">New This Week</p>
                <p className="text-2xl font-bold text-purple-400">
                  {users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <FiUsers className="text-2xl text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Username, email, or display name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-700 text-white px-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="lastActiveAt">Last Active</option>
                <option value="username">Username</option>
                <option value="activityCount">Activity Count</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="w-full bg-neutral-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Matches</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Messages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{user.displayName || user.username}</div>
                        <div className="text-sm text-neutral-400">{user.email}</div>
                        <div className="text-xs text-neutral-500">ID: {user.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === "admin" 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-300">
                      {user._count.activityLogs} activities
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-300">
                      {user._count.createdMatches} created, {user._count.matchParticipations} joined
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-300">
                      {user._count.sentMessages} sent, {user._count.receivedMessages} received
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-300">
                      {user.lastActiveAt ? (
                        <TimeFormatter date={user.lastActiveAt} format="relative" />
                      ) : (
                        "Never"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <FiEye className="text-xs" />
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-neutral-400">
            No users found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
