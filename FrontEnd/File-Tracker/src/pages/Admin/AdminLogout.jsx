import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tokenService from "../../services/tokenService";
import apiService from "../../services/apiService";

const AdminLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutAdmin = async () => {
      const token = tokenService.getAdminAccessToken();
      
      if (!token) {
        tokenService.clearAdminTokens();
        return navigate("/admin-login");
      }

      try {
        // Call logout API
        await apiService.adminApi("http://localhost:3000/api/admin/admin-logout", {
          method: "POST",
        });

        // Clear all admin data from localStorage
        tokenService.clearAdminTokens();
        
        console.log("✅ Admin logged out successfully");
        
        // Redirect to login page
        navigate("/admin-login");
      } catch (error) {
        console.error("Logout failed:", error);
        // Still clear tokens even if API call fails
        tokenService.clearAdminTokens();
        navigate("/admin-login");
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