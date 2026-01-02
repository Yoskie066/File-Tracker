import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Upload,
  FolderClock,
  ClipboardList,
  LogOut,
  Bell,
  X
} from "lucide-react";
import { useState } from "react";
import tokenService from "../../services/tokenService";
import useNotification from "../../hooks/useNotification";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Get current user
  const storedFaculty = JSON.parse(localStorage.getItem("faculty"));
  const currentUser = storedFaculty;
  const userInitial = storedFaculty?.facultyName?.charAt(0).toUpperCase() || "F";
  const userEmail = storedFaculty?.facultyName || "Faculty";

  // Custom hook for unread notifications
  const { unreadCount } = useNotification(currentUser);

  const handleLogout = async () => {
    try {
      const token = tokenService.getFacultyAccessToken();
      
      if (token) {
        await fetch(`${API_BASE_URL}/api/faculty/logout`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      tokenService.clearFacultyTokens();
      navigate("/auth/login");
    }
  };

  // Active link checker
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
              <p className="font-semibold">{userEmail}</p>
              <p className="text-sm text-gray-400">Faculty Member</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          <Link
            to="/faculty/faculty-loaded"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/faculty-loaded")}`}
            onClick={onClose}
          >
            <Users className="w-5 h-5" />
            <span className="text-lg">Faculty Load</span>
          </Link>
          
          <Link
            to="/faculty/file-upload"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/file-upload")}`}
            onClick={onClose}
          >
            <Upload className="w-5 h-5" />
            <span className="text-lg">File Upload</span>
          </Link>
          
          <Link
            to="/faculty/file-history"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/file-history")}`}
            onClick={onClose}
          >
            <FolderClock className="w-5 h-5" />
            <span className="text-lg">File History</span>
          </Link>
          
          <Link
            to="/faculty/task-deliverables"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/task-deliverables")}`}
            onClick={onClose}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-lg">Task Deliverables</span>
          </Link>
          
          <Link
            to="/faculty/notification"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/notification")} relative`}
            onClick={onClose}
          >
            <Bell className="w-5 h-5" />
            <span className="text-lg">Notification</span>
            {unreadCount > 0 && (
              <span className="absolute right-4 bg-yellow-400 text-black font-bold text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
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
            to="/faculty/faculty-loaded"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/faculty-loaded")}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-lg">Faculty Load</span>
          </Link>
          
          <Link
            to="/faculty/file-upload"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/file-upload")}`}
          >
            <Upload className="w-5 h-5" />
            <span className="text-lg">File Upload</span>
          </Link>
          
          <Link
            to="/faculty/file-history"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/file-history")}`}
          >
            <FolderClock className="w-5 h-5" />
            <span className="text-lg">File History</span>
          </Link>
          
          <Link
            to="/faculty/task-deliverables"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/task-deliverables")}`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-lg">Task Deliverables</span>
          </Link>
          
          <Link
            to="/faculty/notification"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive("/faculty/notification")} relative`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-lg">Notification</span>
            {unreadCount > 0 && (
              <span className="absolute right-4 bg-yellow-400 text-black font-bold text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
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