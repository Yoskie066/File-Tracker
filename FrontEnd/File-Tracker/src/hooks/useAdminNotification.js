import { useState, useEffect } from "react";

export default function useAdminNotification() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        console.log("Fetching admin notifications");
        
        const res = await fetch(`${API_BASE_URL}/api/admin/admin-notifications`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Admin notifications API response:", data);

        const list = data?.data || [];
        console.log(`Found ${list.length} notifications`);
        
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error("Error fetching admin notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    
    return () => clearInterval(interval);
  }, []); 

  // Mark as read 
  const markAsRead = async (id) => {
    try {
      console.log("Marking admin notification as read:", id);
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  return { 
    notifications, 
    unreadCount,
    loading,
    markAsRead 
  };
}