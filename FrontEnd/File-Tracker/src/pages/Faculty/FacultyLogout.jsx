import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FacultyLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutFaculty = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        await fetch("http://localhost:3000/api/faculty/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        localStorage.removeItem("token");
        localStorage.removeItem("faculty");

        navigate("/login");
      } catch (error) {
        console.error("Logout failed:", error);
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
