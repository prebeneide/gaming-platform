"use client";
import { useState } from "react";

export default function FollowButton({
  isFollowing: initialIsFollowing,
  username,
  isOwnProfile,
  onFollowChange,
}: {
  isFollowing: boolean;
  username: string;
  isOwnProfile: boolean;
  onFollowChange?: (following: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(initialIsFollowing);

  if (isOwnProfile) return null;

  const handleClick = async () => {
    setLoading(true);
    const method = following ? "DELETE" : "POST";
    await fetch("/api/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
      credentials: "include",
    });
    setFollowing(!following);
    setLoading(false);
    onFollowChange?.(!following);
  };

  return (
    <button
      className={`h-12 px-6 rounded-lg font-semibold text-base flex items-center justify-center transition ${following ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-pink-500 text-white hover:bg-pink-600"}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "..." : following ? "Unfollow" : "Follow"}
    </button>
  );
} 