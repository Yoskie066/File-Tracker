import { useState, useEffect } from "react";
import { 
  Search, 
  RefreshCw,
  FileText,
  File,
  Calendar,
  Download
} from "lucide-react";

export default function FileHistory() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const itemsPerPage = 12;

  // Fetch file history
  const fetchFileHistory = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("facultyToken");
      
      if (!token) {
        console.error("No faculty token found");
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search })
      });

      const response = await fetch(`http://localhost:3000/api/faculty/file-history?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch file history');

      const result = await response.json();
      
      if (result.success) {
        setFiles(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Error fetching file history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFileHistory(currentPage);
  }, [currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchFileHistory(1);
  };

  // Get file type icon and color
  const getFileTypeDetails = (fileType) => {
    const typeMap = {
      'syllabus': { icon: FileText, color: 'bg-blue-100 text-blue-600', label: 'Syllabus' },
      'tos': { icon: File, color: 'bg-green-100 text-green-600', label: 'TOS' },
      'midterm-exam': { icon: FileText, color: 'bg-yellow-100 text-yellow-600', label: 'Midterm Exam' },
      'final-exam': { icon: FileText, color: 'bg-red-100 text-red-600', label: 'Final Exam' },
      'instructional-materials': { icon: Download, color: 'bg-purple-100 text-purple-600', label: 'Instructional Materials' }
    };
    return typeMap[fileType] || { icon: File, color: 'bg-gray-100 text-gray-600', label: fileType };
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

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">File History</h1>
            <p className="text-gray-600 mt-2">
              Collection of all your submitted files
            </p>
          </div>
          
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search files by name or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-lg"
              />
            </div>
            <button
              type="submit"
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors font-medium"
            >
              Search
            </button>
          </form>
        </div>

        {/* Files Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500 text-lg">Loading files...</span>
          </div>
        ) : files.length > 0 ? (
          <>
            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {files.map((file) => {
                const fileTypeDetails = getFileTypeDetails(file.file_type);
                const FileTypeIcon = fileTypeDetails.icon;
                
                return (
                  <div 
                    key={file._id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="p-6">
                      {/* File Icon and Type */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-lg ${fileTypeDetails.color}`}>
                          <FileTypeIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${fileTypeDetails.color} capitalize`}>
                            {fileTypeDetails.label}
                          </span>
                        </div>
                      </div>

                      {/* File Name */}
                      <h3 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-2">
                        {file.file_name}
                      </h3>

                      {/* Date Submitted */}
                      <div className="flex items-center gap-2 text-gray-600 mt-4 pt-4 border-t border-gray-100">
                        <Calendar className="w-4 h-4" />
                        <div className="text-sm">
                          <div className="font-medium">{formatDate(file.date_submitted)}</div>
                          <div className="text-xs">{formatTime(file.date_submitted)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-gray-600">
                  Showing {files.length} of {pagination.totalRecords} files
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      !pagination.hasPrev
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-black hover:text-white border-gray-300"
                    }`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show only relevant pages (current page and neighbors)
                      if (
                        pageNumber === 1 ||
                        pageNumber === pagination.totalPages ||
                        (pageNumber >= pagination.currentPage - 1 && pageNumber <= pagination.currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                              pagination.currentPage === pageNumber
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === pagination.currentPage - 2 ||
                        pageNumber === pagination.currentPage + 2
                      ) {
                        return (
                          <span key={pageNumber} className="w-10 h-10 flex items-center justify-center text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      !pagination.hasNext
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-black hover:text-white border-gray-300"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {search ? "No files found" : "No files submitted yet"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {search 
                ? "Try adjusting your search terms to find what you're looking for."
                : "Files you submit will appear in your history here."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}