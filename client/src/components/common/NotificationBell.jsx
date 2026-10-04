import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Bell icon with unread badge + dropdown list.
// Polls unread count every 60s.
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchUnread = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.data.unread_count || 0);
    } catch (e) {
      // silently ignore
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ limit: 20 });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (e) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, 60000);
    return () => clearInterval(t);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) fetchAll();
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (e) {
      toast.error('Failed to mark all read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchUnread();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <p className="p-4 text-center text-sm text-gray-500">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border-b last:border-b-0 ${
                    !n.is_read ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Mark
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;