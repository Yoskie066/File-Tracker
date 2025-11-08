import { useState, useEffect } from "react";

export default function useNotifications(currentUser) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.facultyId) {
      console.log("No facultyId found in currentUser:", currentUser);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        console.log("Fetching notifications for facultyId:", currentUser.facultyId);
        const res = await fetch(
          `http://localhost:3000/api/faculty/notifications/${currentUser.facultyId}`
        );
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Notifications API response:", data);

        const list = data?.data || [];
        console.log("Processed notifications:", list.length);
        
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); 
    return () => clearInterval(interval);
  }, [currentUser?.facultyId]); 

  // Mark as read 
  const markAsRead = async (id) => {
    try {
      console.log("Marking notification as read:", id);
      await fetch(`http://localhost:3000/api/faculty/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead };
}