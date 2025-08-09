"use client";

import { useMemo, useState } from "react";
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.displayName || "").toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  }, [query, users]);

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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 