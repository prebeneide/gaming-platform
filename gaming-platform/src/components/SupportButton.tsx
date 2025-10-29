"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import SupportChat from "./SupportChat";

export default function SupportButton() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    // Fetch unread support messages count
    async function fetchUnreadCount() {
      try {
        const response = await fetch("/api/support/unread-count");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    }

    fetchUnreadCount();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    
    return () => clearInterval(interval);
  }, [session]);

  if (!session?.user) return null;

  return (
    <>
      {/* Support Button - Fixed bottom left */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
        aria-label="Support"
      >
        <FiMessageCircle className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Support Chat Window */}
      {isOpen && (
        <SupportChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
