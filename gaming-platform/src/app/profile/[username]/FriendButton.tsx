"use client";
import { useState, useEffect } from "react";

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
  const [checking, setChecking] = useState(true);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Sjekk om det allerede finnes en friend request
  useEffect(() => {
    const checkExistingRequest = async () => {
      try {
        const response = await fetch('/api/friends');
        if (response.ok) {
          const requests = await response.json();
          const existingRequest = requests.find((req: any) => 
            (req.from?.username === username || req.to?.username === username) && 
            req.status === 'pending'
          );
          if (existingRequest) {
            setSent(true);
          }
        }
      } catch (error) {
        console.error('Error checking existing friend request:', error);
      } finally {
        setChecking(false);
      }
    };

    // Hvis det er egen profil, ikke sjekk friend requests
    if (isOwnProfile) {
      setChecking(false);
      return;
    }

    // Hvis de allerede er venner, ikke sjekk friend requests
    if (isFriend) {
      setChecking(false);
      return;
    }

    // Sjekk eksisterende friend requests
    checkExistingRequest();
  }, [username, isOwnProfile, isFriend]);

  if (isOwnProfile) return null;

  const handleClick = async () => {
    if (isFriend) {
      setShowRemoveConfirm(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });
      
      if (response.ok) {
        setSent(true);
        console.log("Friend request sent successfully");
      } else {
        const errorData = await response.json();
        console.error("Failed to send friend request:", errorData.error);
        alert(errorData.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleRemoveFriend = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/friends/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });
      
      if (response.ok) {
        // Oppdater siden for å reflektere endringen
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error("Failed to remove friend:", errorData.error);
        alert(errorData.error || "Failed to remove friend");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      alert("Network error. Please try again.");
    }
    setLoading(false);
    setShowRemoveConfirm(false);
  };



  if (checking) {
    return (
      <button
        className="h-12 px-6 rounded-lg font-semibold text-base flex items-center justify-center transition bg-gray-700 text-white cursor-not-allowed"
        disabled
      >
        Loading...
      </button>
    );
  }



  return (
    <>
      <button
        className={`h-12 px-6 rounded-lg font-semibold text-base flex items-center justify-center transition ${
          isFriend
            ? "bg-green-600 text-white hover:bg-green-700"
            : sent
            ? "bg-gray-700 text-white cursor-not-allowed"
            : "bg-pink-500 text-white hover:bg-pink-600"
        }`}
        onClick={handleClick}
        disabled={loading || (sent && !isFriend)}
      >
        {loading ? "..." : isFriend ? "Friends ✓" : sent ? "Request Sent" : "Add Friend"}
      </button>

      {/* Remove Friend Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-lg p-6 max-w-md mx-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Remove Friend
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to remove <span className="text-pink-400 font-semibold">@{username}</span> as a friend? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveFriend}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Removing..." : "Remove Friend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 