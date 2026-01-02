import { useState, useEffect } from "react";

export default function useAdminNotification(adminId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    if (!adminId) {
      console.log("No adminId provided");
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        console.log("Fetching admin notifications for adminId:", adminId);
        
        const res = await fetch(
          `${API_BASE_URL}/api/admin/admin-notifications/${adminId}`
        );
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Admin notifications API response:", data);

        const list = data?.data || [];
        console.log(`Found ${list.length} notifications for admin`);
        
        setNotifications(list);
      } catch (err) {
        console.error("Error fetching admin notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/admin/admin-notifications/${adminId}/unread-count`
        );
        
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchNotifications();
    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [adminId]); 

  // Mark as read 
  const markAsRead = async (notificationId) => {
    try {
      console.log("Marking admin notification as read:", notificationId);
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.notification_id === notificationId ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-notifications/${adminId}/read-all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Update notification status
  const updateStatus = async (notificationId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-notifications/${notificationId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(prev =>
          prev.map(n => (n.notification_id === notificationId ? data.data : n))
        );
        return data;
      }
    } catch (err) {
      console.error("Error updating status:", err);
      throw err;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-notifications/${notificationId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
        setUnreadCount(prev => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      throw err;
    }
  };

  return { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    updateStatus,
    deleteNotification
  };
}