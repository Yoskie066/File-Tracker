import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  const userInitial = "U"; 
  const userEmail = "User"; 

  // Function to check if the link is active
  const isActive = (path) =>
    location.pathname === path ? "bg-yellow-400 text-black" : "";

  return (
    <header className="sticky top-0 bg-black text-white px-6 py-3 flex justify-between items-center shadow-md z-50">
      {/* Logo */}
      <Link to="/faculty-loaded" className="text-xl font-extrabold tracking-wide">
        File<span className="text-yellow-400">Tracker</span>
      </Link>

      {/* Hamburger Icon - Tablet & Mobile */}
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

      {/* Desktop Navigation (1000px above only) */}
      <nav className="hidden lg:flex gap-8 text-sm font-medium">
        <Link
          to="/faculty-loaded"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <Users className="w-4 h-4" />
          Faculty Loaded
        </Link>
        <Link
          to="/file-upload"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <Upload className="w-4 h-4" />
          File Upload
        </Link>
        <Link
          to="/file-history"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <FolderClock className="w-4 h-4" />
          File History
        </Link>
        <Link
          to="/task-deliverables"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <ClipboardList className="w-4 h-4" />
          Task Deliverables
        </Link>
        <Link
          to="/notification"
          className="flex items-center gap-1 hover:text-yellow-400 transition duration-200"
        >
          <Bell className="w-4 h-4" />
          Notification
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

      {/* Mobile/Tablet Fullscreen Menu */}
      <div
        className={`lg:hidden fixed inset-0 bg-black text-white transform transition-transform duration-300 z-40 flex flex-col items-center justify-start pt-20 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* User Profile in Mobile Menu */}
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
            to="/faculty-loaded"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/faculty-loaded"
            )}`}
          >
            <Users className="w-5 h-5" />
            Faculty Loaded
          </Link>
          <Link
            to="/file-upload"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/file-upload"
            )}`}
          >
            <Upload className="w-5 h-5" />
            File Upload
          </Link>
          <Link
            to="/file-history"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/file-history"
            )}`}
          >
            <FolderClock className="w-5 h-5" />
            File History
          </Link>
          <Link
            to="/task-deliverables"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/task-deliverables"
            )}`}
          >
            <ClipboardList className="w-5 h-5" />
            Task Deliverables
          </Link>
          <Link
            to="/notification"
            onClick={() => setIsOpen(false)}
            className={`py-3 px-4 rounded flex items-center gap-3 hover:bg-yellow-400 ${isActive(
              "/notification"
            )}`}
          >
            <Bell className="w-5 h-5" />
            Notification
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
