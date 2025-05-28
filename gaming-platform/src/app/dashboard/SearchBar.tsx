"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search-users?query=${encodeURIComponent(value)}`);
      const users = await res.json();
      setResults(users);
      setShowDropdown(true);
      setLoading(false);
    }, 300);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search for users..."
        className="w-full h-full px-5 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-lg shadow my-0"
        onFocus={() => query.length >= 2 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      {showDropdown && (
        <div className="absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-xl mt-2 shadow-xl max-h-96 overflow-y-auto animate-fade-in">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No users found</div>
          ) : (
            results.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800 transition cursor-pointer border-b border-gray-800 last:border-b-0"
              >
                <Image
                  src={user.image || "/default-avatar.svg"}
                  alt={user.username}
                  width={48}
                  height={48}
                  className="rounded-full aspect-square object-cover w-12 h-12"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{user.displayName || user.username}</div>
                  <div className="text-gray-400 text-sm truncate">@{user.username}</div>
                </div>
                <Link
                  href={`/profile/${user.username}`}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold text-sm transition"
                >
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 