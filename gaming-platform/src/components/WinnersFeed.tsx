"use client";

import { useState, useEffect, useRef } from "react";
import { FaTrophy } from "react-icons/fa";
import UserAvatar from "@/components/UserAvatar";
import TimeFormatter from "@/components/TimeFormatter";
import io from "socket.io-client";

interface Winner {
  id: string;
  username: string;
  displayName: string;
  image: string | null;
  amount: number;
  matchName: string;
  gameName: string;
  wonAt: Date;
}

export default function WinnersFeed() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Initial load
    fetchRecentWinners();

    // Connect to Socket.IO for live updates
    socketRef.current = io("http://localhost:4000");
    
    socketRef.current.on("match completed", (data: any) => {
      // Add the new winner to the top of the list
      if (data.winner) {
        setWinners(prev => [data.winner, ...prev.slice(0, 19)]);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchRecentWinners = async () => {
    try {
      const response = await fetch('/api/dashboard/recent-winners');
      if (response.ok) {
        const data = await response.json();
        setWinners(data.winners || []);
      }
    } catch (error) {
      console.error('Error fetching recent winners:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaTrophy className="text-yellow-400 text-xl" />
            <h3 className="font-bold text-lg text-white">Recent Winners</h3>
          </div>
          <div className="text-sm text-gray-400">Loading winners...</div>
        </div>
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaTrophy className="text-yellow-400 text-xl" />
            <h3 className="font-bold text-lg text-white">Recent Winners</h3>
          </div>
          <div className="text-sm text-gray-400">No recent winners yet</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <FaTrophy className="text-yellow-400 text-xl" />
          <h3 className="font-bold text-lg text-white">Recent Winners</h3>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {winners.map((winner) => (
            <div 
              key={winner.id} 
              className="flex items-center gap-3 p-2 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition"
            >
              <UserAvatar
                user={{
                  image: winner.image,
                  username: winner.username,
                  displayName: winner.displayName
                }}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">
                  {winner.displayName || winner.username} won ${winner.amount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {winner.matchName} • <TimeFormatter date={winner.wonAt} format="relative" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

