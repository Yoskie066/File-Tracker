import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

export default function Header({ onMenuClick }) {
  // Get admin info from localStorage
  const storedAdmin = JSON.parse(localStorage.getItem("admin"));
  const firstName = storedAdmin?.firstName || "";
  const middleInitial = storedAdmin?.middleInitial || "";
  const lastName = storedAdmin?.lastName || "";

  // Format: "First Name Last Name" or "First Name Middle Initial. Last Name" if middle initial exists
  const fullName = middleInitial && middleInitial.trim() !== ''
    ? `${firstName} ${middleInitial}. ${lastName}`
    : `${firstName} ${lastName}`;

  return (
    <header className="sticky top-0 bg-black text-white px-4 sm:px-6 py-3 flex justify-between items-center shadow-md z-50">
      {/* Logo - Left Side */}
      <Link to="/admin/analytics" className="text-xl font-extrabold tracking-wide">
        File<span className="text-yellow-400">Tracker</span>
      </Link>

      {/* Hamburger Menu for Mobile/Tablet - Right Side */}
      <button
        className="lg:hidden p-2"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Account Name - Right Side (hidden on mobile) */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm">
          {firstName?.charAt(0).toUpperCase() || "A"}
        </div>
        <div>
          <p className="font-semibold text-sm">{fullName}</p>
          <p className="text-xs text-gray-400">Administrator</p>
        </div>
      </div>
    </header>
  );
}