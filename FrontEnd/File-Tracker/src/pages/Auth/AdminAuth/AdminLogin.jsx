import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { CheckCircle, XCircle } from "lucide-react";
import TokenService from "../../../services/tokenService";

Modal.setAppElement("#root");

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ adminNumber: "", password: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success"); 
  const [modalMessage, setModalMessage] = useState("");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    // Validate admin number (at least 8 digits)
    const adminNumberRegex = /^\d{8,}$/;  // Changed from exactly 8 to minimum 8
    if (!adminNumberRegex.test(formData.adminNumber)) {
      newErrors.adminNumber = "Admin number must be at least 8 digits";
    }
    
    // Validate password
    if (formData.password.length < 4) {
      newErrors.password = "Password must be at least 4 characters long";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Remove non-numeric characters
    if (name === "adminNumber") {
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setModalType("error");
      setModalMessage("Please fix the errors in the form");
      setModalOpen(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-login`, {
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden mx-2 sm:mx-0">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">
              Secure access for IT Secretary and Admin accounts.
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4 sm:mb-6">
              <label htmlFor="adminNumber" className="block text-gray-700 text-sm font-medium mb-2">
                Admin Number:
              </label>
              <input
                type="text"
                id="adminNumber"
                name="adminNumber"
                value={formData.adminNumber}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base ${
                  errors.adminNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your admin number"
                title="Admin number must be at least 8 digits"
                required
              />
              {errors.adminNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.adminNumber}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 digits (numbers only)
              </p>
            </div>
            
            <div className="mb-4 sm:mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
                required
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-end mb-4 sm:mb-6">
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
              className="w-full bg-black hover:bg-yellow-500 text-white hover:text-black font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none text-sm sm:text-base"
            >
              Login
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              Don't have an account yet?
            </p>
            <button
              onClick={handleRegister}
              className="w-full bg-black hover:bg-yellow-500 text-white hover:text-black font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none text-sm sm:text-base"
            >
              Register
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            &copy; 2023 Admin Portal. All rights reserved.
          </p>
        </div>
        
        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          className="bg-white p-4 sm:p-6 rounded-xl max-w-xs sm:max-w-sm mx-auto shadow-lg"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <div className="flex flex-col items-center text-center">
            {modalType === "success" ? (
              <CheckCircle className="text-green-500 w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4" />
            ) : (
              <XCircle className="text-red-500 w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4" />
            )}
            <p className="text-base sm:text-lg font-semibold">{modalMessage}</p>
            <button
              onClick={() => setModalOpen(false)}
              className="mt-3 sm:mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-yellow-500 hover:text-black text-sm sm:text-base"
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