import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Users,
  Upload,
  FolderClock,
  ClipboardList,
  Bell,
  LogOut,
} from "lucide-react";
import useNotification from "../../hooks/useNotification";
import tokenService from "../../services/tokenService";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Handle logout
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
    // Always clear local storage and redirect
    tokenService.clearFacultyTokens();
    navigate("/auth/login");
  }
};

  // Get current user
  const storedFaculty = JSON.parse(localStorage.getItem("faculty"));
  const currentUser = storedFaculty;
  const userInitial = storedFaculty?.facultyName?.charAt(0).toUpperCase() || "F";
  const userEmail = storedFaculty?.facultyName || "Faculty";

  // Custom hook for unread notifications
  const { unreadCount } = useNotification(currentUser);

  // Active link checker
  const isActive = (path) =>
    location.pathname === path ? "bg-yellow-400 text-black" : "";

  return (
    <header className="sticky top-0 bg-black text-white px-6 py-3 flex justify-between items-center shadow-md z-50">
      {/* Logo */}
      <Link to="/faculty/faculty-loaded" className="text-xl font-extrabold tracking-wide">
        File<span className="text-yellow-400">Tracker</span>
      </Link>

      {/* Hamburger - Mobile */}
      <button
        className="lg:hidden block z-50"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* ===== Desktop Navigation ===== */}
      <nav className="hidden lg:flex gap-8 text-sm font-medium">
        <Link
          to="/faculty/faculty-loaded"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <Users className="w-4 h-4" /> Faculty Load
        </Link>
        <Link
          to="/faculty/file-upload"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <Upload className="w-4 h-4" /> File Upload
        </Link>
        <Link
          to="/faculty/file-history"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <FolderClock className="w-4 h-4" /> File History
        </Link>
        <Link
          to="/faculty/task-deliverables"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <ClipboardList className="w-4 h-4" /> Task Deliverables
        </Link>
        {/* Notification Desktop */}
        <Link
          to="/faculty/notification"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200 relative"
        >
          <Bell className="w-4 h-4" /> Notification
          {unreadCount > 0 && (
            <span className="ml-1 bg-yellow-400 text-black font-semibold text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </Link>
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </nav>

      {/* Desktop User Info */}
      <div className="hidden lg:flex flex-col items-center ml-4">
        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold">
          {userInitial}
        </div>
        <p className="text-xs mt-1">{userEmail}</p>
      </div>

      {/* ===== Mobile Navigation ===== */}
      <div
        className={`lg:hidden fixed inset-0 bg-black text-white transform transition-transform duration-300 z-40 flex flex-col items-center justify-start pt-20 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* User Info */}
        <div className="flex items-center gap-3 mb-8 px-6 w-full max-w-xs">
          <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
            {userInitial}
          </div>
          <div className="text-left">
            <p className="font-medium">{userEmail}</p>
          </div>
        </div>

        <div className="w-full max-w-xs border-t border-white mb-6"></div>

        {/* Mobile Links */}
        <nav className="flex flex-col w-full max-w-xs gap-1">
          <Link
            to="/faculty/faculty-loaded"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/faculty/faculty-loaded"
            )}`}
          >
            <Users className="w-5 h-5" /> Faculty Load
          </Link>
          <Link
            to="/faculty/file-upload"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/faculty/file-upload"
            )}`}
          >
            <Upload className="w-5 h-5" /> File Upload
          </Link>
          <Link
            to="/faculty/file-history"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/faculty/file-history"
            )}`}
          >
            <FolderClock className="w-5 h-5" /> File History
          </Link>
          <Link
            to="/faculty/task-deliverables"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/faculty/task-deliverables"
            )}`}
          >
            <ClipboardList className="w-5 h-5" /> Task Deliverables
          </Link>
          {/* Notification Mobile */}
          <Link
            to="/faculty/notification"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/faculty/notification"
            )}`}
          >
            <Bell className="w-5 h-5" /> Notification
            {unreadCount > 0 && (
              <span className="ml-2 bg-yellow-400 text-black font-semibold text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>
          {/* Logout */}
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="py-3 px-4 hover:bg-yellow-400 rounded flex items-center gap-3 text-left"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
