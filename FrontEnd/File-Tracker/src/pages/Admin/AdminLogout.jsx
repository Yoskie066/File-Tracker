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
      
      if (!token) {
        tokenService.clearAdminTokens();
        return navigate("/auth/admin-login");
      }

      try {
        // Call logout API
        await apiService.adminApi(`${API_BASE_URL}/api/admin/admin-logout`, {
          method: "POST",
        });

        // Clear all admin data from localStorage
        tokenService.clearAdminTokens();
        
        console.log("Admin logged out successfully");
        
        // Redirect to login page
        navigate("/auth/admin-login");
      } catch (error) {
        console.error("Logout failed:", error);
        // Still clear tokens even if API call fails
        tokenService.clearAdminTokens();
        navigate("/auth/admin-login");
      }
    };

    logoutAdmin();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-gray-700 text-lg">Logging out...</p>
    </div>
  );
};

export default AdminLogout;