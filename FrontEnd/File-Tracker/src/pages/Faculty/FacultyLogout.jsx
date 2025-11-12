import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tokenService from "../../services/tokenService";
import apiService from "../../services/apiService"

const FacultyLogout = () => {
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const logoutFaculty = async () => {
      const token = tokenService.getFacultyAccessToken();
      
      if (!token) {
        tokenService.clearFacultyTokens();
        return navigate("/auth/login");
      }

      try {
        // Call logout API
        await apiService.facultyApi(`${API_BASE_URL}/api/faculty/logout`, {
          method: "POST",
        });

        // Clear all faculty data from localStorage
        tokenService.clearFacultyTokens();
        
        console.log("Faculty logged out successfully");
        
        // Redirect to login page
        navigate("/auth/login");
      } catch (error) {
        console.error("Logout failed:", error);
        // Still clear tokens even if API call fails
        tokenService.clearFacultyTokens();
        navigate("/auth/login");
      }
    };

    logoutFaculty();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-gray-700 text-lg">Logging out...</p>
    </div>
  );
};

export default FacultyLogout;