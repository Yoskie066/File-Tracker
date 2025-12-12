import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tokenService from "../../services/tokenService";
import apiService from "../../services/apiService";

const AdminLogout = () => {
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const logoutAdmin = async () => {
      const token = tokenService.getAdminAccessToken();
      
      try {
        if (token) {
          // Call logout API
          await apiService.adminApi(`${API_BASE_URL}/api/admin/admin-logout`, {
            method: "POST",
          });
        }
      } catch (error) {
        console.error("Logout API call failed:", error);
      } finally {
        // CRITICAL: Clear all admin data from localStorage
        tokenService.clearAdminTokens();
        localStorage.removeItem("admin");
        localStorage.removeItem("adminAccessToken");
        localStorage.removeItem("adminRefreshToken");
        
        console.log("Admin logged out successfully - all tokens cleared");
        
        // Replace history instead of push to prevent back navigation
        navigate("/auth/admin-login", { replace: true });
      }
    };

    logoutAdmin();
  }, [navigate, API_BASE_URL]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg">Logging out...</p>
      </div>
    </div>
  );
};

export default AdminLogout;