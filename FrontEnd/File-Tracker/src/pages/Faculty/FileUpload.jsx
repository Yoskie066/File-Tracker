import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, Upload, FileText, Trash2 } from "lucide-react";
import tokenService from "../../services/tokenService";

Modal.setAppElement("#root");

export default function FileUpload() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [facultyLoadeds, setFacultyLoadeds] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);
  const [selectedFacultyLoad, setSelectedFacultyLoad] = useState(null); // Added for auto-sync

  const [formData, setFormData] = useState({
    file_name: "",
    document_type: "syllabus",
    tos_type: "",
    subject_code: "",
    subject_title: ""
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch faculty loadeds for dropdown
  const fetchFacultyLoadeds = async () => {
    try {
      if (!tokenService.isFacultyAuthenticated()) {
        console.error("No token found");
        showFeedback("error", "Please log in to upload files");
        return;
      }
  
      const response = await tokenService.authFetch(`${API_BASE_URL}/api/faculty/faculty-loaded`);
      
      if (!response.ok) throw new Error("Server responded with " + response.status);
      const result = await response.json();
      console.log("Fetched faculty loadeds:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setFacultyLoadeds(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setFacultyLoadeds([]);
      }
    } catch (err) {
      console.error("Error fetching faculty loadeds:", err);
      if (err.message === 'Token refresh failed') {
        showFeedback("error", "Session expired. Please log in again.");
        tokenService.clearFacultyTokens();
      } else {
        showFeedback("error", "Failed to load your subjects");
      }
      setFacultyLoadeds([]); 
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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle subject code selection - populate sections, semester, and academic year automatically
  const handleSubjectCodeChange = (e) => {
    const selectedSubjectCode = e.target.value;
    
    if (selectedSubjectCode) {
      // Find the faculty loaded entry for this subject
      const facultyLoaded = facultyLoadeds.find(fl => fl.subject_code === selectedSubjectCode);
      
      if (facultyLoaded) {
        setFormData(prev => ({
          ...prev,
          subject_code: selectedSubjectCode,
          subject_title: facultyLoaded.subject_title || ''
        }));
        
        // Set available sections for this subject (AUTO-SYNC from faculty load)
        setAvailableSections(facultyLoaded.course_sections || []);
        // Store the entire faculty load for displaying semester and academic year
        setSelectedFacultyLoad(facultyLoaded);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        subject_code: "",
        subject_title: ""
      }));
      setAvailableSections([]);
      setSelectedFacultyLoad(null);
    }
  };

  // Get unique subject codes from faculty loadeds
  const getUniqueSubjectCodes = () => {
    const uniqueSubjects = [];
    const seenCodes = new Set();
    
    facultyLoadeds.forEach(fl => {
      if (!seenCodes.has(fl.subject_code)) {
        seenCodes.add(fl.subject_code);
        uniqueSubjects.push({
          code: fl.subject_code,
          title: fl.subject_title,
          semester: fl.semester,
          school_year: fl.school_year
        });
      }
    });
    
    return uniqueSubjects;
  };

  // Handle file selection - MULTIPLE FILES
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      
      // Auto-fill file name with first file's name if empty
      if (!formData.file_name && files[0]) {
        setFormData(prev => ({
          ...prev,
          file_name: files[0].name.replace(/\.[^/.]+$/, "")
        }));
      }
    }
  };

  // Remove a single file
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearAllFiles = () => {
    setSelectedFiles([]);
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
      subject_code: "",
      subject_title: ""
    });
    setSelectedFiles([]);
    setAvailableSections([]);
    setSelectedFacultyLoad(null);
    
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle modal open
  const handleModalOpen = () => {
    const token = tokenService.getFacultyAccessToken();
    if (!token) {
      showFeedback("error", "Please log in to upload files");
      return;
    }
    fetchFacultyLoadeds();
    setShowModal(true);
  };

  // Handle form submission - UPDATED FOR MULTIPLE FILES
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      showFeedback("error", "Please select at least one file to upload");
      return;
    }

    if (!formData.subject_code) {
      showFeedback("error", "Please select a subject");
      return;
    }

    if (availableSections.length === 0) {
      showFeedback("error", "No course sections available for the selected subject");
      return;
    }

    if (formData.document_type === 'tos' && !formData.tos_type) {
      showFeedback("error", "Please select TOS type (Midterm or Final)");
      return;
    }

    setLoading(true);

    try {
      const token = tokenService.getFacultyAccessToken();
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const formDataToSend = new FormData();
      formDataToSend.append('file_name', formData.file_name);
      formDataToSend.append('document_type', formData.document_type);
      formDataToSend.append('subject_code', formData.subject_code);

      if (formData.document_type === 'tos' && formData.tos_type) {
        formDataToSend.append('tos_type', formData.tos_type);
      }

      // Append all files
      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      console.log("Sending form data:");
      console.log("- Files:", selectedFiles.length);
      console.log("- Subject:", formData.subject_code);
      console.log("- Sections (auto-sync):", availableSections.join(', '));
      console.log("- Semester (auto-sync):", selectedFacultyLoad?.semester);
      console.log("- Academic Year (auto-sync):", selectedFacultyLoad?.school_year);
      console.log("- Document Type:", formData.document_type);
      console.log("- TOS Type:", formData.tos_type || 'N/A');

      const response = await fetch(`${API_BASE_URL}/api/faculty/file-upload`, {
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
        showFeedback("success", `${result.data.files_uploaded} file(s) uploaded successfully for ${availableSections.length} course section(s)!`);
      } else {
        showFeedback("error", result.message || "Error uploading files");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      showFeedback("error", error.message || "Error uploading files");
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
            <li>• Supported file types: PDF, DOC, DOCX, XLS, XLSX, TXT, JPEG, PNG, PPT, PPTX</li>
            <li>• Required fields: Document Type, Subject, and at least one File</li>
            <li>• For TOS files, you must specify whether it's for Midterm or Final</li>
            <li>• Course sections are automatically synced from your Faculty Load</li>
            <li>• Semester and Academic Year are automatically synced from your Faculty Load</li>
            <li>• Files will be uploaded for ALL sections of the selected subject</li>
            <li>• Each file will be duplicated for each course section</li>
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
              {/* Subject Code Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Subject *
                </label>
                <select
                  value={formData.subject_code}
                  onChange={handleSubjectCodeChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  <option value="">Select subject</option>
                  {getUniqueSubjectCodes().map((subject) => (
                    <option key={subject.code} value={subject.code}>
                      {subject.code} {subject.title && `- ${subject.title}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-synced Course Sections, Semester, and Academic Year Display (READ-ONLY) */}
              {formData.subject_code && selectedFacultyLoad && (
                <div className="space-y-3">
                  {/* Course Sections Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Sections (Auto-Sync from Faculty Load)
                    </label>
                    <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                      <div className="flex flex-wrap gap-2">
                        {availableSections.map((section, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Each file will be duplicated for all {availableSections.length} section(s) automatically
                      </p>
                    </div>
                  </div>

                  {/* Semester and Academic Year Display */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Semester (Auto-Sync)
                      </label>
                      <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                        <div className="text-sm font-medium text-gray-800">
                          {selectedFacultyLoad.semester}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year (Auto-Sync)
                      </label>
                      <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                        <div className="text-sm font-medium text-gray-800">
                          {selectedFacultyLoad.school_year}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Display selected subject info */}
              {formData.subject_code && selectedFacultyLoad && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm font-medium text-green-800">Selected Course:</div>
                  <div className="text-sm text-green-700">
                    {formData.subject_code} 
                    {formData.subject_title && ` - ${formData.subject_title}`}
                    {availableSections.length > 0 && ` (${availableSections.length} section(s))`}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Auto-synced: {selectedFacultyLoad.semester}, {selectedFacultyLoad.school_year}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Enter file name"
                />
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

              {/* File Upload - MULTIPLE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Files *
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
                      You can select multiple files (PDF, DOC, DOCX, XLS, XLSX, TXT, JPEG, PNG, PPT, PPTX)
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
                      <p>• Files will be duplicated for each course section</p>
                      <p>• Total records created: {selectedFiles.length} files × {availableSections.length} sections = {selectedFiles.length * availableSections.length} records</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-sync notice */}
              {formData.subject_code && selectedFacultyLoad && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Auto-sync enabled:</strong> Course sections, semester, and academic year are automatically synced from your faculty load for {formData.subject_code}.
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
                  disabled={loading || selectedFiles.length === 0 || !formData.subject_code || availableSections.length === 0 || (formData.document_type === 'tos' && !formData.tos_type)}
                  className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? "Uploading..." 
                    : `Upload ${selectedFiles.length} File(s) for ${availableSections.length} Section(s)`}
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