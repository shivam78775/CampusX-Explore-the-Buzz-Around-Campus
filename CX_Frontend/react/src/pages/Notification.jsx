import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';

function NotificationBox() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Socket (use env)
  useEffect(() => {
    if (user) {
      const socketInstance = io(BASE_URL, {
        withCredentials: true,
      });

      setSocket(socketInstance);

      socketInstance.on("new_notification", (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user, BASE_URL]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/notifications`, {
        withCredentials: true
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/notifications/unread-count`, {
        withCredentials: true
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${BASE_URL}/api/v1/notifications/mark-read`, {}, {
        withCredentials: true
      });
      setUnreadCount(0);
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.sender.username} liked your post`;
      case 'comment':
        return `${notification.sender.username} commented: "${notification.content}"`;
      case 'follow':
        return `${notification.sender.username} started following you`;
      case 'message':
        return `${notification.sender.username} sent a message: "${notification.content}"`;
      case 'reminder':
        return `Reminder: ${notification.content}`;
      default:
        return 'New notification';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👥';
      case 'message': return '💌';
      case 'reminder': return '⏰';
      default: return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-lime-400 text-black px-4 py-2 rounded-full hover:bg-lime-500 transition"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔔</div>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-lg border-l-4 ${
                notification.isRead 
                  ? 'bg-gray-50 border-gray-300' 
                  : 'bg-lime-50 border-lime-400'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {notification.sender.profilepic && (
                      <img
                        src={notification.sender.profilepic}
                        alt={notification.sender.username}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <p className="text-sm text-gray-600">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-1 text-gray-800">
                    {getNotificationMessage(notification)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBox;
