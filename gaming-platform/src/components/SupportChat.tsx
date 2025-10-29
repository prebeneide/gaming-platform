"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { FiSend, FiX } from "react-icons/fi";
import io from "socket.io-client";
import TimeFormatter from "./TimeFormatter";
import UserAvatar from "./UserAvatar";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  sender?: {
    id: string;
    username: string;
    image?: string;
  };
}

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportChat({ isOpen, onClose }: SupportChatProps) {
  const { data: session } = useSession();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch admin ID
  useEffect(() => {
    async function fetchAdminId() {
      try {
        const response = await fetch("/api/admin/get-admin-id");
        if (response.ok) {
          const data = await response.json();
          setAdminId(data.adminId);
        }
      } catch (error) {
        console.error("Error fetching admin ID:", error);
      }
    }
    fetchAdminId();
  }, []);

  // Fetch messages and setup socket
  useEffect(() => {
    if (!session?.user?.id || !adminId) return;

    // Fetch existing messages
    async function fetchMessages() {
      try {
        const response = await fetch(`/api/support/messages?adminId=${adminId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();

    // Setup Socket.IO
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:4000");
    }

    const socket = socketRef.current;

    socket.on("support message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    });

    return () => {
      // Don't disconnect socket, keep connection alive
    };
  }, [session, adminId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user?.id || !adminId || !socketRef.current) return;

    try {
      const response = await fetch("/api/support/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: adminId,
          content: input.trim(),
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setInput("");
        
        // Emit via socket
        socketRef.current.emit("chat message", {
          senderId: session.user.id,
          receiverId: adminId,
          content: newMessage.content,
          isSupport: true,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 left-6 z-50 w-96 h-[500px] bg-neutral-800 rounded-lg shadow-2xl border border-neutral-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-bold">A</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">Support</h3>
            <p className="text-xs text-purple-100">We're here to help</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-neutral-200 transition-colors"
        >
          <FiX className="text-xl" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-neutral-400 py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-neutral-400 py-8">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation with our support team!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === session?.user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isMe
                      ? "bg-purple-600 text-white"
                      : "bg-neutral-700 text-white"
                  }`}
                >
                  {!isMe && message.sender && (
                    <div className="flex items-center gap-2 mb-1">
                      <UserAvatar
                        user={{
                          image: message.sender.image,
                          username: message.sender.username,
                        }}
                        size={20}
                      />
                      <span className="text-xs opacity-75">
                        {message.sender.username}
                      </span>
                    </div>
                  )}
                  <p className="text-sm break-words">{message.content}</p>
                  <p className="text-xs opacity-75 mt-1">
                    <TimeFormatter date={message.createdAt} format="time" />
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-neutral-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg transition-colors"
          >
            <FiSend />
          </button>
        </div>
      </form>
    </div>
  );
}
