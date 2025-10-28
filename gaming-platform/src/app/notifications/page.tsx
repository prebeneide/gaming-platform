"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FiBell, FiCheck, FiX, FiClock, FiUser, FiDollarSign } from "react-icons/fi";
import { FaTrophy } from "react-icons/fa";
import { usePopup } from "@/components/PopupProvider";
import BackButton from "@/components/BackButton";
import TimeFormatter from "@/components/TimeFormatter";
import Link from "next/link";
import Image from "next/image";
import UserAvatar from "@/components/UserAvatar";

interface Notification {
  id: string;
  type: 'match_invite' | 'friend_request' | 'match_result' | 'payment' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    matchId?: string;
    userId?: string;
    amount?: number;
    [key: string]: any;
  };
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { showPopup } = usePopup();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.log('Notifications API not ready yet, showing empty state');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        showPopup({ type: 'success', message: 'All notifications marked as read' });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };



  const createTestNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        showPopup({ type: 'success', message: `Created ${data.count} test notifications!` });
        fetchNotifications(); // Refresh the list
      } else {
        showPopup({ type: 'error', message: 'Failed to create test notifications' });
      }
    } catch (error) {
      console.error('Error creating test notifications:', error);
      showPopup({ type: 'error', message: 'Failed to create test notifications' });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_invite':
        return <FaTrophy color="#fbbf24" />;
      case 'friend_request':
        return <FiUser color="#60a5fa" />;
      case 'match_result':
        return <FaTrophy color="#34d399" />;
      case 'payment':
        return <FiDollarSign color="#34d399" />;
      case 'system':
        return <FiBell color="#a78bfa" />;
      default:
        return <FiBell color="#9ca3af" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match_invite':
        return 'border-yellow-500/20 bg-yellow-500/5';
      case 'friend_request':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'match_result':
        return 'border-green-500/20 bg-green-500/5';
      case 'payment':
        return 'border-green-500/20 bg-green-500/5';
      case 'system':
        return 'border-purple-500/20 bg-purple-500/5';
      default:
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="text-gray-400 text-sm sm:text-base">
                {unreadCount} unread
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition whitespace-nowrap"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={createTestNotifications}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition whitespace-nowrap"
              >
                Create Test Notifications
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-pink-500 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition whitespace-nowrap ${
              filter === 'unread' 
                ? 'bg-pink-500 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition whitespace-nowrap ${
              filter === 'read' 
                ? 'bg-pink-500 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="flex justify-center mb-3 sm:mb-4">
                <span className="sm:hidden">
                  <FiBell color="#6b7280" size={48} />
                </span>
                <span className="hidden sm:block">
                  <FiBell color="#6b7280" size={64} />
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-1 sm:mb-2">
                {filter === 'all' ? 'No notifications yet' : 
                 filter === 'unread' ? 'No unread notifications' : 
                 'No read notifications'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500">
                {filter === 'all' ? 'You\'ll see notifications about matches, friends, and updates here' :
                 filter === 'unread' ? 'All caught up! No new notifications' :
                 'No read notifications to show'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
                  !notification.isRead ? 'ring-2 ring-pink-500/20' : ''
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-4">
                  {notification.type === 'friend_request' ? (
                    <Link href={`/profile/${notification.data?.requesterName}`} className="block flex-shrink-0 hover:opacity-90 transition">
                      <UserAvatar 
                        user={{
                          image: notification.data?.requesterImage,
                          username: notification.data?.requesterName,
                          displayName: notification.data?.requesterName
                        }}
                        size={48}
                        ring={true}
                      />
                    </Link>
                  ) : (
                    <div className="text-lg sm:text-2xl mt-1 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`font-semibold text-xs sm:text-base ${!notification.isRead ? 'text-white' : 'text-gray-300'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-gray-400 mt-1 text-xs sm:text-base">
                              {notification.type === 'friend_request' ? (
                                <>
                                  <Link 
                                    href={`/profile/${notification.data?.requesterName}`}
                                    className="text-pink-400 hover:text-pink-300 transition font-medium"
                                  >
                                    {notification.data?.requesterName}
                                  </Link>
                                  {" sent you a friend request"}
                                </>
                              ) : (
                                notification.message
                              )}
                            </p>
                            <div className="flex items-center gap-1 sm:gap-4 mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="block sm:hidden"><FiClock size={12} /></span>
                                <span className="hidden sm:block"><FiClock size={14} /></span>
                                <TimeFormatter date={notification.createdAt} />
                              </span>
                              {!notification.isRead && (
                                <span className="text-pink-400 font-medium">New</span>
                              )}
                            </div>
                          </div>
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 sm:p-2 text-green-400 hover:text-green-300 transition ml-1 sm:ml-2"
                              title="Mark as read"
                            >
                              <span className="block sm:hidden"><FiCheck size={12} /></span>
                              <span className="hidden sm:block"><FiCheck size={16} /></span>
                            </button>
                          )}
                        </div>
                      </div>
                                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-0">
                        {notification.type === 'friend_request' && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch('/api/friends', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      requestId: notification.data?.requestId,
                                      action: 'accept'
                                    })
                                  });
                                  
                                  if (response.ok) {
                                    showPopup({ type: 'success', message: 'Friend request accepted!' });
                                    // Slett notificationen fra databasen
                                    await fetch(`/api/notifications/${notification.id}`, {
                                      method: 'DELETE'
                                    });
                                    // Oppdater UI
                                    setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                  } else {
                                    showPopup({ type: 'error', message: 'Failed to accept friend request' });
                                  }
                                } catch (error) {
                                  console.error('Error accepting friend request:', error);
                                  showPopup({ type: 'error', message: 'Failed to accept friend request' });
                                }
                              }}
                              className="px-1.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-1 whitespace-nowrap"
                              title="Accept friend request"
                            >
                              <span className="block sm:hidden"><FiCheck size={14} /></span>
                              <span className="hidden sm:block"><FiCheck size={16} /></span>
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch('/api/friends', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      requestId: notification.data?.requestId,
                                      action: 'reject'
                                    })
                                  });
                                  
                                  if (response.ok) {
                                    showPopup({ type: 'success', message: 'Friend request rejected' });
                                    // Slett notificationen fra databasen
                                    await fetch(`/api/notifications/${notification.id}`, {
                                      method: 'DELETE'
                                    });
                                    // Oppdater UI
                                    setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                  } else {
                                    showPopup({ type: 'error', message: 'Failed to reject friend request' });
                                  }
                                } catch (error) {
                                  console.error('Error rejecting friend request:', error);
                                  showPopup({ type: 'error', message: 'Failed to reject friend request' });
                                }
                              }}
                              className="px-1.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1 whitespace-nowrap"
                              title="Reject friend request"
                            >
                              <span className="block sm:hidden"><FiX size={14} /></span>
                              <span className="hidden sm:block"><FiX size={16} /></span>
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 