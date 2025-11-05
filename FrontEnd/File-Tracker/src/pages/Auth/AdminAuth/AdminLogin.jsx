import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { CheckCircle, XCircle } from "lucide-react";
import TokenService from "../../../services/tokenService";

Modal.setAppElement("#root");

const AdminLogin = () => {
  const [formData, setFormData] = useState({ adminNumber: "", password: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success"); 
  const [modalMessage, setModalMessage] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/api/admin/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store tokens using TokenService
      TokenService.setAdminAccessToken(data.accessToken);
      TokenService.setAdminRefreshToken(data.refreshToken);
      localStorage.setItem("admin", JSON.stringify(data.admin));

      setModalType("success");
      setModalMessage("Login successful!");
      setModalOpen(true);

      setTimeout(() => {
        setModalOpen(false);
        navigate("/admin/analytics");
      }, 2000);
    } catch (err) {
      setModalType("error");
      setModalMessage(err.message);
      setModalOpen(true);
    }
  };

  const handleRegister = () => {
    navigate('/auth/admin-register');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-600 mt-6">Secure access for IT Secretary and Admin accounts.</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="adminNumber" className="block text-gray-700 text-sm font-medium mb-2">
                Admin Number:
              </label>
              <input
                type="text"
                id="adminNumber"
                name="adminNumber"
                value={formData.adminNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                placeholder="Enter your admin number"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex justify-end mb-6">
              <button
                type="button"
                onClick={() => navigate('/auth/admin-forgot-password')}
                className="text-black hover:text-yellow-600 transition-colors text-sm font-medium"
              >
                Forgot Password?
              </button>
            </div>
            
            <button
              type="submit"
              className="w-full bg-black hover:bg-yellow-500 text-white hover:text-black font-medium py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none"
            >
              Login
            </button>
          </form>
          
          <div className="mt-3 text-center">
            <p className="text-gray-600 mb-4">
              Don't have an account yet?
            </p>
            <button
              onClick={handleRegister}
              className="w-full bg-black hover:bg-yellow-500 text-white hover:text-black font-medium py-3 px-6 rounded-lg transition-colors duration-300 focus:outline-none"
            >
              Register
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            &copy; 2023 Admin Portal. All rights reserved.
          </p>
        </div>
        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          className="bg-white p-6 rounded-xl max-w-sm mx-auto shadow-lg"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center text-center">
            {modalType === "success" ? (
              <CheckCircle className="text-green-500 w-12 h-12 mb-4" />
            ) : (
              <XCircle className="text-red-500 w-12 h-12 mb-4" />
            )}
            <p className="text-lg font-semibold">{modalMessage}</p>
            <button
              onClick={() => setModalOpen(false)}
              className="mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-yellow-500 hover:text-black"
            >
              Close
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminLogin;
