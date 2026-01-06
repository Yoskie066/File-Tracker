import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { CheckCircle, XCircle } from "lucide-react";

Modal.setAppElement("#root");

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    adminName: "",
    adminNumber: "",
    password: "",
    securityQuestion: "",
    securityAnswer: "",
  });

  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [modal, setModal] = useState({
    isOpen: false,
    type: "success", 
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Fetch security questions on component mount
  useEffect(() => {
    fetchSecurityQuestions();
  }, []);

  const fetchSecurityQuestions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/security-questions`);
      const data = await response.json();
      if (response.ok) {
        setSecurityQuestions(data.questions);
      }
    } catch (err) {
      console.error("Error fetching security questions:", err);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate admin name (minimum 2 characters) - CHANGED FROM 8 TO 2
    if (formData.adminName.length < 2) {
      newErrors.adminName = "Admin name must be at least 2 characters long";
    }
    
    // Validate admin number (minimum 2 digits, numbers only)
    const adminNumberRegex = /^\d{2,}$/;
    if (!adminNumberRegex.test(formData.adminNumber)) {
      newErrors.adminNumber = "Admin number must contain only numbers (minimum 2 digits)";
    }
    
    // Validate password
    if (formData.password.length < 4) {
      newErrors.password = "Password must be at least 4 characters long";
    }
    
    // Validate security question
    if (!formData.securityQuestion) {
      newErrors.securityQuestion = "Please select a security question";
    }
    
    // Validate security answer
    if (!formData.securityAnswer.trim()) {
      newErrors.securityAnswer = "Security answer is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Remove non-numeric characters for adminNumber
    if (name === "adminNumber") {
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

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          securityAnswer: formData.securityAnswer.trim()
        }),
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
        navigate("/auth/admin-login");
      }, 2000);

    } catch (err) {
      setModal({
        isOpen: true,
        type: "error",
        message: err.message,
      });
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Register</h1>
            <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">
              Welcome, Admin! Please Register Here.
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
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
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base ${
                  errors.adminName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your admin name (min 2 characters)" // CHANGED FROM 8 TO 2
                title="Admin name must be at least 2 characters long" // CHANGED FROM 8 TO 2
                required
              />
              {errors.adminName && (
                <p className="text-red-500 text-xs mt-1">{errors.adminName}</p>
              )}
            </div>

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
                placeholder="Enter your admin number (numbers only, min 2 digits)"
                title="Admin number must contain only numbers (minimum 2 digits)"
                required
              />
              {errors.adminNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.adminNumber}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 2 digits (numbers only)
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
                placeholder="Enter your password (min 4 characters)"
                title="Admin password must be at least 4 characters long"
                required
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 4 characters long
              </p>
            </div>

            {/* Security Question */}
            <div className="mb-4 sm:mb-6">
              <label htmlFor="securityQuestion" className="block text-gray-700 text-sm font-medium mb-2">
                Security Question:
              </label>
              <select
                id="securityQuestion"
                name="securityQuestion"
                value={formData.securityQuestion}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base ${
                  errors.securityQuestion ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select a security question</option>
                {securityQuestions.map((question, index) => (
                  <option key={index} value={question}>
                    {question}
                  </option>
                ))}
              </select>
              {errors.securityQuestion && (
                <p className="text-red-500 text-xs mt-1">{errors.securityQuestion}</p>
              )}
            </div>

            {/* Security Answer */}
            <div className="mb-4 sm:mb-6">
              <label htmlFor="securityAnswer" className="block text-gray-700 text-sm font-medium mb-2">
                Security Answer:
              </label>
              <input
                type="text"
                id="securityAnswer"
                name="securityAnswer"
                value={formData.securityAnswer}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base ${
                  errors.securityAnswer ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your security answer"
                required
              />
              {errors.securityAnswer && (
                <p className="text-red-500 text-xs mt-1">{errors.securityAnswer}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Answer can contain letters, numbers, and special characters
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-black hover:bg-yellow-500 text-white hover:text-black font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none text-sm sm:text-base ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? "Registering..." : "Register"}
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
            &copy; 2023 Admin Portal. All rights reserved.
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

export default AdminRegister;