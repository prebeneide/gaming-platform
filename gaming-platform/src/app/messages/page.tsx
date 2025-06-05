"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";

type Conversation = {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName?: string;
    image?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  };
};

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchConversations();
    }
  }, [session]);

  // Filtrer samtaler basert på søk og ekskluder samtaler med seg selv
  const filteredConversations = conversations.filter(conv => 
    conv.otherUser.id !== session?.user?.id && (
      conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.otherUser.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    )
  );

  // Formater tidspunkt for siste melding
  function formatLastMessageTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (isYesterday) {
      return "I går";
    }
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  }

  // Forkort meldingstekst hvis den er for lang
  function truncateMessage(content: string, maxLength = 50) {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Meldinger</h1>
          {/* Søkefelt */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Søk etter samtaler..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Samtaler */}
      <div className="max-w-2xl mx-auto px-4 py-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {searchQuery ? "Ingen samtaler funnet" : "Ingen meldinger ennå"}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.otherUser.username}`}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors group"
              >
                {/* Profilbilde */}
                <div className="relative">
                  <Image
                    src={conv.otherUser.image || "/default-avatar.svg"}
                    alt={conv.otherUser.username}
                    width={56}
                    height={56}
                    className="rounded-full aspect-square object-cover"
                  />
                  {conv.lastMessage.senderId !== session?.user?.id && !conv.lastMessage.isRead && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-black"></div>
                  )}
                </div>

                {/* Samtaleinfo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold truncate">
                      {conv.otherUser.displayName || conv.otherUser.username}
                    </h2>
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {formatLastMessageTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${!conv.lastMessage.isRead ? "text-white" : "text-gray-400"}`}>
                    {truncateMessage(conv.lastMessage.content)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 