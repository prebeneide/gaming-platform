"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FiMessageCircle, FiSearch, FiRefreshCw, FiSend, FiClock, FiAlertCircle } from "react-icons/fi";
import AdminLayout from "@/components/AdminLayout";
import TimeFormatter from "@/components/TimeFormatter";
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link";
import io from "socket.io-client";

interface Conversation {
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    image?: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    receiverId: string;
    isRead: boolean;
    sender: {
      id: string;
      username: string;
      displayName?: string;
      image?: string;
    };
  }>;
}

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<typeof selectedConversation.messages>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchConversations();

    // Setup Socket.IO
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:4000");
    }

    const socket = socketRef.current;

    socket.on("support message", (msg: any) => {
      // Refresh conversations when new support message arrives
      fetchConversations();
      
      // If viewing this conversation, add message to current view
      if (selectedConversation && 
          (msg.senderId === selectedConversation.userId || msg.receiverId === selectedConversation.userId)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
        fetchMessages(selectedConversation.userId);
      }
    });

    return () => {
      // Keep socket connection alive
    };
  }, [session, status, router, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/admin/support");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/support/messages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Update selected conversation
        const conv = conversations.find(c => c.userId === userId);
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConversation || !session?.user?.id) return;

    try {
      const response = await fetch("/api/admin/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          content: input.trim(),
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setInput("");
        fetchConversations(); // Refresh to update last message
        
        // Emit via socket
        if (socketRef.current) {
          socketRef.current.emit("chat message", {
            senderId: session.user.id,
            receiverId: selectedConversation.userId,
            content: newMessage.content,
            isSupport: true,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredConversations = conversations.filter(conv =>
    conv.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.user.displayName && conv.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading support conversations...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Support Messages</h1>
            <p className="text-neutral-400 mt-2">
              Manage support conversations with users
              {totalUnread > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm">
                  {totalUnread} unread
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchConversations}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <FiRefreshCw className="text-sm" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* Conversations List */}
          <div className="bg-neutral-800 rounded-lg border border-neutral-700 flex flex-col">
            <div className="p-4 border-b border-neutral-700">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-neutral-400">
                  No support conversations
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => {
                      setSelectedConversation(conv);
                      fetchMessages(conv.userId);
                    }}
                    className={`w-full p-4 border-b border-neutral-700 hover:bg-neutral-750 transition-colors text-left ${
                      selectedConversation?.userId === conv.userId ? 'bg-neutral-750' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={{
                          image: conv.user.image,
                          username: conv.user.username,
                          displayName: conv.user.displayName,
                        }}
                        size={40}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-white truncate">
                            {conv.user.displayName || conv.user.username}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 truncate">
                          {conv.lastMessage.content}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          <TimeFormatter date={conv.lastMessage.createdAt} format="relative" />
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-neutral-800 rounded-lg border border-neutral-700 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-neutral-700 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={{
                          image: selectedConversation.user.image,
                          username: selectedConversation.user.username,
                          displayName: selectedConversation.user.displayName,
                        }}
                        size={40}
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {selectedConversation.user.displayName || selectedConversation.user.username}
                        </p>
                        <p className="text-xs text-purple-100">
                          {selectedConversation.user.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/users/${selectedConversation.userId}`}
                      className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-sm transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => {
                    const isMe = message.senderId === session.user.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isMe
                              ? "bg-purple-600 text-white"
                              : "bg-neutral-700 text-white"
                          }`}
                        >
                          {!isMe && (
                            <div className="flex items-center gap-2 mb-1">
                              <UserAvatar
                                user={{
                                  image: message.sender.image,
                                  username: message.sender.username,
                                  displayName: message.sender.displayName,
                                }}
                                size={20}
                              />
                              <span className="text-xs opacity-75">
                                {message.sender.displayName || message.sender.username}
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
                  })}
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
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FiSend />
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-neutral-400">
                  <FiMessageCircle className="text-4xl mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
