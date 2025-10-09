import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutAdmin = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/admin-login");

      try {
        await fetch("http://localhost:3000/api/admin/admin-logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Clear local storage
        localStorage.removeItem("token");
        localStorage.removeItem("admin");

        // Redirect to login page
        navigate("/admin-login");
      } catch (error) {
        console.error("Logout failed:", error);
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
