"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiUser, FiX } from "react-icons/fi";
import AvatarPresence from "@/components/AvatarPresence";

export type SocialListType = "followers" | "following" | "friends";

interface SocialUser {
  id: string;
  username: string;
  displayName?: string | null;
  image?: string | null;
}

export default function SocialListModal({
  isOpen,
  onClose,
  username,
  type,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: SocialListType;
  title?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(username)}/${type}`, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Failed to load ${type}`);
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err: unknown) {
        if ((err as any)?.name === "AbortError") return;
        setError("Failed to load list");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
    return () => controller.abort();
  }, [isOpen, username, type]);

  if (!isOpen) return null;

  const prettyTitle = title || (type === "followers" ? "Followers" : type === "following" ? "Following" : "Friends");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-neutral-900 text-white w-full max-w-md mx-4 rounded-xl border border-neutral-800 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h3 className="text-lg font-semibold">{prettyTitle}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <FiX />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3">
          {loading && <div className="text-center text-gray-400">Loading...</div>}
          {error && <div className="text-center text-red-400">{error}</div>}
          {!loading && !error && users.length === 0 && (
            <div className="text-center text-gray-400">No users found</div>
          )}
          {!loading && !error && users.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.username}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition"
              onClick={onClose}
            >
              <AvatarPresence src={u.image} alt={u.username} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.displayName || u.username}</div>
                <div className="text-xs text-gray-400 truncate">@{u.username}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 