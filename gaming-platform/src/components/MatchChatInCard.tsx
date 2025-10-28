"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import io from "socket.io-client";
import { FiMessageSquare, FiSend, FiSmile, FiX } from "react-icons/fi";
import UserAvatar from "@/components/UserAvatar";
import TimeFormatter from "@/components/TimeFormatter";

interface MatchMessage {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    username: string | null;
    displayName: string | null;
    image: string | null;
  };
  createdAt: string;
}

const POPULAR_EMOJIS = ['😀', '😂', '🥰', '😎', '🤔', '🔥', '💯', '👍', '👎', '❤️', '🎉', '🎮', '⚡', '💪', '🤝', '👏', '🙌'];

interface MatchChatInCardProps {
  matchId: string;
}

export default function MatchChatInCard({ matchId }: MatchChatInCardProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user?.id || !matchId) return;

    console.log("[MatchChatInCard] Initializing socket connection for match:", matchId);
    socketRef.current = io("http://localhost:4000");

    socketRef.current.on("connect", () => {
      console.log("[MatchChatInCard] Socket connected:", socketRef.current?.id);
      setIsConnecting(false);
      // Join the match room
      socketRef.current.emit("join match room", matchId);
    });

    socketRef.current.on("connect_error", (error: Error) => {
      console.error("[MatchChatInCard] Connection error:", error);
      setIsConnecting(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("[MatchChatInCard] Socket disconnected");
      setIsConnecting(true);
    });

    // Listen for match chat messages
    socketRef.current.on("match chat message", (msg: MatchMessage) => {
      console.log("[MatchChatInCard] Received message:", msg);
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    // Load initial messages
    fetch(`/api/matches/${matchId}/chat`)
      .then((res) => res.json())
      .then((data) => {
        console.log("[MatchChatInCard] Loaded messages:", data);
        if (data.messages) {
          setMessages(data.messages);
          scrollToBottom();
        }
      })
      .catch((err) => console.error("[MatchChatInCard] Error fetching messages:", err));

    return () => {
      console.log("[MatchChatInCard] Cleaning up socket connection...");
      if (socketRef.current) {
        socketRef.current.emit("leave match room", matchId);
        socketRef.current.disconnect();
      }
    };
  }, [session, matchId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  const insertEmoji = (emoji: string) => {
    setMessage(message + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[MatchChatInCard] Submit clicked:", {
      hasMessage: !!message.trim(),
      hasSocket: !!socketRef.current,
      hasUserId: !!session?.user?.id,
      message: message.trim(),
    });
    
    if (!message.trim() || !socketRef.current || !session?.user?.id) {
      console.log("[MatchChatInCard] Cannot send - missing requirements");
      return;
    }

    const msgData = {
      content: message.trim(),
      senderId: session.user.id,
      matchId: matchId,
    };

    console.log("[MatchChatInCard] Emitting message:", msgData);
    socketRef.current.emit("match chat message", msgData);
    setMessage("");
    inputRef.current?.focus();
  };

  if (!session) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <FiMessageSquare className="text-purple-400" />
          <span className="text-white font-semibold">Match Chat</span>
          {!isConnecting && messages.length > 0 && (
            <span className="text-xs text-gray-400">({messages.length})</span>
          )}
        </div>
        {isConnecting && (
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Chat Window - Collapsible */}
      {isOpen && (
        <div className="mt-2 border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900">
          {/* Chat Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Be the first to say something!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === session?.user?.id;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                    {!isOwn && (
                      <div className="mt-1">
                        <UserAvatar
                          user={{
                            username: msg.sender.username,
                            displayName: msg.sender.displayName,
                            image: msg.sender.image,
                          }}
                          size={24}
                        />
                      </div>
                    )}
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${isOwn ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-neutral-800 text-gray-100"}`}>
                      {!isOwn && (
                        <div className="text-xs font-semibold mb-1">
                          {msg.sender.displayName || msg.sender.username || "Anonymous"}
                        </div>
                      )}
                      <div>{msg.content}</div>
                      <div className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-gray-400"}`}>
                        <TimeFormatter date={msg.createdAt} format="time" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-800 relative">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full left-3 mb-2 bg-neutral-800 rounded-lg p-3 w-[calc(100%-1.5rem)] grid grid-cols-6 gap-2 max-h-48 overflow-y-auto border border-neutral-700">
                {POPULAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-xl hover:bg-neutral-700 rounded p-1 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-400 hover:text-white transition flex-shrink-0"
              >
                <FiSmile className="text-lg" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-neutral-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={isConnecting}
              />
              <button
                type="submit"
                disabled={!message.trim() || isConnecting}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 text-sm"
              >
                <FiSend />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

