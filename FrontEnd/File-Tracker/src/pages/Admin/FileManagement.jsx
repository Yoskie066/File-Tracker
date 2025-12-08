import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Trash2, Eye, Edit, Calendar, History, CheckCheck } from "lucide-react";
import * as XLSX from 'xlsx';

Modal.setAppElement("#root");

export default function FileManagement() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const filesPerPage = 10;

  // History of Records states
  const [historyView, setHistoryView] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

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

  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [fileToUpdate, setFileToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Bulk complete confirmation modal
  const [bulkCompleteModalOpen, setBulkCompleteModalOpen] = useState(false);
  const [bulkCompleteLoading, setBulkCompleteLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/file-management`);
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched files:", result);
      
      if (result.success && Array.isArray(result.data)) {
        const filesData = result.data;
        setFiles(filesData);
        
        // Extract available years from files
        const years = [...new Set(filesData.map(f => {
          const date = new Date(f.uploaded_at);
          return date.getFullYear();
        }))].sort((a, b) => b - a);
        
        setAvailableYears(years);
        if (years.length > 0 && !years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }
      } else {
        console.error("Unexpected API response format:", result);
        setFiles([]);
        setAvailableYears([]);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setFiles([]);
      setAvailableYears([]);
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

  // Handle preview file
  const handlePreview = (file) => {
    setFileToPreview(file);
    setPreviewModalOpen(true);
  };

  // Handle update status
  const handleUpdateStatus = async () => {
    if (!fileToUpdate || !newStatus) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/file-management/${fileToUpdate.file_id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        fetchFiles(); 
        setStatusModalOpen(false);
        setFileToUpdate(null);
        setNewStatus("");
        showFeedback("success", "File status updated successfully!");
      } else {
        showFeedback("error", result.message || "Error updating file status");
      }
    } catch (error) {
      console.error("Error updating file status:", error);
      showFeedback("error", "Error updating file status");
    }
  };

  // Open status update modal
  const openStatusModal = (file) => {
    setFileToUpdate(file);
    setNewStatus(file.status);
    setStatusModalOpen(true);
    setActionDropdown(null);
  };

  // Handle delete file
  const handleDelete = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/file-management/${fileId}`, {
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

  // Handle bulk complete all files
  const handleBulkComplete = async () => {
    try {
      setBulkCompleteLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/file-management/bulk-complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        fetchFiles(); // Refresh the files list
        setBulkCompleteModalOpen(false);
        showFeedback("success", `Successfully marked ${result.data.completed} files as completed! Task deliverables have been automatically updated.`);
      } else {
        showFeedback("error", result.message || "Error completing files");
      }
    } catch (error) {
      console.error("Error completing files:", error);
      showFeedback("error", "Error completing files");
    } finally {
      setBulkCompleteLoading(false);
    }
  };

  // Open bulk complete confirmation modal
  const confirmBulkComplete = () => {
    const pendingCount = files.filter(f => f.status === "pending" || f.status === "rejected").length;
    if (pendingCount === 0) {
      showFeedback("info", "No pending or rejected files to complete.");
      return;
    }
    setBulkCompleteModalOpen(true);
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

  // Get document type label with TOS type support
  const getDocumentTypeLabel = (documentType, tosType = null) => {
    if (documentType === 'tos-midterm' || (documentType === 'tos' && tosType === 'midterm')) {
      return 'TOS (Midterm)';
    }
    if (documentType === 'tos-final' || (documentType === 'tos' && tosType === 'final')) {
      return 'TOS (Final)';
    }

    const typeMap = {
      'syllabus': 'Syllabus',
      'tos': 'TOS',
      'midterm-exam': 'Midterm Exam',
      'final-exam': 'Final Exam',
      'instructional-materials': 'Instructional Materials'
    };
    return typeMap[documentType] || documentType;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Format course sections (array to string)
  const formatCourseSections = (sections) => {
    if (!sections || !Array.isArray(sections)) return 'N/A';
    return sections.join(', ');
  };

  // Search filter
  const getFilteredFiles = () => {
    let filtered = (Array.isArray(files) ? files : []);

    // Apply search filter
    filtered = filtered.filter((file) =>
      [file.file_id, file.faculty_name, file.file_name, file.document_type, file.status, file.tos_type, file.subject_code]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase())) ||
      (file.course_sections && Array.isArray(file.course_sections) && 
        file.course_sections.some(section => section.toLowerCase().includes(search.toLowerCase())))
    );

    // Apply filters for history view
    if (historyView) {
      // Year filter
      filtered = filtered.filter(file => {
        const fileYear = new Date(file.uploaded_at).getFullYear();
        return fileYear === selectedYear;
      });
    }

    return filtered;
  };

  const filteredFiles = getFilteredFiles();

  // Calculate stats
  const calculateStats = (filesList) => {
    if (!Array.isArray(filesList) || filesList.length === 0) {
      return { total: 0, pending: 0, completed: 0, rejected: 0 };
    }
  
    let pendingCount = 0;
    let completedCount = 0;
    let rejectedCount = 0;
  
    filesList.forEach(file => {
      const status = file.status?.toLowerCase().trim();
      
      if (status === 'completed') {
        completedCount++;
      } else if (status === 'rejected') {
        rejectedCount++;
      } else {
        pendingCount++;
      }
    });
  
    return {
      total: filesList.length,
      pending: pendingCount,
      completed: completedCount,
      rejected: rejectedCount
    };
  };

  const fileStats = calculateStats(filteredFiles);

  // Get pending files count for bulk complete
  const getPendingCount = () => {
    return files.filter(f => f.status === "pending" || f.status === "rejected").length;
  };

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const currentFiles = filteredFiles.slice(startIndex, startIndex + filesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // History of Records functions - EXCEL EXPORT
  const handleExportHistory = async (year) => {
    try {
      const filesForYear = files.filter(f => 
        new Date(f.uploaded_at).getFullYear() === year
      );
      
      // Prepare data for Excel
      const excelData = filesForYear.map(f => ({
        'File ID': f.file_id,
        'Faculty Name': f.faculty_name,
        'File Name': f.file_name,
        'Document Type': getDocumentTypeLabel(f.document_type, f.tos_type),
        'TOS Type': f.tos_type || 'N/A',
        'Subject Code': f.subject_code,
        'Course Sections': formatCourseSections(f.course_sections),
        'Subject Title': f.subject_title,
        'File Size': formatFileSize(f.file_size),
        'Status': f.status,
        'Uploaded At': new Date(f.uploaded_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
      
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Create a worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 20 }, // File ID
        { wch: 25 }, // Faculty Name
        { wch: 30 }, // File Name
        { wch: 20 }, // Document Type
        { wch: 15 }, // TOS Type
        { wch: 15 }, // Subject Code
        { wch: 25 }, // Course Sections
        { wch: 30 }, // Subject Title
        { wch: 15 }, // File Size
        { wch: 15 }, // Status
        { wch: 25 }  // Uploaded At
      ];
      ws['!cols'] = colWidths;
      
      // Add headers with formatting
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({r: 0, c: C});
        if (!ws[cell_address]) continue;
        
        // Style header cells
        ws[cell_address].s = {
          font: {
            bold: true,
            color: { rgb: "FFFFFF" }
          },
          fill: {
            fgColor: { rgb: "000000" }
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          }
        };
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, `History_${year}`);
      
      // Generate Excel file with proper formatting
      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array'
      });
      
      // Create and download file with proper MIME type for Excel
      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `file-management-history-${year}.xlsx`;
      link.style.display = 'none';
      
      // Add to document and trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      showFeedback("success", `History of Records for ${year} exported as Excel file successfully!`);
    } catch (error) {
      console.error("Error exporting history:", error);
      showFeedback("error", "Error exporting history as Excel file");
    }
  };

  // Auto-refresh to get latest data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFiles();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {historyView ? `History of Records - ${selectedYear}` : 'File Management'}
            </h1>
            <p className="text-sm text-gray-500">
              {historyView 
                ? `Viewing historical file records and submissions for ${selectedYear}`
                : 'One record per file with multiple course sections'
              }
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* History of Records Filters */}
            {historyView && (
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* View Toggle Buttons */}
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => {
                  setHistoryView(false);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  !historyView 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => {
                  setHistoryView(true);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  historyView 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  History of Records
                </div>
              </button>
            </div>

            <input
              type="text"
              placeholder={`Search ${historyView ? 'historical records' : 'files'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Bulk Complete Button - Only show in current view */}
        {!historyView && getPendingCount() > 0 && (
          <div className="mb-6">
            <button
              onClick={confirmBulkComplete}
              disabled={getPendingCount() === 0}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-5 h-5" />
              Mark All Files as Completed ({getPendingCount()} pending)
            </button>
            <p className="text-xs text-gray-500 mt-2">
              This will mark all pending and rejected files as "completed" and automatically update Task Deliverables.
            </p>
          </div>
        )}

        {/* History of Records Management Bar */}
        {historyView && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-800">
                  Viewing {filteredFiles.length} historical file records from {selectedYear}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportHistory(selectedYear)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-yellow-500 hover:text-black transition-colors"
                >
                  Export {selectedYear} History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total {historyView ? 'Records' : 'Files'}</div>
            <div className="text-2xl font-bold text-blue-800">{fileStats.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Pending {historyView ? 'Records' : 'Files'}</div>
            <div className="text-2xl font-bold text-yellow-800">{fileStats.pending}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Completed {historyView ? 'Records' : 'Files'}</div>
            <div className="text-2xl font-bold text-green-800">{fileStats.completed}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-600 text-sm font-medium">Rejected {historyView ? 'Records' : 'Files'}</div>
            <div className="text-2xl font-bold text-red-800">{fileStats.rejected}</div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">{historyView ? 'Record' : 'File'} ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Faculty Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">File Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Document Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Code</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Course Sections</th>
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
                    <td className="px-4 py-3 text-gray-700">{getDocumentTypeLabel(file.document_type, file.tos_type)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {file.tos_type ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                          {file.tos_type}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {file.subject_code}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {file.course_sections && Array.isArray(file.course_sections) ? (
                          file.course_sections.map((section, index) => (
                            <span 
                              key={index}
                              className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                            >
                              {section}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </div>
                    </td>
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
                          {!historyView && (
                            <>
                              <button
                                onClick={() => openStatusModal(file)}
                                className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Update Status
                              </button>
                              <button
                                onClick={() => confirmDelete(file.file_id)}
                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-8 text-gray-500 font-medium">
                    {loading ? "Loading files..." : `No ${historyView ? 'historical records' : 'files'} found.`}
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
                          {!historyView && (
                            <>
                              <button
                                onClick={() => openStatusModal(file)}
                                className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Update Status
                              </button>
                              <button
                                onClick={() => confirmDelete(file.file_id)}
                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </>
                          )}
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
                    <span className="text-gray-500">Document Type:</span>
                    <p className="font-medium">{getDocumentTypeLabel(file.document_type, file.tos_type)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">TOS Type:</span>
                    <p className="font-medium capitalize">{file.tos_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Subject Code:</span>
                    <p className="font-medium">{file.subject_code}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <p className="font-medium">{formatFileSize(file.file_size)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Uploaded:</span>
                    <p className="font-medium text-xs">{formatDate(file.uploaded_at)}</p>
                  </div>
                </div>

                {/* Course Sections in Mobile */}
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">Course Sections:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {file.course_sections && Array.isArray(file.course_sections) ? (
                      file.course_sections.map((section, index) => (
                        <span 
                          key={index}
                          className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {section}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              {loading ? "Loading files..." : `No ${historyView ? 'historical records' : 'files'} found.`}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentFiles.length} of {filteredFiles.length} {historyView ? 'historical records' : 'files'}
            {historyView && ` for ${selectedYear}`}
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
                  {historyView ? 'Historical Record' : 'File'} Details
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
                    <label className="block text-sm font-medium text-gray-700">{historyView ? 'Record' : 'File'} ID</label>
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
                    <label className="block text-sm font-medium text-gray-700">Document Type</label>
                    <p className="mt-1 text-sm text-gray-900">{getDocumentTypeLabel(fileToPreview.document_type, fileToPreview.tos_type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Size</label>
                    <p className="mt-1 text-sm text-gray-900">{formatFileSize(fileToPreview.file_size)}</p>
                  </div>
                </div>

                {fileToPreview.tos_type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">TOS Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{fileToPreview.tos_type}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                    <p className="mt-1 text-sm text-gray-900">{fileToPreview.subject_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject Title</label>
                    <p className="mt-1 text-sm text-gray-900">{fileToPreview.subject_title}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Course Sections</label>
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-2">
                      {fileToPreview.course_sections && Array.isArray(fileToPreview.course_sections) ? (
                        fileToPreview.course_sections.map((section, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            {section}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Total: {fileToPreview.course_sections?.length || 0} sections
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">File Path</label>
                  <p className="mt-1 text-sm text-gray-900 break-all">{fileToPreview.file_path}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Uploaded At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(fileToPreview.uploaded_at)}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  {!historyView && (
                    <button
                      onClick={() => openStatusModal(fileToPreview)}
                      className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Update Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Status Update Modal */}
        <Modal
          isOpen={statusModalOpen}
          onRequestClose={() => setStatusModalOpen(false)}
          className="bg-white rounded-lg max-w-md w-full mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          {fileToUpdate && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Update File Status
                </h3>
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File: <span className="font-semibold">{fileToUpdate.file_name}</span>
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Document Type: {getDocumentTypeLabel(fileToUpdate.document_type, fileToUpdate.tos_type)}
                    {fileToUpdate.tos_type && ` (${fileToUpdate.tos_type})`}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Subject: {fileToUpdate.subject_code}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Course Sections: {formatCourseSections(fileToUpdate.course_sections)}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    This update will sync with Task Deliverables for all {fileToUpdate.course_sections?.length || 0} sections
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStatusModalOpen(false)}
                    className="flex-1 border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors"
                    >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Bulk Complete Confirmation Modal */}
        <Modal
          isOpen={bulkCompleteModalOpen}
          onRequestClose={() => !bulkCompleteLoading && setBulkCompleteModalOpen(false)}
          className="bg-white rounded-lg max-w-md w-full mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Mark All Files as Completed
              </h3>
              <button
                onClick={() => !bulkCompleteLoading && setBulkCompleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={bulkCompleteLoading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center">
                  <CheckCheck className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 font-medium">Important Information:</p>
                </div>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• This will mark <strong>{getPendingCount()} files</strong> as "completed"</li>
                  <li>• Affects files with status: "pending" or "rejected"</li>
                  <li>• Task Deliverables will be automatically updated to "completed" for all sections</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600">
                Are you sure you want to mark all pending and rejected files as completed? This will automatically update the corresponding Task Deliverables for all course sections.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => !bulkCompleteLoading && setBulkCompleteModalOpen(false)}
                  disabled={bulkCompleteLoading}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkComplete}
                  disabled={bulkCompleteLoading}
                  className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-400 hover:text-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {bulkCompleteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-4 h-4" />
                      Mark All as Completed
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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
              Are you sure you want to delete this {historyView ? 'historical record' : 'file'}? This action cannot be undone.
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