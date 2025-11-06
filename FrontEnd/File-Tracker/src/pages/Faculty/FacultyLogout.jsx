import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tokenService from "../../services/tokenService";
import apiService from "../../services/apiService"

const FacultyLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutFaculty = async () => {
      const token = tokenService.getFacultyAccessToken();
      
      if (!token) {
        tokenService.clearFacultyTokens();
        return navigate("/auth/login");
      }

      try {
        // Call logout API
        await apiService.facultyApi("http://localhost:3000/api/faculty/logout", {
          method: "POST",
        });

        // Clear all faculty data from localStorage
        tokenService.clearFacultyTokens();
        
        console.log("✅ Faculty logged out successfully");
        
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