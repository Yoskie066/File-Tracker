import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, Upload, FileText, User } from "lucide-react";

Modal.setAppElement("#root");

export default function FileUpload() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [facultyInfo, setFacultyInfo] = useState(null);
  const [facultyLoadeds, setFacultyLoadeds] = useState([]);

  const [formData, setFormData] = useState({
    file_name: "",
    file_type: "syllabus",
    subject_code: "",
    course_section: ""
  });

  useEffect(() => {
    const fetchFacultyInfo = async () => {
      try {
        const token = localStorage.getItem("facultyToken"); 
        console.log("Sending token:", token);
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await fetch("http://localhost:3000/api/faculty/faculty-profile", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          setFacultyInfo(result.faculty || result);
        } else {
          console.error("Failed to fetch faculty info");
        }
      } catch (error) {
        console.error("Error fetching faculty info:", error);
      }
    };

    fetchFacultyInfo();
  }, []);

  // Fetch faculty loadeds for dropdown
  const fetchFacultyLoadeds = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/faculty/faculty-loaded"); 
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched faculty loadeds:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setFacultyLoadeds(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setFacultyLoadeds([]);
      }
    } catch (err) {
      console.error("Error fetching faculty loadeds:", err);
      setFacultyLoadeds([]); 
    }
  };

  // File type options
  const fileTypeOptions = [
    { value: "syllabus", label: "Syllabus" },
    { value: "tos", label: "Table of Specifications (TOS)" },
    { value: "midterm-exam", label: "Midterm Exam" },
    { value: "final-exam", label: "Final Exam" },
    { value: "instructional-materials", label: "Instructional Materials" }
  ];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle faculty loaded selection
  const handleFacultyLoadedChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const [subjectCode, courseSection] = selectedId.split('|');
      setFormData(prev => ({
        ...prev,
        subject_code: subjectCode,
        course_section: courseSection
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        subject_code: "",
        course_section: ""
      }));
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Set file name as default if not provided
      if (!formData.file_name) {
        setFormData(prev => ({
          ...prev,
          file_name: file.name.replace(/\.[^/.]+$/, "") 
        }));
      }
    }
  };

  // Show feedback modal
  const showFeedback = (type, message) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setFeedbackModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      file_name: "",
      file_type: "syllabus",
      subject_code: "",
      course_section: ""
    });
    setSelectedFile(null);
    
    // Reset file input
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle modal open - fetch faculty loadeds when opening modal
  const handleModalOpen = () => {
    if (!facultyInfo) {
      showFeedback("error", "Please log in to upload files");
      return;
    }
    fetchFacultyLoadeds();
    setShowModal(true);
  };

  // Handle form submission - UPDATED with subject_code and course_section
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showFeedback("error", "Please select a file to upload");
      return;
    }

    if (!facultyInfo) {
      showFeedback("error", "Please log in to upload files");
      return;
    }

    if (!formData.subject_code || !formData.course_section) {
      showFeedback("error", "Please select a subject and course section");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('facultyToken'); 
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const formDataToSend = new FormData();
      formDataToSend.append('file_name', formData.file_name);
      formDataToSend.append('file_type', formData.file_type);
      formDataToSend.append('subject_code', formData.subject_code);
      formDataToSend.append('course_section', formData.course_section);
      formDataToSend.append('file', selectedFile);

      const response = await fetch("http://localhost:3000/api/faculty/file-upload", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
      });

      const result = await response.json();
      console.log("Upload response:", result);

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        resetForm();
        setShowModal(false);
        showFeedback("success", "File uploaded successfully!");
      } else {
        showFeedback("error", result.message || "Error uploading file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showFeedback("error", error.message || "Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">File Upload</h1>
            <p className="text-sm text-gray-500">
              Upload your course files and deliverables
            </p>
            {facultyInfo && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Uploading as: <strong>{facultyInfo.facultyName}</strong></span>
              </div>
            )}
          </div>
          <button
            onClick={handleModalOpen}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-yellow-500 hover:text-black transition-colors duration-200 flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload File
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Upload Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Supported file types: PDF, DOC, DOCX, XLS, XLSX, TXT, JPEG, PNG, PPT, PPTX</li>
            <li>• Required fields: File Name, File Type, Subject & Section, and the File itself</li>
            <li>• Files will be automatically associated with your account and selected course</li>
            <li>• Files will be reviewed and status updated accordingly</li>
          </ul>
        </div>

        {/* Upload Modal */}
        <Modal
          isOpen={showModal}
          onRequestClose={() => {
            setShowModal(false);
            resetForm();
          }}
          className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Upload File
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Faculty Info Display */}
            {facultyInfo && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Uploading as: {facultyInfo.facultyName}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Faculty ID: {facultyInfo.facultyId}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Faculty Loaded Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Subject & Section *
                </label>
                <select
                  onChange={handleFacultyLoadedChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  <option value="">Select subject and section</option>
                  {facultyLoadeds.map((facultyLoaded) => (
                    <option 
                      key={`${facultyLoaded.subject_code}|${facultyLoaded.course_section}`}
                      value={`${facultyLoaded.subject_code}|${facultyLoaded.course_section}`}
                    >
                      {facultyLoaded.subject_code} - {facultyLoaded.course_section} 
                      {facultyLoaded.subject_title && ` (${facultyLoaded.subject_title})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display selected subject and section */}
              {(formData.subject_code || formData.course_section) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm font-medium text-green-800">Selected Course:</div>
                  <div className="text-sm text-green-700">
                    {formData.subject_code} - {formData.course_section}
                  </div>
                </div>
              )}

              {/* File Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name *
                </label>
                <input
                  type="text"
                  name="file_name"
                  value={formData.file_name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Enter file name"
                />
              </div>

              {/* File Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Type *
                </label>
                <select
                  name="file_type"
                  value={formData.file_type}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  {fileTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : "Click to select file"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, XLS, XLSX, TXT, JPEG, PNG, PPT, PPTX formats allowed
                    </p>
                  </label>
                </div>
                
                {/* File Info */}
                {selectedFile && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Size: {formatFileSize(selectedFile.size)} | Type: {selectedFile.type}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedFile || !facultyInfo || !formData.subject_code || !formData.course_section}
                  className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Feedback Modal */}
        <Modal
          isOpen={feedbackModalOpen}
          onRequestClose={() => setFeedbackModalOpen(false)}
          className="bg-white p-6 rounded-xl max-w-sm mx-auto shadow-lg"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="flex flex-col items-center text-center">
            {feedbackType === "success" ? (
              <CheckCircle className="text-green-500 w-12 h-12 mb-4" />
            ) : (
              <XCircle className="text-red-500 w-12 h-12 mb-4" />
            )}
            <p className="text-lg font-semibold text-gray-800 mb-2">{feedbackMessage}</p>
            <button
              onClick={() => setFeedbackModalOpen(false)}
              className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-300"
            >
              Close
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}