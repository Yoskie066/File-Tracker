import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Trash2, Download, Eye } from "lucide-react";

Modal.setAppElement("#root");

export default function FileManagement() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const filesPerPage = 10;

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // File preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);

  // Fetch files from backend - FIXED URL
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/admin/file-management");
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched files:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setFiles(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setFiles([]);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Show feedback modal
  const showFeedback = (type, message) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setFeedbackModalOpen(true);
  };

  // Handle download file - FIXED URL
  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/file-management/${fileId}/download`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error downloading file:", error);
      showFeedback("error", "Error downloading file");
    }
  };

  // Handle preview file
  const handlePreview = (file) => {
    setFileToPreview(file);
    setPreviewModalOpen(true);
  };

  // Handle delete file - FIXED URL
  const handleDelete = async (fileId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/file-management/${fileId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchFiles();
        showFeedback("success", "File deleted successfully!");
      } else {
        showFeedback("error", result.message || "Error deleting file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      showFeedback("error", "Error deleting file");
    }
    setDeleteModalOpen(false);
    setFileToDelete(null);
    setActionDropdown(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (fileId) => {
    setFileToDelete(fileId);
    setDeleteModalOpen(true);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get file type label
  const getFileTypeLabel = (fileType) => {
    const typeMap = {
      'syllabus': 'Syllabus',
      'tos': 'TOS',
      'midterm-exam': 'Midterm Exam',
      'final-exam': 'Final Exam',
      'instructional-materials': 'Instructional Materials'
    };
    return typeMap[fileType] || fileType;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Search filter
  const filteredFiles = (Array.isArray(files) ? files : [])
    .filter((file) =>
      [file.file_id, file.faculty_name, file.file_name, file.file_type, file.status]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const currentFiles = filteredFiles.slice(startIndex, startIndex + filesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Calculate stats
  const fileStats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    completed: files.filter(f => f.status === 'completed').length,
    rejected: files.filter(f => f.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">File Management</h1>
            <p className="text-sm text-gray-500">
              Manage and track uploaded files
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Files</div>
            <div className="text-2xl font-bold text-blue-800">{fileStats.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">{fileStats.pending}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Completed</div>
            <div className="text-2xl font-bold text-green-800">{fileStats.completed}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-600 text-sm font-medium">Rejected</div>
            <div className="text-2xl font-bold text-red-800">{fileStats.rejected}</div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">File ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Faculty Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">File Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">File Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">File Size</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Status</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Uploaded At</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentFiles.length > 0 ? (
                currentFiles.map((file) => (
                  <tr key={file._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{file.file_id}</td>
                    <td className="px-4 py-3 text-gray-700">{file.faculty_name}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{file.file_name}</td>
                    <td className="px-4 py-3 text-gray-700">{getFileTypeLabel(file.file_type)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatFileSize(file.file_size)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                        {file.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(file.uploaded_at)}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === file.file_id ? null : file.file_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === file.file_id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handlePreview(file)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Details
                          </button>
                          <button
                            onClick={() => handleDownload(file.file_id, file.original_name)}
                            className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </button>
                          <button
                            onClick={() => confirmDelete(file.file_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 font-medium">
                    {loading ? "Loading files..." : "No files found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentFiles.length > 0 ? (
            currentFiles.map((file) => (
              <div key={file._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">{file.file_name}</h2>
                    <p className="text-sm text-gray-600 font-mono">ID: {file.file_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                      {file.status}
                    </span>
                    
                    {/* Mobile Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === file.file_id ? null : file.file_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === file.file_id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handlePreview(file)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Details
                          </button>
                          <button
                            onClick={() => handleDownload(file.file_id, file.original_name)}
                            className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </button>
                          <button
                            onClick={() => confirmDelete(file.file_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Faculty:</span>
                    <p className="font-medium">{file.faculty_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium">{getFileTypeLabel(file.file_type)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <p className="font-medium">{formatFileSize(file.file_size)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Uploaded:</span>
                    <p className="font-medium text-xs">{formatDate(file.uploaded_at)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              {loading ? "Loading files..." : "No files found."}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentFiles.length} of {filteredFiles.length} files
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-yellow-400 hover:text-black border-black"
              }`}
            >
              Previous
            </button>
            <span className="text-gray-600 text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                currentPage === totalPages || totalPages === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-yellow-400 hover:text-black border-black"
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {/* File Preview Modal */}
        <Modal
          isOpen={previewModalOpen}
          onRequestClose={() => setPreviewModalOpen(false)}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          {fileToPreview && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  File Details
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{fileToPreview.file_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fileToPreview.status)}`}>
                      {fileToPreview.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Faculty Name</label>
                  <p className="mt-1 text-sm text-gray-900">{fileToPreview.faculty_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">File Name</label>
                  <p className="mt-1 text-sm text-gray-900">{fileToPreview.file_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Original File Name</label>
                  <p className="mt-1 text-sm text-gray-900">{fileToPreview.original_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Type</label>
                    <p className="mt-1 text-sm text-gray-900">{getFileTypeLabel(fileToPreview.file_type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Size</label>
                    <p className="mt-1 text-sm text-gray-900">{formatFileSize(fileToPreview.file_size)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Uploaded At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(fileToPreview.uploaded_at)}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleDownload(fileToPreview.file_id, fileToPreview.original_name)}
                    className="flex-1 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                  <button
                    onClick={() => {
                      setPreviewModalOpen(false);
                      confirmDelete(fileToPreview.file_id);
                    }}
                    className="flex-1 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete File
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onRequestClose={() => setDeleteModalOpen(false)}
          className="bg-white p-6 rounded-xl max-w-sm mx-auto shadow-lg"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="flex flex-col items-center text-center">
            <XCircle className="text-red-500 w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this file? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(fileToDelete)}
                className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors"
              >
                Delete
              </button>
            </div>
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