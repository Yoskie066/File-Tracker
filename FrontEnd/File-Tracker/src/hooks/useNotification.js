import { useState, useEffect } from "react";

export default function useNotifications(currentUser) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.faculty_id) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/faculty/notifications/${currentUser.faculty_id}`
        );
        const data = await res.json();

        const list = data?.data || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Mark as read
  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/faculty/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead };
}
