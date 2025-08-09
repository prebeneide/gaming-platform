"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiSearch, FiUser } from "react-icons/fi";
import AvatarPresence, { PresenceStatus } from "@/components/AvatarPresence";

export interface FriendUser {
  id: string;
  username: string;
  displayName?: string | null;
  image?: string | null;
  addedAt?: string; // ISO date string
  isOnline?: boolean;
  lastActiveAt?: string; // ISO
}

function presenceFrom({ isOnline, lastActiveAt }: { isOnline?: boolean; lastActiveAt?: string }): PresenceStatus | undefined {
  if (isOnline) return "online";
  if (!lastActiveAt) return "offline";
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  // recent = within 2 hours
  if (diff <= 2 * 60 * 60 * 1000) return "recent";
  return "offline";
}

function timeAgo(iso?: string) {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return "just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type SortMode = "az" | "recent";

type Tab = "all" | "recently" | "online";

export default function FriendsList({ users }: { users: FriendUser[] }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<FriendUser[]>(users);
  const [confirmUser, setConfirmUser] = useState<FriendUser | null>(null);
  const [removing, setRemoving] = useState(false);
  const [sort, setSort] = useState<SortMode>("recent");
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    setItems(users);
  }, [users]);

  const onlineCount = useMemo(() => items.filter(u => u.isOnline).length, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = items;
    if (tab === "recently") {
      const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
      list = list.filter((u) => (u.addedAt ? new Date(u.addedAt).getTime() >= cutoff : true));
    } else if (tab === "online") {
      list = list.filter((u) => u.isOnline);
    }

    if (q) {
      list = list.filter(
        (u) => (u.displayName || "").toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
      );
    }

    if (sort === "az") {
      list = [...list].sort((a, b) =>
        (a.displayName || a.username).localeCompare(b.displayName || b.username, undefined, {
          sensitivity: "base",
        })
      );
    } else {
      list = [...list].sort((a, b) => (new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime()));
    }

    return list;
  }, [query, items, sort, tab]);

  const handleRemove = async () => {
    if (!confirmUser) return;
    setRemoving(true);
    try {
      const res = await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: confirmUser.username }),
        credentials: "include",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((u) => u.username !== confirmUser.username));
        setConfirmUser(null);
      } else {
        console.error("Failed to remove friend");
      }
    } catch (e) {
      console.error("Error removing friend", e);
    }
    setRemoving(false);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          {([
            { key: "all", label: "All" },
            { key: "recently", label: "Recently added" },
            { key: "online", label: `Online (${onlineCount})` },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition whitespace-nowrap ${
                tab === t.key ? "bg-pink-500 text-white" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + sort */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiSearch size={16} /></span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/60"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"
          >
            <option value="recent">Recently added</option>
            <option value="az">A–Z</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400">No friends match your filters</div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((u) => {
            const status = presenceFrom({ isOnline: u.isOnline, lastActiveAt: u.lastActiveAt });
            return (
              <li key={u.id} className="bg-neutral-950 rounded-lg p-3 sm:p-4 border border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Link href={`/profile/${u.username}`} className="flex items-center gap-3 sm:gap-4 hover:opacity-90 transition">
                    <AvatarPresence src={u.image || undefined} alt={u.username} size={48} status={status} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{u.displayName || u.username}</div>
                      <div className="text-gray-400 text-sm truncate">@{u.username}</div>
                      {status !== "online" && u.lastActiveAt && (
                        <div className="text-gray-500 text-xs mt-0.5">Recently active {timeAgo(u.lastActiveAt)}</div>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Link
                      href={`/chat/${u.username}`}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition flex-1 sm:flex-none text-center"
                    >
                      Message
                    </Link>
                    <button
                      onClick={() => setConfirmUser(u)}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition flex-1 sm:flex-none"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Remove confirmation modal */}
      {confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => !removing && setConfirmUser(null)} />
          <div className="relative bg-neutral-900 text-white w-full max-w-sm mx-4 rounded-xl border border-neutral-800 shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-2">Remove friend</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to remove <span className="text-pink-400 font-semibold">@{confirmUser.username}</span> as a friend?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmUser(null)}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition disabled:opacity-50"
                disabled={removing}
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                disabled={removing}
              >
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 