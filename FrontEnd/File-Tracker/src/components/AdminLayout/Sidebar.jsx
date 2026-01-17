import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  FileStack,
  BellRing,
  History,
  BarChart3,
  LogOut,
  Settings,
  Bell,
  X,
  Archive
} from "lucide-react";
import { useState, useEffect } from "react";
import tokenService from "../../services/tokenService";

export default function Sidebar({ isOpen, onClose }) {
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Get admin info from localStorage
  const storedAdmin = JSON.parse(localStorage.getItem("admin"));
  const firstName = storedAdmin?.firstName || "";
  const middleInitial = storedAdmin?.middleInitial || "";
  const lastName = storedAdmin?.lastName || "";
  const fullName = middleInitial && middleInitial.trim() !== ''
    ? `${firstName} ${middleInitial}. ${lastName}`
    : `${firstName} ${lastName}`;
  const userInitial = firstName?.charAt(0).toUpperCase() || "A";

  // Fetch admin unread notification count
  useEffect(() => {
    const fetchAdminUnreadCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/admin-notifications/unread-count`);
        if (response.ok) {
          const data = await response.json();
          setAdminUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching admin unread count:", error);
      }
    };

    fetchAdminUnreadCount();
    const interval = setInterval(fetchAdminUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      const token = tokenService.getAdminAccessToken();
      
      if (token) {
        await fetch(`${API_BASE_URL}/api/admin/admin-logout`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      tokenService.clearAdminTokens();
      navigate("/auth/admin-login");
    }
  };

  // Function to check if the link is active
  const isActive = (path) =>
    location.pathname === path ? "bg-yellow-400 text-black font-bold" : "hover:bg-gray-800";

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar - Slides in from right */}
      <div className={`
        fixed lg:hidden inset-y-0 right-0 z-50 
        bg-black text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        w-80
        flex flex-col
      `}>
        {/* Mobile Header with Account Name and Close Button */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
              {userInitial}
            </div>
            <div>
              <p className="font-semibold">{fullName}</p>
              <p className="text-sm text-gray-400">Administrator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          <Link
            to="/admin/analytics"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/analytics")}`}
            onClick={onClose}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-lg">Analytics</span>
          </Link>
          
          <Link
            to="/admin/user-management"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/user-management")}`}
            onClick={onClose}
          >
            <Users className="w-5 h-5" />
            <span className="text-lg">User Management</span>
          </Link>
          
          <Link
            to="/admin/file-management"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/file-management")}`}
            onClick={onClose}
          >
            <FileStack className="w-5 h-5" />
            <span className="text-lg">File Management</span>
          </Link>
          
          <Link
            to="/admin/history-of-records"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/history-of-records")}`}
            onClick={onClose}
          >
            <History className="w-5 h-5" />
            <span className="text-lg">History of Records</span>
          </Link>
          
          <Link
            to="/admin/admin-notice"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/admin-notice")}`}
            onClick={onClose}
          >
            <BellRing className="w-5 h-5" />
            <span className="text-lg">Admin Notice</span>
          </Link>
          
          <Link
            to="/admin/system-variables"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/system-variables")}`}
            onClick={onClose}
          >
            <Settings className="w-5 h-5" />
            <span className="text-lg">System Variables</span>
          </Link>

          <Link
            to="/admin/archive"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/archive")}`}
            onClick={onClose}
          >
            <Archive className="w-5 h-5" />
            <span className="text-lg">Archive</span>
          </Link>
          
          <Link
            to="/admin/admin-notification"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/admin-notification")} relative`}
            onClick={onClose}
          >
            <Bell className="w-5 h-5" />
            <span className="text-lg">Notification</span>
            {adminUnreadCount > 0 && (
              <span className="absolute right-4 bg-yellow-400 text-black font-bold text-xs px-2 py-0.5 rounded-full">
                {adminUnreadCount}
              </span>
            )}
          </Link>
          
          <button
            onClick={() => {
              onClose();
              handleLogout();
            }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 w-full transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-lg">Logout</span>
          </button>
        </nav>
      </div>

      {/* Desktop Sidebar - FIXED on the left side */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-72 bg-black text-white z-30 pt-16">
        {/* Desktop Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2 h-full">
          <Link
            to="/admin/analytics"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/analytics")}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-lg">Analytics</span>
          </Link>
          
          <Link
            to="/admin/user-management"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/user-management")}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-lg">User Management</span>
          </Link>
          
          <Link
            to="/admin/file-management"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/file-management")}`}
          >
            <FileStack className="w-5 h-5" />
            <span className="text-lg">File Management</span>
          </Link>
          
          <Link
            to="/admin/history-of-records"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/history-of-records")}`}
          >
            <History className="w-5 h-5" />
            <span className="text-lg">History of Records</span>
          </Link>
          
          <Link
            to="/admin/admin-notice"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/admin-notice")}`}
          >
            <BellRing className="w-5 h-5" />
            <span className="text-lg">Admin Notice</span>
          </Link>
          
          <Link
            to="/admin/system-variables"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/system-variables")}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-lg">System Variables</span>
          </Link>

          <Link
            to="/admin/archive"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/archive")}`}
          >
            <Archive className="w-5 h-5" />
            <span className="text-lg">Archive</span>
          </Link>
          
          <Link
            to="/admin/admin-notification"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/admin/admin-notification")} relative`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-lg">Notification</span>
            {adminUnreadCount > 0 && (
              <span className="absolute right-4 bg-yellow-400 text-black font-bold text-xs px-2 py-0.5 rounded-full">
                {adminUnreadCount}
              </span>
            )}
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 w-full transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-lg">Logout</span>
          </button>
        </nav>
      </div>
    </>
  );
}