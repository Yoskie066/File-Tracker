import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Trash2, Eye, Edit, Calendar, History, CheckCheck, Filter, ArrowUpDown, Download, Clock } from "lucide-react";
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

  // Filtering and Sorting states
  const [facultyFilter, setFacultyFilter] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortOption, setSortOption] = useState("most_recent");
  const [showFilters, setShowFilters] = useState(false);

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
    const handleClickOutside = (e) => {
      if (actionDropdown && !e.target.closest('.action-dropdown-container')) {
        setActionDropdown(null);
      }
    };
    
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [actionDropdown]);

  // Show feedback modal
  const showFeedback = (type, message) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setFeedbackModalOpen(true);
  };

  // Handle download file - UPDATED with fixed message
  const handleDownload = async (file) => {
    try {
      console.log("Downloading file:", file);
      
      // Create download URL using the new download endpoint
      const downloadUrl = `${API_BASE_URL}/api/admin/file-management/download/${file.file_id}`;
      console.log("Download URL:", downloadUrl);
      
      // Use fetch to trigger the download
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Download failed with status ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // FIXED: Changed to "Download successfully!"
      showFeedback("success", "Download successfully!");
      
    } catch (error) {
      console.error("Error downloading file:", error);
      showFeedback("error", `Failed to download file: ${error.message}`);
    }
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
        fetchFiles();
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
    const pendingCount = files.filter(f => ["pending", "rejected", "late"].includes(f.status)).length;
    if (pendingCount === 0) {
      showFeedback("info", "No pending, late, or rejected files to complete.");
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

  // Get status badge color - UPDATED with "late" status
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
      case 'late': return 'bg-orange-100 text-orange-800 border border-orange-200'; // ADDED for late status
      default: return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }
  };

  // Get status icon - UPDATED with "late" status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'rejected': return <XCircle className="w-4 h-4 mr-1" />;
      case 'late': return <Clock className="w-4 h-4 mr-1" />; // ADDED for late status
      default: return null;
    }
  };

  // Get course badge color
  const getCourseColor = (course) => {
    if (course === 'BSCS') return 'bg-purple-100 text-purple-800';
    if (course === 'BSIT') return 'bg-green-100 text-green-800';
    if (course === 'BSIS') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get semester badge color
  const getSemesterColor = (semester) => {
    if (semester?.includes('1st')) return 'bg-purple-100 text-purple-800';
    if (semester?.includes('2nd')) return 'bg-green-100 text-green-800';
    if (semester?.includes('Summer')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get unique values for filters
  const getUniqueValues = (key) => {
    let filtered = (Array.isArray(files) ? files : []);

    const values = new Set();
    
    filtered.forEach(file => {
      if (key === 'faculty_name' && file.faculty_name) {
        values.add(file.faculty_name);
      } else if (key === 'document_type') {
        values.add(getDocumentTypeLabel(file.document_type, file.tos_type));
      } else if (key === 'subject_code' && file.subject_code) {
        values.add(file.subject_code);
      } else if (key === 'course' && file.course) {
        values.add(file.course);
      } else if (key === 'status' && file.status) {
        values.add(file.status);
      } else if (key === 'semester' && file.semester) {
        values.add(file.semester);
      } else if (key === 'school_year' && file.school_year) {
        values.add(file.school_year);
      } else if (key === 'months') {
        if (file.uploaded_at) {
          const month = new Date(file.uploaded_at).getMonth();
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          values.add(monthNames[month]);
        }
      } else if (key === 'years') {
        if (file.uploaded_at) {
          const year = new Date(file.uploaded_at).getFullYear();
          values.add(year);
        }
      }
    });

    return Array.from(values).sort();
  };

  // Get unique years for filter
  const getUniqueYears = () => {
    const years = new Set();
    files.forEach(file => {
      if (file.uploaded_at) {
        const year = new Date(file.uploaded_at).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Reset all filters
  const resetFilters = () => {
    setFacultyFilter("");
    setDocumentTypeFilter("");
    setSubjectCodeFilter("");
    setCourseFilter("");
    setStatusFilter("");
    setSemesterFilter("");
    setSchoolYearFilter("");
    setMonthFilter("");
    setYearFilter("");
    setSortOption("most_recent");
    setCurrentPage(1);
  };

  // Search filter
  const getFilteredFiles = () => {
    let filtered = (Array.isArray(files) ? files : []);

    // Apply search filter
    filtered = filtered.filter((file) =>
      [file.file_id, file.faculty_name, file.file_name, file.document_type, file.status, file.tos_type, file.subject_code, file.course, file.semester, file.school_year]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

    // Apply advanced filters
    if (facultyFilter) {
      filtered = filtered.filter(file => file.faculty_name === facultyFilter);
    }
    
    if (documentTypeFilter) {
      filtered = filtered.filter(file => 
        getDocumentTypeLabel(file.document_type, file.tos_type) === documentTypeFilter
      );
    }
    
    if (subjectCodeFilter) {
      filtered = filtered.filter(file => file.subject_code === subjectCodeFilter);
    }
    
    if (courseFilter) {
      filtered = filtered.filter(file => file.course === courseFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(file => file.status === statusFilter);
    }

    // Apply semester filter
    if (semesterFilter) {
      filtered = filtered.filter(file => file.semester === semesterFilter);
    }

    // Apply school year filter
    if (schoolYearFilter) {
      filtered = filtered.filter(file => file.school_year === schoolYearFilter);
    }

    // Apply month filter (uploaded date)
    if (monthFilter) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = monthNames.indexOf(monthFilter);
      
      filtered = filtered.filter(file => {
        if (!file.uploaded_at) return false;
        const fileMonth = new Date(file.uploaded_at).getMonth();
        return fileMonth === monthIndex;
      });
    }

    // Apply year filter (uploaded date)
    if (yearFilter) {
      filtered = filtered.filter(file => {
        if (!file.uploaded_at) return false;
        const fileYear = new Date(file.uploaded_at).getFullYear();
        return fileYear === parseInt(yearFilter);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.uploaded_at);
      const dateB = new Date(b.uploaded_at);
      
      switch (sortOption) {
        case "most_recent":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  };

  const filteredFiles = getFilteredFiles();

  // Calculate stats - UPDATED with "late" status
  const calculateStats = (filesList) => {
    if (!Array.isArray(filesList) || filesList.length === 0) {
      return { total: 0, pending: 0, completed: 0, rejected: 0, late: 0 };
    }
  
    let pendingCount = 0;
    let completedCount = 0;
    let rejectedCount = 0;
    let lateCount = 0;
  
    filesList.forEach(file => {
      const status = file.status?.toLowerCase().trim();
      
      if (status === 'completed') {
        completedCount++;
      } else if (status === 'rejected') {
        rejectedCount++;
      } else if (status === 'late') {
        lateCount++;
      } else {
        pendingCount++;
      }
    });
  
    return {
      total: filesList.length,
      pending: pendingCount,
      completed: completedCount,
      rejected: rejectedCount,
      late: lateCount
    };
  };

  const fileStats = calculateStats(filteredFiles);

  // Get pending files count for bulk complete - UPDATED with "late" status
  const getPendingCount = () => {
    return files.filter(f => ["pending", "rejected", "late"].includes(f.status)).length;
  };

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  const startIndex = (currentPage - 1) * filesPerPage;
  const currentFiles = filteredFiles.slice(startIndex, startIndex + filesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // History of Records functions - EXCEL EXPORT
  const handleExportHistory = async () => {
    try {
      const filesForExport = filteredFiles;
      
      if (filesForExport.length === 0) {
        showFeedback("info", "No records to export with the current filters.");
        return;
      }
      
      const excelData = filesForExport.map(f => ({
        'Faculty Name': f.faculty_name,
        'File Name': f.file_name,
        'Document Type': getDocumentTypeLabel(f.document_type, f.tos_type),
        'TOS Type': f.tos_type || 'N/A',
        'Subject Code': f.subject_code,
        'Course': f.course,
        'Subject Title': f.subject_title,
        'Semester': f.semester,
        'Academic Year': f.school_year,
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
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      const colWidths = [
        { wch: 25 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 }
      ];
      ws['!cols'] = colWidths;
      
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({r: 0, c: C});
        if (!ws[cell_address]) continue;
        
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
      
      let sheetName = `History`;
      if (yearFilter) sheetName += `_${yearFilter}`;
      if (monthFilter) sheetName += `_${monthFilter.substring(0, 3)}`;
      if (semesterFilter) sheetName += `_${semesterFilter.substring(0, 3)}`;
      sheetName = sheetName.substring(0, 31);
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array'
      });
      
      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      let filename = `file-management-history`;
      if (yearFilter) filename += `-${yearFilter}`;
      if (monthFilter) filename += `-${monthFilter.replace(/\s+/g, '-')}`;
      if (semesterFilter) filename += `-${semesterFilter.replace(/\s+/g, '-')}`;
      filename += '.xlsx';
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      showFeedback("success", `Exported ${filesForExport.length} records with current filters as Excel file successfully!`);
    } catch (error) {
      console.error("Error exporting history:", error);
      showFeedback("error", "Error exporting history as Excel file");
    }
  };

  // Auto-refresh to get latest data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFiles();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Reset filters when switching views
  useEffect(() => {
    resetFilters();
  }, [historyView]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col justify-between items-start mb-6 gap-3">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800">
              {historyView ? 'History of Records' : 'File Management'}
            </h1>
            <p className="text-sm text-gray-500">
              {historyView 
                ? 'Viewing historical file records and submissions'
                : 'A secure file management system for storing, organizing, and monitoring all details'
              }
            </p>
          </div>
          
          {/* Top Row: Show Filters button and Bulk Complete button */}
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-3 mb-4">
            {/* Show Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full md:w-auto"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              
            </button>

            {/* Bulk Complete Button - Only show in current view */}
            {!historyView && getPendingCount() > 0 && (
              <div className="w-full md:w-auto">
                <button
                  onClick={confirmBulkComplete}
                  disabled={getPendingCount() === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
                >
                  <CheckCheck className="w-5 h-5" />
                  Mark All Files as Completed ({getPendingCount()} pending/late/rejected)
                </button>
                <p className="text-xs text-gray-500 mt-2 md:hidden">
                  This will mark all pending, late, and rejected files as "completed" and automatically update Task Deliverables.
                </p>
              </div>
            )}
          </div>

          {/* Second Row: View Toggle and Search Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-3 mb-4">
            {/* View Toggle Buttons */}
            <div className="flex border border-gray-300 rounded-md overflow-hidden w-full md:w-auto">
              <button
                onClick={() => {
                  setHistoryView(false);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors flex-1 ${
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
                className={`px-4 py-2 text-sm font-medium transition-colors flex-1 ${
                  historyView 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <History className="w-4 h-4" />
                  History
                </div>
              </button>
            </div>

            <input
              type="text"
              placeholder={`Search ${historyView ? 'historical records' : 'files'}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Filtering and Sorting Options - 5x4 Grid */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 w-full mb-4">
              {/* First Row - 5 columns */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Faculty Name
                  </label>
                  <select
                    value={facultyFilter}
                    onChange={(e) => {
                      setFacultyFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Faculty</option>
                    {getUniqueValues('faculty_name').map(faculty => (
                      <option key={faculty} value={faculty}>{faculty}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={documentTypeFilter}
                    onChange={(e) => {
                      setDocumentTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Types</option>
                    {getUniqueValues('document_type').map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subject Code
                  </label>
                  <select
                    value={subjectCodeFilter}
                    onChange={(e) => {
                      setSubjectCodeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Subjects</option>
                    {getUniqueValues('subject_code').map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    value={courseFilter}
                    onChange={(e) => {
                      setCourseFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Courses</option>
                    {getUniqueValues('course').map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="late">Late</option> {/* ADDED late option */}
                  </select>
                </div>
              </div>

              {/* Second Row - 5 columns */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={semesterFilter}
                    onChange={(e) => {
                      setSemesterFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Semesters</option>
                    {getUniqueValues('semester').map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={schoolYearFilter}
                    onChange={(e) => {
                      setSchoolYearFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Years</option>
                    {getUniqueValues('school_year').map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Upload Month
                  </label>
                  <select
                    value={monthFilter}
                    onChange={(e) => {
                      setMonthFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Months</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Upload Year
                  </label>
                  <select
                    value={yearFilter}
                    onChange={(e) => {
                      setYearFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Years</option>
                    {getUniqueYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sort by:
                  </label>
                  <select
                    value={sortOption}
                    onChange={(e) => {
                      setSortOption(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="most_recent">Most Recent</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
              </div>

              {/* Third Row - 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="col-span-1">
                  <span className="text-xs text-gray-500">
                    {filteredFiles.length} of {files.length} records
                    {facultyFilter || documentTypeFilter || subjectCodeFilter || courseFilter || statusFilter || semesterFilter || schoolYearFilter || monthFilter || yearFilter ? (
                      <span className="ml-2 text-blue-600">
                        ({[
                          facultyFilter && "Faculty",
                          documentTypeFilter && "Type",
                          subjectCodeFilter && "Subject",
                          courseFilter && "Course",
                          statusFilter && "Status",
                          semesterFilter && "Semester",
                          schoolYearFilter && "Year",
                          monthFilter && monthFilter,
                          yearFilter && yearFilter
                        ].filter(Boolean).join(", ")})
                      </span>
                    ) : null}
                  </span>
                </div>
                
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Sorted by: {sortOption === "most_recent" ? "Most Recent" : "Oldest"}</span>
                  </div>
                </div>
                
                <div className="col-span-1 text-right">
                  {(facultyFilter || documentTypeFilter || subjectCodeFilter || courseFilter || statusFilter || semesterFilter || schoolYearFilter || monthFilter || yearFilter || sortOption !== "most_recent") && (
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History of Records Management Bar */}
          {historyView && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 w-full">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-800">
                    Viewing {filteredFiles.length} historical file records
                    {yearFilter && ` from ${yearFilter}`}
                    {monthFilter && `, ${monthFilter}`}
                    {semesterFilter && ` • Semester: ${semesterFilter}`}
                    {schoolYearFilter && ` • Year: ${schoolYearFilter}`}
                    {facultyFilter && ` • Faculty: ${facultyFilter}`}
                    {documentTypeFilter && ` • Type: ${documentTypeFilter}`}
                    {statusFilter && ` • Status: ${statusFilter}`}
                  </span>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    onClick={handleExportHistory}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-yellow-500 hover:text-black transition-colors"
                  >
                    Export Filtered History
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Export will include only the records matching current filters: {filteredFiles.length} record(s)
              </p>
            </div>
          )}
        </div>

        {/* Statistics Cards - UPDATED with "late" status */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200"> {/* ADDED for late status */}
            <div className="text-orange-600 text-sm font-medium">Late {historyView ? 'Records' : 'Files'}</div>
            <div className="text-2xl font-bold text-orange-800">{fileStats.late}</div>
          </div>
        </div>

        {/* Desktop Table - UPDATED with course instead of sections */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Faculty Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">File Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Document Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Code</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Course</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Semester</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Academic Year</th>
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
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseColor(file.course)}`}>
                        {file.course}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(file.semester)}`}>
                        {file.semester}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{file.school_year}</td>
                    <td className="px-4 py-3 text-gray-700">{formatFileSize(file.file_size)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                        {getStatusIcon(file.status)}
                        {file.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(file.uploaded_at)}
                    </td>
                    <td className="px-4 py-3 relative action-dropdown-container">
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
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <button
                            onClick={() => handlePreview(file)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Details
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            className="flex items-center w-full px-3 py-2 text-sm text-black hover:bg-yellow-500 hover:text-black"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download File
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
                  <td colSpan="12" className="text-center py-8 text-gray-500 font-medium">
                    {loading ? "Loading files..." : `No ${historyView ? 'historical records' : 'files'} found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - FIXED LAYOUT */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentFiles.length > 0 ? (
            currentFiles.map((file) => (
              <div key={file._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 mr-2">
                    <h2 className="font-semibold text-gray-800 truncate">{file.file_name}</h2>
                    <p className="text-xs text-gray-600 truncate">{file.faculty_name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                      {getStatusIcon(file.status)}
                      {file.status}
                    </span>
                    
                    <div className="relative action-dropdown-container">
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
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <button
                            onClick={() => handlePreview(file)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Details
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            className="flex items-center w-full px-3 py-2 text-sm text-black hover:bg-yellow-500 hover:text-black"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download File
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
                  <div className="truncate">
                    <span className="text-gray-500 block truncate">Faculty:</span>
                    <p className="font-medium truncate">{file.faculty_name}</p>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500 block truncate">Document Type:</span>
                    <p className="font-medium truncate">{getDocumentTypeLabel(file.document_type, file.tos_type)}</p>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500 block truncate">TOS Type:</span>
                    <p className="font-medium truncate capitalize">{file.tos_type || 'N/A'}</p>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500 block truncate">Subject Code:</span>
                    <p className="font-medium truncate">{file.subject_code}</p>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500 block truncate">Course:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseColor(file.course)}`}>
                      {file.course}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500 block truncate">Semester:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(file.semester)}`}>
                      {file.semester}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500 block truncate">Academic Year:</span>
                    <p className="font-medium truncate">{file.school_year}</p>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500 block truncate">Size:</span>
                    <p className="font-medium truncate">{formatFileSize(file.file_size)}</p>
                  </div>
                  <div className="col-span-2 truncate">
                    <span className="text-gray-500 block truncate">Uploaded:</span>
                    <p className="font-medium text-xs truncate">{formatDate(file.uploaded_at)}</p>
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
            {yearFilter && ` from ${yearFilter}`}
            {monthFilter && `, ${monthFilter}`}
            {semesterFilter && ` • Semester: ${semesterFilter}`}
            {schoolYearFilter && ` • Year: ${schoolYearFilter}`}
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

        {/* File Preview Modal - UPDATED with course instead of sections */}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fileToPreview.status)}`}>
                    {getStatusIcon(fileToPreview.status)}
                    {fileToPreview.status}
                  </span>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course (Auto-synced)</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseColor(fileToPreview.course)}`}>
                      {fileToPreview.course}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Semester (Auto-synced)</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(fileToPreview.semester)}`}>
                      {fileToPreview.semester}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Academic Year (Auto-synced)</label>
                    <p className="mt-1 text-sm text-gray-900">{fileToPreview.school_year}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Uploaded At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(fileToPreview.uploaded_at)}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleDownload(fileToPreview)}
                    className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
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

        {/* Status Update Modal - UPDATED with "late" status */}
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
                  <p className="text-sm text-gray-600 mb-2">
                    Document Type: {getDocumentTypeLabel(fileToUpdate.document_type, fileToUpdate.tos_type)}
                    {fileToUpdate.tos_type && ` (${fileToUpdate.tos_type})`}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Subject: {fileToUpdate.subject_code}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Course: {fileToUpdate.course}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Semester: {fileToUpdate.semester}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Academic Year: {fileToUpdate.school_year}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    This update will sync with Task Deliverables for course: {fileToUpdate.course}
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
                    <option value="late">Late</option> {/* ADDED late option */}
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

        {/* Bulk Complete Confirmation Modal - UPDATED with "late" status */}
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
                  <li>• Affects files with status: "pending", "late", or "rejected"</li>
                  <li>• Task Deliverables will be automatically updated to "completed" for all courses</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600">
                Are you sure you want to mark all pending, late, and rejected files as completed? This will automatically update the corresponding Task Deliverables for all courses.
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