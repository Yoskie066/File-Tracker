import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { CheckCircle, XCircle } from "lucide-react";

Modal.setAppElement("#root");

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const AdminForgotPassword = () => {
  const [formData, setFormData] = useState({
    adminNumber: "",
    securityQuestion: "",
    securityAnswer: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [fetchedQuestion, setFetchedQuestion] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("success"); 
  const [modalMessage, setModalMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSecurityFields, setShowSecurityFields] = useState(false);

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
    
    // Validate admin number format - minimum 2 digits, numbers only
    const adminNumberRegex = /^\d{2,}$/;
    if (!adminNumberRegex.test(formData.adminNumber)) {
      newErrors.adminNumber = "Admin number must contain only numbers (minimum 2 digits)";
    }
    
    // Validate security answer if security question is fetched
    if (showSecurityFields && !formData.securityAnswer.trim()) {
      newErrors.securityAnswer = "Security answer is required";
    }
    
    // Validate new password if security question is fetched
    if (showSecurityFields && formData.newPassword.length < 4) {
      newErrors.newPassword = "Password must be at least 4 characters long";
    }
    
    // Validate confirm password if security question is fetched
    if (showSecurityFields && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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

  // Automatically verify admin number when it's 2 or more digits
  useEffect(() => {
    const verifyAdminNumber = async () => {
      if (formData.adminNumber.length >= 2) {
        setIsVerifying(true);
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/admin/security-question?adminNumber=${formData.adminNumber}`
          );

          const data = await response.json();

          if (response.ok) {
            setFetchedQuestion(data.securityQuestion);
            setFormData(prev => ({ ...prev, securityQuestion: data.securityQuestion }));
            setShowSecurityFields(true);
            setErrors(prev => ({ ...prev, adminNumber: "" }));
          } else {
            setFetchedQuestion("");
            setShowSecurityFields(false);
            setErrors(prev => ({ ...prev, adminNumber: "Invalid admin number" }));
          }
        } catch (err) {
          setFetchedQuestion("");
          setShowSecurityFields(false);
          setErrors(prev => ({ ...prev, adminNumber: "Error verifying admin number" }));
        } finally {
          setIsVerifying(false);
        }
      } else if (formData.adminNumber.length > 0) {
        setErrors(prev => ({ ...prev, adminNumber: "Admin number must be at least 2 digits" }));
        setShowSecurityFields(false);
      } else {
        setErrors(prev => ({ ...prev, adminNumber: "" }));
        setShowSecurityFields(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      verifyAdminNumber();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.adminNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setModalType("error");
      setModalMessage("Please fix the errors in the form");
      setModalOpen(true);
      return;
    }

    if (!showSecurityFields) {
      setModalType("error");
      setModalMessage("Please enter a valid admin number first");
      setModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-forgot-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNumber: formData.adminNumber,
          securityQuestion: formData.securityQuestion,
          securityAnswer: formData.securityAnswer.trim(),
          newPassword: formData.newPassword
        }),
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reset Admin Password</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Enter your admin number to verify identity
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Admin Number */}
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
                title="Admin number must contain only numbers (minimum 2 digits)"
                required
              />
              {isVerifying && (
                <p className="text-blue-500 text-xs mt-1">Verifying admin number...</p>
              )}
              {errors.adminNumber && !isVerifying && (
                <p className="text-red-500 text-xs mt-1">{errors.adminNumber}</p>
              )}
              {!errors.adminNumber && formData.adminNumber.length >= 2 && !isVerifying && showSecurityFields && (
                <p className="text-green-500 text-xs mt-1">✓ Admin number verified</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 2 digits (numbers only)
              </p>
            </div>

            {/* Security Question Display - Only show when verified */}
            {showSecurityFields && fetchedQuestion && (
              <>
                <div className="mb-4 sm:mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Security Question:
                  </label>
                  <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 bg-gray-50 rounded-lg text-sm sm:text-base">
                    {fetchedQuestion}
                  </div>
                  <input
                    type="hidden"
                    name="securityQuestion"
                    value={formData.securityQuestion}
                  />
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
                </div>
                
                {/* New Password */}
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
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your new password"
                    required
                  />
                  {errors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 4 characters long
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="mb-6 sm:mb-8">
                  <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                    Confirm New Password:
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your new password"
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}
            
            <button
              type="submit"
              disabled={loading || !showSecurityFields || isVerifying}
              className={`w-full bg-black hover:bg-yellow-500 text-white hover:text-black font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none text-sm sm:text-base ${
                loading || !showSecurityFields || isVerifying ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
          
          {/* Login Section */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              Remember your password?
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
            &copy; 2025 Admin Portal. All rights reserved.
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