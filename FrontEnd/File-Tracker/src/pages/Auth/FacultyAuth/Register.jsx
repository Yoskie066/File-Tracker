import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { CheckCircle, XCircle } from "lucide-react";

Modal.setAppElement("#root");

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const FacultyRegister = () => {
  const [formData, setFormData] = useState({
    facultyName: "",
    facultyNumber: "",
    password: "",
  });

  const [modal, setModal] = useState({
    isOpen: false,
    type: "success", 
    message: "",
  });

  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    // Validate faculty name (minimum 8 characters)
    if (formData.facultyName.length < 8) {
      newErrors.facultyName = "Faculty name must be at least 8 characters long";
    }
    
    // Validate faculty number (at least 8 digits)
    const facultyNumberRegex = /^\d{8,}$/;  // Changed from exactly 8 to minimum 8
    if (!facultyNumberRegex.test(formData.facultyNumber)) {
      newErrors.facultyNumber = "Faculty number must be at least 8 digits";
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
    // Remove non-numeric characters for facultyNumber
    if (name === "facultyNumber") {
      const numericValue = value.replace(/\D/g, '');
      setFormData((prevState) => ({
        ...prevState,
        [name]: numericValue,
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setModal({
        isOpen: true,
        type: "error",
        message: "Please fix the errors in the form",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/faculty/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.errors?.[0] || "Registration failed");
      }

      setModal({
        isOpen: true,
        type: "success",
        message: "Registered successfully!",
      });

      setTimeout(() => {
        setModal({ ...modal, isOpen: false });
        navigate("/auth/login");
      }, 2000);

    } catch (err) {
      setModal({
        isOpen: true,
        type: "error",
        message: err.message,
      });
    }
  };

  const handleLogin = () => {
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden mx-2 sm:mx-0">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Faculty Register</h1>
            <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">
              Welcome, Faculty! Please Register Here.
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4 sm:mb-6">
              <label htmlFor="facultyName" className="block text-gray-700 text-sm font-medium mb-2">
                Faculty Name:
              </label>
              <input
                type="text"
                id="facultyName"
                name="facultyName"
                value={formData.facultyName}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base ${
                  errors.facultyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your faculty name"
                title="Faculty name must be at least 8 characters long"
                required
              />
              {errors.facultyName && (
                <p className="text-red-500 text-xs mt-1">{errors.facultyName}</p>
              )}
            </div>

            <div className="mb-4 sm:mb-6">
              <label htmlFor="facultyNumber" className="block text-gray-700 text-sm font-medium mb-2">
                Faculty Number:
              </label>
              <input
                type="text"
                id="facultyNumber"
                name="facultyNumber"
                value={formData.facultyNumber}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base ${
                  errors.facultyNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your faculty number"
                title="Faculty number must be at least 8 digits"
                required
              />
              {errors.facultyNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.facultyNumber}</p>
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
                title="Faculty password must be at least 4 characters long"
                required
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 4 characters long
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-black hover:bg-yellow-500 text-white hover:text-black font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none text-sm sm:text-base"
            >
              Register
            </button>
          </form>
          
          <div className="mt-4 text-center">
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
            &copy; 2023 Faculty Portal. All rights reserved.
          </p>
        </div>
        
        {/* Modal */}
        <Modal
          isOpen={modal.isOpen}
          onRequestClose={() => setModal({ ...modal, isOpen: false })}
          className="bg-white p-4 sm:p-6 rounded-xl max-w-xs sm:max-w-sm mx-auto shadow-lg"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <div className="flex flex-col items-center text-center">
            {modal.type === "success" ? (
              <CheckCircle className="text-green-500 w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4" />
            ) : (
              <XCircle className="text-red-500 w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4" />
            )}
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">{modal.message}</h2>
            <button
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="mt-3 sm:mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-yellow-500 hover:text-black transition-colors text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default FacultyRegister;