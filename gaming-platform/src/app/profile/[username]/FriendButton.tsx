"use client";
import { useState } from "react";

export default function FriendButton({
  username,
  isOwnProfile,
  isFriend,
}: {
  username: string;
  isOwnProfile: boolean;
  isFriend: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (isOwnProfile || isFriend) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });
      setSent(true);
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
    setLoading(false);
  };

  return (
    <button
      className={`h-12 px-6 rounded-lg font-semibold text-base flex items-center justify-center transition ${
        sent
          ? "bg-gray-700 text-white cursor-not-allowed"
          : "bg-pink-500 text-white hover:bg-pink-600"
      }`}
      onClick={handleClick}
      disabled={loading || sent}
    >
      {loading ? "..." : sent ? "Request Sent" : "Add Friend"}
    </button>
  );
} 