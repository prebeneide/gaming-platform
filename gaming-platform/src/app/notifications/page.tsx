"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FiBell, FiCheck, FiX, FiClock, FiUser, FiMessageSquare, FiDollarSign } from "react-icons/fi";
import { FaTrophy } from "react-icons/fa";
import { usePopup } from "@/components/PopupProvider";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import Image from "next/image";

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

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        showPopup({ type: 'success', message: 'Notification deleted' });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
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
          <div className="flex items-center justify-between mt-4">
            <h1 className="text-3xl font-bold">Notifications</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                {unreadCount} unread
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={createTestNotifications}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Create Test Notifications
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all' 
                ? 'bg-pink-500 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'unread' 
                ? 'bg-pink-500 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg transition ${
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
            <div className="text-center py-12">
              <div className="mx-auto mb-4">
                <FiBell color="#6b7280" size={64} />
              </div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {filter === 'all' ? 'No notifications yet' : 
                 filter === 'unread' ? 'No unread notifications' : 
                 'No read notifications'}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' ? 'You\'ll see notifications about matches, friends, and updates here' :
                 filter === 'unread' ? 'All caught up! No new notifications' :
                 'No read notifications to show'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
                  !notification.isRead ? 'ring-2 ring-pink-500/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {notification.type === 'friend_request' && notification.data?.requesterImage ? (
                    <Link 
                      href={`/profile/${notification.data?.requesterName}`}
                      className="relative w-12 h-12 rounded-full overflow-hidden block hover:opacity-90 transition"
                    >
                      <Image
                        src={notification.data.requesterImage}
                        alt={`${notification.data.requesterName}'s profile picture`}
                        fill
                        className="object-cover"
                      />
                    </Link>
                  ) : (
                    <div className="text-2xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-400 mt-1">
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
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiClock size={14} />
                            {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                            {new Date(notification.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {!notification.isRead && (
                            <span className="text-pink-400 font-medium">New</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                                    await markAsRead(notification.id);
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
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-1"
                              title="Accept friend request"
                            >
                              <FiCheck size={16} />
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
                                    await markAsRead(notification.id);
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
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1"
                              title="Reject friend request"
                            >
                              <FiX size={16} />
                              Reject
                            </button>
                          </>
                        )}
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-green-400 hover:text-green-300 transition"
                            title="Mark as read"
                          >
                            <FiCheck size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition"
                          title="Delete notification"
                        >
                          <FiX size={16} />
                        </button>
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