import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, Upload, Trash2 } from "lucide-react";
import tokenService from "../../services/tokenService";

Modal.setAppElement("#root");

export default function FileUpload() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [facultyLoads, setFacultyLoads] = useState([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);
  const [selectedFacultyLoad, setSelectedFacultyLoad] = useState(null);

  const [formData, setFormData] = useState({
    file_name: "",
    document_type: "syllabus",
    tos_type: "",
    faculty_loaded_id: "",
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      if (!tokenService.isFacultyAuthenticated()) {
        showFeedback("error", "Please log in to access file upload");
        return false;
      }
      return true;
    };
    
    checkAuth();
  }, []);

  // Fetch faculty loads for dropdown
  const fetchFacultyLoads = async () => {
    try {
      // Check authentication first
      if (!tokenService.isFacultyAuthenticated()) {
        console.error("No token found");
        showFeedback("error", "Please log in to upload files");
        return;
      }

      // Get fresh token
      const token = tokenService.getFacultyAccessToken();
      if (!token) {
        showFeedback("error", "Session expired. Please log in again.");
        tokenService.clearFacultyTokens();
        window.location.href = "/auth/login";
        return;
      }

      console.log("Fetching faculty loads with token...");
      
      const response = await fetch(`${API_BASE_URL}/api/faculty/faculty-loaded/file-upload`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          showFeedback("error", "Session expired. Please log in again.");
          tokenService.clearFacultyTokens();
          window.location.href = "/auth/login";
          return;
        }
        throw new Error("Server responded with " + response.status);
      }
      
      const result = await response.json();
      console.log("Fetched faculty loads for file upload:", result);
      
      if (result.success && Array.isArray(result.data)) {
        // Remove duplicates to show only unique subject combinations
        const uniqueLoads = result.data.reduce((acc, current) => {
          const x = acc.find(item => item.displayText === current.displayText);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);
        
        setFacultyLoads(uniqueLoads);
      } else {
        console.error("Unexpected API response format:", result);
        setFacultyLoads([]);
      }
    } catch (err) {
      console.error("Error fetching faculty loads:", err);
      if (err.message.includes('401') || err.message === 'Token refresh failed') {
        showFeedback("error", "Session expired. Please log in again.");
        tokenService.clearFacultyTokens();
        window.location.href = "/auth/login";
      } else {
        showFeedback("error", "Failed to load your subjects: " + err.message);
      }
      setFacultyLoads([]);
    }
  };

  // Document type options
  const documentTypeOptions = [
    { value: "syllabus", label: "Syllabus" },
    { value: "tos", label: "Table of Specifications (TOS)" },
    { value: "midterm-exam", label: "Midterm Exam" },
    { value: "final-exam", label: "Final Exam" },
    { value: "instructional-materials", label: "Instructional Materials" }
  ];

  // TOS type options
  const tosTypeOptions = [
    { value: "midterm", label: "TOS-Midterm" },
    { value: "final", label: "TOS-Final" }
  ];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'document_type' && value !== 'tos') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        tos_type: ""
      }));
    } else if (name !== 'file_name') { // Exclude file_name from manual changes
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle faculty load selection
  const handleFacultyLoadChange = (e) => {
    const selectedFacultyLoadId = e.target.value;
    
    if (selectedFacultyLoadId) {
      // Find the faculty load entry
      const facultyLoad = facultyLoads.find(fl => fl.faculty_loaded_id === selectedFacultyLoadId);
      
      if (facultyLoad) {
        setFormData(prev => ({
          ...prev,
          faculty_loaded_id: selectedFacultyLoadId
        }));
        
        // Store the entire faculty load for displaying all details
        setSelectedFacultyLoad(facultyLoad);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        faculty_loaded_id: ""
      }));
      setSelectedFacultyLoad(null);
    }
  };

  // Handle file selection - MULTIPLE FILES with 25MB limit check
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB in bytes
    
    // Check each file size
    const oversizedFiles = files.filter(file => file.size > MAX_SIZE);
    if (oversizedFiles.length > 0) {
      showFeedback("error", `File "${oversizedFiles[0].name}" exceeds 25MB limit. Maximum file size is 25MB.`);
      // Clear the file input
      e.target.value = '';
      return;
    }
    
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      
      // Auto-fill file name with first file's name (without extension)
      if (files[0]) {
        const fileNameWithoutExtension = files[0].name.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({
          ...prev,
          file_name: fileNameWithoutExtension
        }));
      }
    }
  };

  // Remove a single file
  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    // Update file name based on new first file
    if (newFiles.length > 0) {
      const fileNameWithoutExtension = newFiles[0].name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({
        ...prev,
        file_name: fileNameWithoutExtension
      }));
    } else {
      // Clear file name if no files left
      setFormData(prev => ({
        ...prev,
        file_name: ""
      }));
    }
  };

  // Clear all files
  const clearAllFiles = () => {
    setSelectedFiles([]);
    // Clear file name
    setFormData(prev => ({
      ...prev,
      file_name: ""
    }));
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Show feedback modal
  const showFeedback = (type, message) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setFeedbackModalOpen(true);
  };

  // Preview file
  const handlePreviewFile = (file) => {
    setFileToPreview(file);
    setPreviewModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      file_name: "",
      document_type: "syllabus",
      tos_type: "",
      faculty_loaded_id: "",
    });
    setSelectedFiles([]);
    setSelectedFacultyLoad(null);
    
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle modal open
  const handleModalOpen = () => {
    // Check authentication
    if (!tokenService.isFacultyAuthenticated()) {
      showFeedback("error", "Please log in to upload files");
      return;
    }
    
    // Get fresh token
    const token = tokenService.getFacultyAccessToken();
    if (!token) {
      showFeedback("error", "Session expired. Please log in again.");
      tokenService.clearFacultyTokens();
      window.location.href = "/auth/login";
      return;
    }
    
    fetchFacultyLoads();
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authentication
    if (!tokenService.isFacultyAuthenticated()) {
      showFeedback("error", "Please log in to upload files");
      return;
    }
    
    // Get fresh token
    const token = tokenService.getFacultyAccessToken();
    if (!token) {
      showFeedback("error", "Session expired. Please log in again.");
      tokenService.clearFacultyTokens();
      window.location.href = "/auth/login";
      return;
    }

    if (selectedFiles.length === 0) {
      showFeedback("error", "Please select at least one file to upload");
      return;
    }

    if (!formData.faculty_loaded_id) {
      showFeedback("error", "Please select a subject");
      return;
    }

    if (!selectedFacultyLoad?.course) {
      showFeedback("error", "No course found for the selected subject");
      return;
    }

    if (formData.document_type === 'tos' && !formData.tos_type) {
      showFeedback("error", "Please select TOS type (Midterm or Final)");
      return;
    }

    // Check total size
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total limit
    if (totalSize > MAX_TOTAL_SIZE) {
      showFeedback("error", "Total file size exceeds 100MB limit. Please upload smaller files or fewer files.");
      return;
    }

    setLoading(true);

    try {
      console.log("Preparing to upload files with token...");
      
      const formDataToSend = new FormData();
      formDataToSend.append('file_name', formData.file_name);
      formDataToSend.append('document_type', formData.document_type);
      formDataToSend.append('faculty_loaded_id', formData.faculty_loaded_id);

      if (formData.document_type === 'tos' && formData.tos_type) {
        formDataToSend.append('tos_type', formData.tos_type);
      }

      // Append all files
      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      console.log("Sending form data:");
      console.log("- Faculty Load ID:", formData.faculty_loaded_id);
      console.log("- Files:", selectedFiles.length);
      console.log("- File Name:", formData.file_name);
      console.log("- Subject:", selectedFacultyLoad?.subject_code);
      console.log("- Course (auto-sync):", selectedFacultyLoad?.course);
      console.log("- Semester (auto-sync):", selectedFacultyLoad?.semester);
      console.log("- Academic Year (auto-sync):", selectedFacultyLoad?.school_year);
      console.log("- Document Type:", formData.document_type);
      console.log("- TOS Type:", formData.tos_type || 'N/A');
      console.log("- Total size:", (totalSize / (1024 * 1024)).toFixed(2), "MB");

      const response = await fetch(`${API_BASE_URL}/api/faculty/file-upload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: formDataToSend,
      });

      const result = await response.json();
      console.log("Upload response:", result);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(result.message || `Upload failed: ${response.status}`);
      }

      if (result.success) {
        resetForm();
        setTimeout(() => {
          setShowModal(false);
          showFeedback("success", 
            `${result.data.files_uploaded} file(s) uploaded successfully for: ${selectedFacultyLoad.subject_code} - ${selectedFacultyLoad.course} (${selectedFacultyLoad.semester}, ${selectedFacultyLoad.school_year})!`
          );
        }, 500);
      } else {
        showFeedback("error", result.message || "Error uploading files");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      
      if (error.message.includes('Session expired') || error.message.includes('401')) {
        showFeedback("error", "Session expired. Please log in again.");
        tokenService.clearFacultyTokens();
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
      } else {
        showFeedback("error", error.message || "Error uploading files");
      }
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

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    return '📎';
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">File Upload</h1>
            <p className="text-sm text-gray-500">
              Upload and store teaching files securely in one place
            </p>
          </div>
          <button
            onClick={handleModalOpen}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-yellow-500 hover:text-black transition-colors duration-200 flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload File(s)
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Upload Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• <strong>Maximum file size:</strong> 25MB per file</li>
            <li>• <strong>Supported file types:</strong> PDF, DOC, DOCX, XLS, XLSX, TXT, JPEG, PNG, PPT, PPTX</li>
            <li>• Required fields: Document Type, Subject, and at least one File</li>
            <li>• For TOS files, you must specify whether it's for Midterm or Final</li>
            <li>• Course, Semester and Academic Year are automatically synced from your Faculty Load</li>
            <li>• Files will be automatically associated with your account</li>
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
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                File Upload
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Faculty Load Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Subject *
                </label>
                <select
                  value={formData.faculty_loaded_id}
                  onChange={handleFacultyLoadChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  <option value="">Select subject</option>
                  {facultyLoads.map((facultyLoad) => (
                    <option 
                      key={facultyLoad.uniqueKey || facultyLoad.faculty_loaded_id} 
                      value={facultyLoad.faculty_loaded_id}
                    >
                      {`${facultyLoad.subject_code} - ${facultyLoad.subject_title}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a subject to see the associated course, semester, and academic year details
                </p>
              </div>

              {/* Display selected faculty load details - GRAY CONTAINER */}
              {selectedFacultyLoad && (
                <div className="space-y-4 p-4 bg-gray-50 border border-gray-300 rounded-md">
                  <h4 className="text-sm font-semibold text-gray-700">Selected Course Details:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Subject Code & Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Subject Code & Title
                      </label>
                      <div className="p-2 bg-gray-100 border border-gray-400 rounded">
                        <div className="text-sm font-medium text-gray-800">
                          {selectedFacultyLoad.subject_code} - {selectedFacultyLoad.subject_title}
                        </div>
                      </div>
                    </div>
                    
                    {/* Course */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Course
                      </label>
                      <div className="p-2 bg-gray-100 border border-gray-400 rounded">
                        <div className="text-sm font-medium text-gray-800">
                          {selectedFacultyLoad.course}
                        </div>
                      </div>
                    </div>

                    {/* Semester */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Semester
                      </label>
                      <div className="p-2 bg-gray-100 border border-gray-400 rounded">
                        <div className="text-sm font-medium text-gray-800">
                          {selectedFacultyLoad.semester}
                        </div>
                      </div>
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Academic Year
                      </label>
                      <div className="p-2 bg-gray-100 border border-gray-400 rounded">
                        <div className="text-sm font-medium text-gray-800">
                          {selectedFacultyLoad.school_year}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Note */}
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-300">
                    <strong>Note:</strong> Course, semester, and academic year will be auto-synced for file records
                  </div>
                </div>
              )}

              {/* File Name - READ ONLY */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name *
                </label>
                <input
                  type="text"
                  name="file_name"
                  value={formData.file_name}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="File name will appear here when you select a file"
                />
                <p className="text-xs text-gray-500 mt-1">
                  File name is automatically set from the first selected file and cannot be edited
                </p>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type *
                </label>
                <select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  {documentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* TOS Type */}
              {formData.document_type === 'tos' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TOS Type *
                  </label>
                  <select
                    name="tos_type"
                    value={formData.tos_type}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                  >
                    <option value="">Select TOS type</option>
                    {tosTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* File Upload - MULTIPLE with size limit warning */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Files * (Max 25MB per file)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    required={selectedFiles.length === 0}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {selectedFiles.length > 0 
                        ? `${selectedFiles.length} file(s) selected` 
                        : "Click to select files"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum 25MB per file • Multiple files allowed
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Files larger than 25MB will be rejected automatically
                    </p>
                  </label>
                </div>
                
                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Selected Files ({selectedFiles.length})
                      </span>
                      <button
                        type="button"
                        onClick={clearAllFiles}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-lg">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="text-sm font-medium text-gray-700 truncate cursor-pointer hover:text-blue-600"
                                  onClick={() => handlePreviewFile(file)}
                                >
                                  {file.name}
                                </span>
                                {index === 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    Primary
                                  </span>
                                )}
                                {file.size > 25 * 1024 * 1024 && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                    Too Large!
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Size: {formatFileSize(file.size)} | Type: {file.type}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      <p>• First file name is used as the File Name for all files</p>
                      <p>• Files will be uploaded for: {selectedFacultyLoad ? 
                        `${selectedFacultyLoad.subject_code} - ${selectedFacultyLoad.course} (${selectedFacultyLoad.semester}, ${selectedFacultyLoad.school_year})` : 
                        'Not selected'}</p>
                      <p>• Total records created: {selectedFiles.length} files</p>
                      <p className="text-red-500 font-medium">• Files larger than 25MB will be automatically rejected</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-sync notice */}
              {selectedFacultyLoad && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Auto-sync enabled:</strong> Course ({selectedFacultyLoad.course}), semester ({selectedFacultyLoad.semester}), and academic year ({selectedFacultyLoad.school_year}) will be automatically synced for file records.
                  </p>
                </div>
              )}

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
                  disabled={loading || selectedFiles.length === 0 || !formData.faculty_loaded_id || !selectedFacultyLoad?.course || (formData.document_type === 'tos' && !formData.tos_type)}
                  className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    `Upload ${selectedFiles.length} File(s) for ${selectedFacultyLoad ? 
                      `${selectedFacultyLoad.subject_code} - ${selectedFacultyLoad.course}` : 
                      'Selected Course'}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* File Preview Modal */}
        <Modal
          isOpen={previewModalOpen}
          onRequestClose={() => setPreviewModalOpen(false)}
          className="bg-white rounded-lg max-w-md w-full mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          {fileToPreview && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  File Preview
                </h3>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl mb-4">
                    {getFileIcon(fileToPreview.type)}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 break-all">
                    {fileToPreview.name}
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">File Size:</span>
                    <span className="text-sm font-medium">{formatFileSize(fileToPreview.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">File Type:</span>
                    <span className="text-sm font-medium">{fileToPreview.type || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Modified:</span>
                    <span className="text-sm font-medium">
                      {new Date(fileToPreview.lastModified).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {fileToPreview.size > 25 * 1024 * 1024 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700 font-medium">
                      ⚠️ This file exceeds the 25MB limit and will be rejected during upload.
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => setPreviewModalOpen(false)}
                    className="w-full bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
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