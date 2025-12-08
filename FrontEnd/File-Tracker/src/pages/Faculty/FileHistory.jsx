import { useState, useEffect } from "react";
import { 
  RefreshCw,
  FileText,
  File,
  Calendar,
  Download
} from "lucide-react";
import tokenService from '../../services/tokenService';

export default function FileHistory() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const itemsPerPage = 12;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch file history
  const fetchFileHistory = async (page = 1) => {
    try {
      setLoading(true);
      
      // Use tokenService instead of direct localStorage
      const token = tokenService.getFacultyAccessToken();
      
      if (!token) {
        console.error("No faculty token found");
        showFeedback("error", "Please log in again");
        navigate('/auth/login');
        return;
      }
  
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search })
      });
  
      // Use authFetch instead of direct fetch
      const response = await tokenService.authFetch(`${API_BASE_URL}/api/faculty/file-history?${params}`);
  
      if (!response.ok) throw new Error('Failed to fetch file history');
  
      const result = await response.json();
      
      if (result.success) {
        setFiles(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Error fetching file history:", error);
      if (error.message === 'Token refresh failed') {
        showFeedback("error", "Session expired. Please log in again.");
        tokenService.clearFacultyTokens();
        navigate('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFileHistory(currentPage);
  }, [currentPage]);

  // Auto-search when typing 
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchFileHistory(1);
    }, 300); 

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Get document type icon and color with TOS type support
  const getDocumentTypeDetails = (documentType, tosType = null) => {
    // Handle TOS files with specific types
    if (documentType === 'tos-midterm' || (documentType === 'tos' && tosType === 'midterm')) {
      return { 
        icon: File, 
        color: 'bg-orange-100 text-orange-600 border-orange-200', 
        label: 'TOS (TOS-Midterm)' 
      };
    }
    if (documentType === 'tos-final' || (documentType === 'tos' && tosType === 'final')) {
      return { 
        icon: File, 
        color: 'bg-purple-100 text-purple-600 border-purple-200', 
        label: 'TOS (TOS-Final)' 
      };
    }

    const typeMap = {
      'syllabus': { icon: FileText, color: 'bg-blue-100 text-blue-600 border-blue-200', label: 'Syllabus' },
      'tos': { icon: File, color: 'bg-green-100 text-green-600 border-green-200', label: 'TOS' },
      'midterm-exam': { icon: FileText, color: 'bg-yellow-100 text-yellow-600 border-yellow-200', label: 'Midterm Exam' },
      'final-exam': { icon: FileText, color: 'bg-red-100 text-red-600 border-red-200', label: 'Final Exam' },
      'instructional-materials': { icon: Download, color: 'bg-indigo-100 text-indigo-600 border-indigo-200', label: 'Instructional Materials' }
    };
    return typeMap[documentType] || { icon: File, color: 'bg-gray-100 text-gray-600 border-gray-200', label: documentType };
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format course sections (array to string)
  const formatCourseSections = (sections) => {
    if (!sections || !Array.isArray(sections)) return 'N/A';
    return sections.join(', ');
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header  */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div className="text-left w-full md:w-auto">
            <h1 className="text-2xl font-bold text-gray-800">File History</h1>
            <p className="text-sm text-gray-500">
              Collection of all your submitted files (One record per file)
            </p>
          </div>
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Desktop Grid Header - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border border-gray-200 rounded-t-lg">
          <div className="col-span-4 text-sm font-semibold text-gray-600">File Name</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Document Type</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">TOS Type</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Course Sections</div>
          <div className="col-span-2 text-sm font-semibold text-gray-600">Date Submitted</div>
        </div>

        {/* Files List Container */}
        <div className="border border-gray-200 rounded-lg md:rounded-t-none overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Loading files...</span>
            </div>
          ) : files.length > 0 ? (
            <>
              {/* Desktop Grid Layout */}
              <div className="hidden md:block">
                {files.map((file) => {
                  const documentTypeDetails = getDocumentTypeDetails(file.document_type, file.tos_type);
                  const DocumentTypeIcon = documentTypeDetails.icon;
                  
                  return (
                    <div 
                      key={file._id} 
                      className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {/* File Name */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${documentTypeDetails.color} border`}>
                            <DocumentTypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm">
                              {file.file_name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {file.subject_code}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Document Type */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${documentTypeDetails.color} border`}>
                          <DocumentTypeIcon className="w-3 h-3" />
                          {documentTypeDetails.label}
                        </span>
                      </div>

                      {/* TOS Type */}
                      <div className="col-span-2">
                        {file.tos_type ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                            {file.tos_type}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </div>

                      {/* Course Sections */}
                      <div className="col-span-2">
                        <div className="flex flex-wrap gap-1">
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

                      {/* Date Submitted */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{formatDate(file.date_submitted)}</div>
                            <div className="text-xs text-gray-500">{formatTime(file.date_submitted)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Cards Layout */}
              <div className="md:hidden grid grid-cols-1 gap-4 p-4">
                {files.map((file) => {
                  const documentTypeDetails = getDocumentTypeDetails(file.document_type, file.tos_type);
                  const DocumentTypeIcon = documentTypeDetails.icon;
                  
                  return (
                    <div key={file._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${documentTypeDetails.color} border`}>
                            <DocumentTypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h2 className="font-semibold text-gray-800 text-sm">{file.file_name}</h2>
                            <p className="text-xs text-gray-500 mt-1">
                              {file.subject_code}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${documentTypeDetails.color} border`}>
                          <DocumentTypeIcon className="w-3 h-3" />
                          {documentTypeDetails.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">TOS Type:</span>
                          <p className="font-medium capitalize">{file.tos_type || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{formatDate(file.date_submitted)}</div>
                            <div className="text-xs text-gray-500">{formatTime(file.date_submitted)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Course Sections in Mobile */}
                      <div>
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
                  );
                })}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {search ? "No files found" : "No files submitted yet"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm">
                {search 
                  ? "Try adjusting your search terms to find what you're looking for."
                  : "Files you submit will appear in your history here."
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination - Same style as User Management */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
            <div className="text-sm text-gray-600">
              Showing {files.length} of {pagination.totalRecords} files
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                  !pagination.hasPrev
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-yellow-400 hover:text-black border-black"
                }`}
              >
                Previous
              </button>
              <span className="text-gray-600 text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                  !pagination.hasNext
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-yellow-400 hover:text-black border-black"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}