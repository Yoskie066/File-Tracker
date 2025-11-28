import { useState, useEffect } from "react";

export default function useNotifications(currentUser) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
          `${API_BASE_URL}/api/faculty/faculty-notifications/${currentUser.facultyId}`
        );
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Notifications API response:", data);

        const list = data?.data || [];
        console.log(`Processed ${list.length} notifications for faculty`);
        
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        // Fallback to old endpoint if new one fails
        await fetchNotificationsFallback();
      } finally {
        setLoading(false);
      }
    };

    // Fallback method using old endpoint
    const fetchNotificationsFallback = async () => {
      try {
        console.log("Trying fallback notification fetch...");
        const res = await fetch(
          `${API_BASE_URL}/api/faculty/notifications/${currentUser.facultyId}`
        );
        
        if (res.ok) {
          const data = await res.json();
          const list = data?.data || [];
          console.log(`Fallback found ${list.length} notifications`);
          
          setNotifications(list);
          setUnreadCount(list.filter((n) => !n.is_read).length);
        }
      } catch (fallbackError) {
        console.error("Fallback notification fetch also failed:", fallbackError);
      }
    };

    fetchNotifications();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchNotifications, 15000); 
    return () => clearInterval(interval);
  }, [currentUser?.facultyId]); 

  // Mark as read 
  const markAsRead = async (id) => {
    try {
      console.log("Marking notification as read:", id);
      const response = await fetch(`${API_BASE_URL}/api/faculty/notifications/${id}/read`, {
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

  return { notifications, unreadCount, loading, markAsRead };
}