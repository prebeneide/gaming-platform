"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FriendRequestActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">("pending");
  const router = useRouter();

  const handleAction = async (action: "accept" | "reject") => {
    setLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
        credentials: "include",
      });
      
      if (response.ok) {
        setStatus(action === "accept" ? "accepted" : "rejected");
        // Oppdater siden umiddelbart
        router.refresh();
      } else {
        console.error("Failed to handle friend request");
      }
    } catch (error) {
      console.error("Error handling friend request:", error);
    }
    setLoading(false);
  };

  if (status !== "pending") {
    return (
      <div className="text-gray-400">
        {status === "accepted" ? "Accepted" : "Rejected"}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      <button
        onClick={() => handleAction("accept")}
        disabled={loading}
        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition disabled:opacity-50 flex-1 sm:flex-none"
      >
        {loading ? "..." : "Accept"}
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading}
        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 flex-1 sm:flex-none"
      >
        {loading ? "..." : "Reject"}
      </button>
    </div>
  );
} 