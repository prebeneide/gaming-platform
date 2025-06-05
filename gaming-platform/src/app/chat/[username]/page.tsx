"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import io from "socket.io-client";

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

let socketGlobal: ReturnType<typeof io> | null = null;

export default function ChatPage() {
  const { data: session } = useSession();
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : Array.isArray(params.username) ? params.username[0] : "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
          if (data[0].id === session?.user?.id) {
            setError("You cannot send a message to yourself.");
            setOtherUser(null);
            return;
          }
          setOtherUser(data[0]);
          setError(null);
          fetchMessages(data[0].id);
          markMessagesAsRead(data[0].id);
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

  useEffect(() => {
    if (!session?.user?.id || !otherUser?.id) return;

    if (!socketRef.current) {
      socketRef.current = io("http://localhost:4000");
      console.log("[Chat] Socket.IO initialized");
    }
    const socket = socketRef.current;

    console.log("[Chat] My user id:", session.user.id);
    console.log("[Chat] Other user id:", otherUser.id);

    const onConnect = () => {
      console.log("Socket.IO connected:", socket && socket.id);
    };
    const onDisconnect = () => {
      console.log("Socket.IO disconnected");
    };
    const onChatMessage = (msg: Message) => {
      console.log("[Chat] Received message:", msg);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    const onTyping = (data: { from: string; to: string }) => {
      console.log("[Chat] Received typing event:", data);
      if (
        data.from === otherUser.id &&
        data.to === session.user.id
      ) {
        setIsTyping(true);
        if (typingTimeout) clearTimeout(typingTimeout);
        const timeout = setTimeout(() => setIsTyping(false), 10000);
        setTypingTimeout(timeout);
      }
    };
    const onStopTyping = (data: { from: string; to: string }) => {
      console.log("[Chat] Received stop typing event:", data);
      if (data.from === otherUser.id && data.to === session.user.id) {
        setIsTyping(false);
      }
    };
    const onMessagesRead = (data: { senderId: string; receiverId: string }) => {
      console.log("[Chat] Messages marked as read:", data);
      // Oppdater meldinger i UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === data.senderId && msg.receiverId === data.receiverId
            ? { ...msg, isRead: true }
            : msg
        )
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chat message", onChatMessage);
    socket.on("typing", onTyping);
    socket.on("stop typing", onStopTyping);
    socket.on("messages read", onMessagesRead);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat message", onChatMessage);
      socket.off("typing", onTyping);
      socket.off("stop typing", onStopTyping);
      socket.off("messages read", onMessagesRead);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [otherUser?.id, session?.user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (socketRef.current && session?.user?.id && otherUser?.id) {
      socketRef.current.emit("typing", { from: session.user.id, to: otherUser.id });
      if (typingTimeout) clearTimeout(typingTimeout);
      const timeout = setTimeout(() => {
        socketRef.current?.emit("stop typing", { from: session.user.id, to: otherUser.id });
      }, 1000);
      setTypingTimeout(timeout);
    }
  }

  function handleInputBlur() {
    if (socketRef.current && session?.user?.id && otherUser?.id) {
      socketRef.current.emit("stop typing", { from: session.user.id, to: otherUser.id });
    }
    if (typingTimeout) clearTimeout(typingTimeout);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !otherUser) return;

    // Lag melding-objekt
    const msg = {
      content: input,
      senderId: session?.user?.id || "",
      receiverId: otherUser.id,
      createdAt: new Date().toISOString(),
      id: Math.random().toString(36).slice(2), // temp id
    };

    console.log("[Chat] Sending message:", msg);
    // 2. Send via Socket.IO
    socketRef.current?.emit("chat message", msg);
    setInput("");
  }

  // Hjelpefunksjon for å formatere tid/dato på meldinger
  function formatMessageTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return time;
    if (isYesterday) return `I går ${time}`;
    // Hvis ikke i år, vis også år (f.eks. 12.06.22 20:38)
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const nowYear = now.getFullYear();
    if (year !== nowYear) {
      const shortYear = year.toString().slice(-2);
      return `${day}.${month}.${shortYear} ${time}`;
    }
    // Ellers: vis dato + tid (f.eks. 12.06 20:38)
    return `${day}.${month} ${time}`;
  }

  // Funksjon for å markere meldinger som lest
  async function markMessagesAsRead(senderId: string) {
    try {
      // Send Socket.IO event
      if (socketRef.current && session?.user?.id) {
        socketRef.current.emit("mark messages as read", {
          senderId,
          receiverId: session.user.id
        });
      }
      // Backup: Send HTTP request
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId }),
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
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
      <div className="flex-1 min-h-0 flex flex-col gap-2 px-4 py-6 overflow-y-auto" style={{ background: "#101014" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl text-base font-medium shadow break-words
                ${msg.senderId === session?.user?.id
                  ? "bg-gradient-to-r from-[#00c6fb] via-[#8b5cf6] to-[#f6369a] text-white"
                  : "bg-neutral-900 text-gray-200 border border-neutral-800"}
              `}
            >
              {msg.content}
              <span className="block text-xs text-right text-gray-300 mt-1 opacity-60">
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Input og typing-indikator sammen nederst */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-1 px-4 py-3 border-t border-neutral-900 bg-neutral-950 sticky bottom-0 z-40">
        {isTyping && (
          <div className="w-full flex justify-start pb-2 rounded-t-xl">
            <div className="flex items-center gap-2 ml-6">
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:.15s]"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:.3s]"></span>
              <span className="text-sm text-gray-400 ml-2">{otherUser.displayName || otherUser.username} is typing…</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="Message..."
            className="flex-1 rounded-full bg-neutral-900 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={input.trim().length === 0}
            className={`signup-gradient-btn rounded-full px-5 py-2 font-semibold text-white shadow transition ${input.trim().length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 