"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import io from "socket.io-client";
import { FiMessageSquare, FiX, FiSend, FiSmile } from "react-icons/fi";
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

interface MatchChatProps {
  matchId: string;
}

export default function MatchChat({ matchId }: MatchChatProps) {
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

    console.log("[MatchChat] Initializing socket connection for match:", matchId);
    socketRef.current = io("http://localhost:4000");

    socketRef.current.on("connect", () => {
      console.log("[MatchChat] Socket connected:", socketRef.current?.id);
      setIsConnecting(false);
      // Join the match room
      socketRef.current.emit("join match room", matchId);
    });

    socketRef.current.on("connect_error", (error: Error) => {
      console.error("[MatchChat] Connection error:", error);
      setIsConnecting(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("[MatchChat] Socket disconnected");
      setIsConnecting(true);
    });

    // Listen for match chat messages
    socketRef.current.on("match chat message", (msg: MatchMessage) => {
      console.log("[MatchChat] Received message:", msg);
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    // Load initial messages
    fetch(`/api/matches/${matchId}/chat`)
      .then((res) => res.json())
      .then((data) => {
        console.log("[MatchChat] Loaded messages:", data);
        if (data.messages) {
          setMessages(data.messages);
          scrollToBottom();
        }
      })
      .catch((err) => console.error("[MatchChat] Error fetching messages:", err));

    return () => {
      console.log("[MatchChat] Cleaning up socket connection...");
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
    if (!message.trim() || !socketRef.current || !session?.user?.id) {
      console.log("[MatchChat] Cannot send message:", { 
        hasMessage: !!message.trim(), 
        hasSocket: !!socketRef.current, 
        hasUserId: !!session?.user?.id 
      });
      return;
    }

    const msgData = {
      content: message.trim(),
      senderId: session.user.id,
      matchId: matchId,
    };

    console.log("[MatchChat] Sending message:", msgData);
    // Send to server via socket
    socketRef.current.emit("match chat message", msgData);
    setMessage("");
    inputRef.current?.focus();
  };

  if (!session) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Open match chat"
      >
        <FiMessageSquare className="text-white text-xl" />
        {isConnecting && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed top-20 right-4 w-96 h-[600px] bg-neutral-900 shadow-2xl flex flex-col z-50 border border-neutral-800">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-white">Match Chat</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition"
              aria-label="Close chat"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                          size={32}
                        />
                      </div>
                    )}
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 ${isOwn ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-neutral-800 text-gray-100"}`}>
                      {!isOwn && (
                        <div className="text-xs font-semibold mb-1">
                          {msg.sender.displayName || msg.sender.username || "Anonymous"}
                        </div>
                      )}
                      <div className="text-sm">{msg.content}</div>
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
          <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-800 relative">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 bg-neutral-800 rounded-lg p-3 w-full grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-neutral-700">
                {POPULAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl hover:bg-neutral-700 rounded p-2 transition"
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
                <FiSmile className="text-xl" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-neutral-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isConnecting}
              />
              <button
                type="submit"
                disabled={!message.trim() || isConnecting}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <FiSend />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

