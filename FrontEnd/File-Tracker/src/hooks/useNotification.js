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
          `${API_BASE_URL}/api/faculty/faculty-notifications/${currentUser.facultyId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('facultyToken')}`
            }
          }
        );
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Notifications API response:", data);

        const list = data?.data || [];
        console.log(`Processed ${list.length} notifications for faculty`);
        
        // Sort by date and unread status
        list.sort((a, b) => {
          // Show unread first
          if (a.is_read !== b.is_read) {
            return a.is_read ? 1 : -1;
          }
          // Then sort by date
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
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
          `${API_BASE_URL}/api/faculty/notifications/${currentUser.facultyId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('facultyToken')}`
            }
          }
        );
        
        if (res.ok) {
          const data = await res.json();
          const list = data?.data || [];
          console.log(`Fallback found ${list.length} notifications`);
          
          // Sort by date and unread status
          list.sort((a, b) => {
            if (a.is_read !== b.is_read) {
              return a.is_read ? 1 : -1;
            }
            return new Date(b.created_at) - new Date(a.created_at);
          });
          
          setNotifications(list);
          setUnreadCount(list.filter((n) => !n.is_read).length);
        }
      } catch (fallbackError) {
        console.error("Fallback notification fetch also failed:", fallbackError);
      }
    };

    fetchNotifications();
    
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval);
  }, [currentUser?.facultyId]); 

  // Mark as read 
  const markAsRead = async (id) => {
    try {
      console.log("Marking notification as read:", id);
      const response = await fetch(`${API_BASE_URL}/api/faculty/notifications/${id}/read`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('facultyToken')}`
        },
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

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/faculty/notifications/${currentUser.facultyId}/read-all`, 
        {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('facultyToken')}`
          },
        }
      );
      
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Get file status notifications only
  const getFileStatusNotifications = () => {
    return notifications.filter(n => n.notification_type === "file_status_update");
  };

  return { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    getFileStatusNotifications
  };
}