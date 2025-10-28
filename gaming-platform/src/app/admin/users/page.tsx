"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiUsers, FiSearch, FiEye, FiFilter, FiRefreshCw, FiUser } from "react-icons/fi";
import Link from "next/link";
import TimeFormatter from "@/components/TimeFormatter";
import AdminLayout from "@/components/AdminLayout";

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
    globalMessages: number;
    matchMessages: number;
  };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "username" | "lastActiveAt" | "activityCount">("createdAt");
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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading users...</div>
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
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-neutral-400 mt-2">Manage and monitor all platform users</p>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <FiRefreshCw className="text-sm" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <p className="text-neutral-400 text-sm">Regular Users</p>
                <p className="text-2xl font-bold text-green-400">{users.filter(u => u.role === "user").length}</p>
              </div>
              <FiUser className="text-2xl text-green-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Admins</p>
                <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === "admin").length}</p>
              </div>
              <FiUser className="text-2xl text-purple-400" />
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Active Today</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {users.filter(u => {
                    if (!u.lastActiveAt) return false;
                    const lastActive = new Date(u.lastActiveAt);
                    const today = new Date();
                    return lastActive.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <FiUser className="text-2xl text-yellow-400" />
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm border border-neutral-600"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm border border-neutral-600"
            >
              <option value="createdAt">Sort by Created</option>
              <option value="username">Sort by Username</option>
              <option value="lastActiveAt">Sort by Last Active</option>
              <option value="activityCount">Sort by Activity</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
            >
              <FiFilter className="text-sm" />
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700">
          <div className="p-6 border-b border-neutral-700">
            <h2 className="text-xl font-semibold text-white">
              Users ({filteredUsers.length})
            </h2>
          </div>
          <div className="divide-y divide-neutral-700">
            {filteredUsers.map((user) => (
              <Link href={`/admin/users/${user.id}`} key={user.id}>
                <div className="p-6 hover:bg-neutral-750 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white text-lg">
                          {user.username}
                          {user.displayName && (
                            <span className="text-neutral-400 ml-2">({user.displayName})</span>
                          )}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === "admin" 
                            ? "bg-purple-600 text-white" 
                            : "bg-green-600 text-white"
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-neutral-400 mb-2">{user.email}</p>
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span>Activities: {user._count.activityLogs}</span>
                        <span>Matches: {user._count.createdMatches}</span>
                        <span>Transactions: {user._count.transactions}</span>
                        <span>Messages: {user._count.sentMessages + user._count.receivedMessages}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-400 mb-1">
                        Created: <TimeFormatter date={user.createdAt} />
                      </p>
                      {user.lastActiveAt && (
                        <p className="text-sm text-neutral-500">
                          Last active: <TimeFormatter date={user.lastActiveAt} />
                        </p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-xs">
                          <FiEye className="text-xs" />
                          View Details
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}