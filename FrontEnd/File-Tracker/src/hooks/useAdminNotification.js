import { useState, useEffect } from "react";

export default function useAdminNotification() {
  const [notifications, setNotifications] = useState([]);
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

  return { 
    notifications, 
    loading
  };
}