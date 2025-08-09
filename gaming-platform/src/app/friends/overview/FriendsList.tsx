"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiSearch, FiUser } from "react-icons/fi";

export interface FriendUser {
  id: string;
  username: string;
  displayName?: string | null;
  image?: string | null;
}

export default function FriendsList({ users }: { users: FriendUser[] }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<FriendUser[]>(users);
  const [confirmUser, setConfirmUser] = useState<FriendUser | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setItems(users);
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) =>
      (u.displayName || "").toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [query, items]);

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
        // Optional: show an error toast later
        console.error("Failed to remove friend");
      }
    } catch (e) {
      console.error("Error removing friend", e);
    }
    setRemoving(false);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiSearch size={16} /></span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search friends..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/60"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400">No friends match your search</div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((u) => (
            <li key={u.id} className="bg-neutral-950 rounded-lg p-3 sm:p-4 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Link href={`/profile/${u.username}`} className="flex items-center gap-3 sm:gap-4 hover:opacity-90 transition">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-[2px] rounded-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-neutral-950">
                      {u.image ? (
                        <Image src={u.image} alt={u.username} width={48} height={48} className="rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiUser color="#9ca3af" size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{u.displayName || u.username}</div>
                    <div className="text-gray-400 text-sm truncate">@{u.username}</div>
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
          ))}
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