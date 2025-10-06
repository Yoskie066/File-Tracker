import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Users,
  FileStack,
  ClipboardCheck,
  BellRing,
  BarChart3,
  LogOut,
} from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
  localStorage.removeItem("admin");
  navigate("/admin-login");
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
      <Link to="/analytics" className="text-xl font-extrabold tracking-wide">
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
          to="/analytics"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Link>
        <Link
          to="/user-management"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <Users className="w-4 h-4" />
          User Management
        </Link>
        <Link
          to="/file-management"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <FileStack className="w-4 h-4" />
          File Management
        </Link>
        <Link
          to="/deliverables"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <ClipboardCheck className="w-4 h-4" />
          Deliverables
        </Link>
        <Link
          to="/requirement"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <BellRing className="w-4 h-4" />
          Requirement
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
            to="/analytics"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/analytics"
            )}`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </Link>
          <Link
            to="/user-management"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/user-management"
            )}`}
          >
            <Users className="w-5 h-5" />
            User Management
          </Link>
          <Link
            to="/file-management"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/file-management"
            )}`}
          >
            <FileStack className="w-5 h-5" />
            File Management
          </Link>
          <Link
            to="/deliverables"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/deliverables"
            )}`}
          >
            <ClipboardCheck className="w-5 h-5" />
            Deliverables
          </Link>
          <Link
            to="/requirement"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/requirement"
            )}`}
          >
            <BellRing className="w-5 h-5" />
            Requirement
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
