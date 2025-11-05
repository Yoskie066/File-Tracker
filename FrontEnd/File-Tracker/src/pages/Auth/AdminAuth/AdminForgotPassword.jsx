import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { CheckCircle, XCircle } from "lucide-react";

Modal.setAppElement("#root");

const AdminForgotPassword = () => {
  const [formData, setFormData] = useState({
    adminName: "",
    adminNumber: "",
    newPassword: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success"); 
  const [modalMessage, setModalMessage] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/api/admin/admin-forgot-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      setModalType("success");
      setModalMessage(data.message);
      setModalOpen(true);

      // Auto-redirect after success
      setTimeout(() => {
        setModalOpen(false);
        navigate('/auth/admin-login');
      }, 2000);

    } catch (err) {
      setModalType("error");
      setModalMessage(err.message);
      setModalOpen(true);
    }
  };

  const handleLogin = () => {
    navigate('/auth/admin-login');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden mx-2 sm:mx-0">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reset Admin Password</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Enter your details to reset your password
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Admin Name - First Field */}
            <div className="mb-4 sm:mb-6">
              <label htmlFor="adminName" className="block text-gray-700 text-sm font-medium mb-2">
                Admin Name:
              </label>
              <input
                type="text"
                id="adminName"
                name="adminName"
                value={formData.adminName}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
                placeholder="Enter your admin name"
                required
              />
            </div>

            {/* Admin Number - Second Field */}
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
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
                placeholder="Enter your admin number"
                required
              />
            </div>
            
            {/* New Password - Third Field */}
            <div className="mb-4 sm:mb-6">
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-2">
                New Password:
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
                placeholder="Enter your new password"
                minLength="4"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 4 characters long
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-black hover:bg-yellow-500 text-white hover:text-black font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none text-sm sm:text-base"
            >
              Reset Password
            </button>
          </form>
          
          {/* Login Section */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              You have an existing account?
            </p>
            <button
              onClick={handleLogin}
              className="w-full bg-black hover:bg-yellow-500 text-white hover:text-black font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none text-sm sm:text-base"
            >
              Login
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

export default AdminForgotPassword;