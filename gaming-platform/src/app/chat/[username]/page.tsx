"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

type User = {
  id: string;
  username: string;
  displayName?: string;
  image?: string;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
};

export default function ChatPage() {
  const { data: session } = useSession();
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : Array.isArray(params.username) ? params.username[0] : "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      if (!username) return;
      try {
        const res = await fetch(`/api/search-users?query=${username}`);
        if (!res.ok) {
          setError(`API error: ${res.status}`);
          return;
        }
        const data = await res.json();
        console.log("search-users result:", data);
        if (data.length > 0) {
          setOtherUser(data[0]);
          setError(null);
          fetchMessages(data[0].id);
        } else {
          setOtherUser(null);
          setError("User not found");
        }
      } catch (err) {
        setError("Network or server error");
        setOtherUser(null);
        console.error("Fetch error:", err);
      }
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function fetchMessages(otherUserId: string) {
    try {
      const res = await fetch(`/api/messages?userId=${otherUserId}`);
      if (!res.ok) {
        setError(`Failed to fetch messages: ${res.status}`);
        return;
      }
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError("Failed to fetch messages");
      console.error("Fetch messages error:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !otherUser) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: otherUser.id, content: input }),
      });
      if (!res.ok) {
        setError(`Failed to send message: ${res.status}`);
        return;
      }
      const newMessage = await res.json();
      setMessages([...messages, newMessage]);
      setInput("");
    } catch (err) {
      setError("Failed to send message");
      console.error("Send message error:", err);
    }
  }

  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;
  if (!otherUser) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-neutral-900 bg-neutral-950 sticky top-0 z-20">
        <Image
          src={otherUser.image || "/default-avatar.svg"}
          alt="Avatar"
          width={48}
          height={48}
          className="rounded-full aspect-square object-cover w-12 h-12"
        />
        <div className="flex flex-col">
          <span className="font-bold text-lg">{otherUser.displayName || otherUser.username}</span>
          <span className="text-xs text-gray-400">@{otherUser.username}</span>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 flex flex-col gap-2 px-4 py-6 overflow-y-auto" style={{ background: "#101014" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl text-base font-medium shadow
                ${msg.senderId === session?.user?.id
                  ? "bg-gradient-to-r from-[#00c6fb] via-[#8b5cf6] to-[#f6369a] text-white"
                  : "bg-neutral-900 text-gray-200 border border-neutral-800"}
              `}
            >
              {msg.content}
              <span className="block text-xs text-right text-gray-300 mt-1 opacity-60">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-neutral-900 bg-neutral-950 sticky bottom-0 z-20">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message..."
          className="flex-1 rounded-full bg-neutral-900 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
        />
        <button
          type="submit"
          className="signup-gradient-btn rounded-full px-5 py-2 font-semibold text-white shadow transition"
        >
          Send
        </button>
      </form>
    </div>
  );
} 