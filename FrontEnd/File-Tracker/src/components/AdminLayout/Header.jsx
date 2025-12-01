import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Users,
  FileStack,
  BellRing,
  BarChart3,
  LogOut,
  Settings
} from "lucide-react";
import tokenService from "../../services/tokenService";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
    // Always clear local storage and redirect
    tokenService.clearAdminTokens();
    navigate("/auth/admin-login");
  }
};

  // Get admin info from localStorage
  const storedAdmin = JSON.parse(localStorage.getItem("admin"));
  const userInitial = storedAdmin?.adminName?.charAt(0).toUpperCase() || "A";
  const userEmail = storedAdmin?.adminName || "Admin";

  // Function to check if the link is active
  const isActive = (path) =>
    location.pathname === path ? "bg-yellow-400 text-black" : "";

  return (
    <header className="sticky top-0 bg-black text-white px-6 py-3 flex justify-between items-center shadow-md z-50">
      {/* Logo */}
      <Link to="/admin/analytics" className="text-xl font-extrabold tracking-wide">
        File<span className="text-yellow-400">Tracker</span>
      </Link>

      {/* Hamburger Icon */}
      <button
        className="lg:hidden block z-50"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex gap-8 text-sm font-medium">
        <Link
          to="/admin/analytics"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Link>
        <Link
          to="/admin/user-management"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <Users className="w-4 h-4" />
          User Management
        </Link>
        <Link
          to="/admin/file-management"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <FileStack className="w-4 h-4" />
          File Management
        </Link>
        <Link
          to="/admin/requirement"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <BellRing className="w-4 h-4" />
          Requirement
        </Link>
        <Link
          to="/admin/system-variables"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <Settings className="w-4 h-4" />
          System Variables
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </nav>

      {/* Desktop User Profile */}
      <div className="hidden lg:flex flex-col items-center ml-4">
        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold">
          {userInitial}
        </div>
        <p className="text-xs mt-1">{userEmail}</p>
      </div>

      {/* Mobile/Tablet Menu */}
      <div
        className={`lg:hidden fixed inset-0 bg-black text-white transform transition-transform duration-300 z-40 flex flex-col items-center justify-start pt-20 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* User Profile */}
        <div className="flex items-center gap-3 mb-8 px-6 w-full max-w-xs">
          <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
            {userInitial}
          </div>
          <div className="text-left">
            <p className="font-medium">{userEmail}</p>
          </div>
        </div>

        <div className="w-full max-w-xs border-t border-white mb-6"></div>

        {/* Mobile Navigation Links */}
        <nav className="flex flex-col w-full max-w-xs gap-1">
          <Link
            to="/admin/analytics"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/admin/analytics"
            )}`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </Link>
          <Link
            to="/admin/user-management"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/admin/user-management"
            )}`}
          >
            <Users className="w-5 h-5" />
            User Management
          </Link>
          <Link
            to="/admin/file-management"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/admin/file-management"
            )}`}
          >
            <FileStack className="w-5 h-5" />
            File Management
          </Link>
          <Link
            to="/admin/requirement"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/admin/requirement"
            )}`}
          >
            <BellRing className="w-5 h-5" />
            Requirement
          </Link>
          <Link
            to="/admin/system-variables"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/admin/system-variables"
            )}`}
          >
            <Settings className="w-5 h-5" />
            System Variables
          </Link>
          
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="py-3 px-4 hover:bg-yellow-400 rounded flex items-center gap-3 text-left"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
