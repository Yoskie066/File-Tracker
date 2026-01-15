import { useState, useEffect } from "react";
import { Filter, Calendar, BarChart, Eye, MoreVertical, History } from "lucide-react";
import Modal from "react-modal";

Modal.setAppElement("#root");

export default function HistoryRecords() {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  // Filters
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState(""); 
  const [semesterFilter, setSemesterFilter] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortOption, setSortOption] = useState("most_recent");
  const [showFilters, setShowFilters] = useState(false);
  
  // Statistics
  const [historyStats, setHistoryStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    faculty_names: [],
    document_types: [],
    subject_codes: [],
    semesters: [],
    school_years: [],
    courses: [],
    active_years: []
  });

  // Action dropdown
  const [actionDropdown, setActionDropdown] = useState(null);

  // Modals
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [recordToPreview, setRecordToPreview] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch history records
  const fetchHistoryRecords = async () => {
    try {
      setLoading(true);
      
      // Build query string
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (facultyFilter) params.append('faculty_name', facultyFilter);
      if (documentTypeFilter) params.append('document_type', documentTypeFilter);
      if (subjectCodeFilter) params.append('subject_code', subjectCodeFilter);
      if (courseFilter) params.append('course', courseFilter); 
      if (semesterFilter) params.append('semester', semesterFilter);
      if (schoolYearFilter) params.append('school_year', schoolYearFilter);
      if (yearFilter) params.append('year', yearFilter);
      params.append('sort_by', sortOption === 'most_recent' ? 'archived_at' : 'uploaded_at');
      params.append('sort_order', sortOption === 'most_recent' ? 'desc' : 'asc');
      
      const res = await fetch(`${API_BASE_URL}/api/admin/history-records?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access_token')}`
        }
      });
      
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      
      if (result.success && result.data) {
        setHistoryRecords(result.data.records || []);
        setFilterOptions(result.data.filters || {});
      } else {
        setHistoryRecords([]);
      }
    } catch (err) {
      console.error("Error fetching history records:", err);
      setHistoryRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch history statistics
  const fetchHistoryStatistics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/history-records/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access_token')}`
        }
      });
      
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      
      if (result.success) {
        setHistoryStats(result.data);
      }
    } catch (err) {
      console.error("Error fetching history statistics:", err);
    }
  };

  // Handle preview
  const handlePreview = (record) => {
    setRecordToPreview(record);
    setPreviewModalOpen(true);
    setActionDropdown(null);
  };

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

  useEffect(() => {
    fetchHistoryRecords();
    fetchHistoryStatistics();
  }, []);

  // Apply filters
  const filteredRecords = historyRecords.filter(record => {
    // Search filter
    if (search && ![
      record.file_id,
      record.faculty_name,
      record.file_name,
      record.document_type,
      record.subject_code,
      record.subject_title,
      record.course
    ].some(field => field?.toLowerCase().includes(search.toLowerCase()))) {
      return false;
    }

    // Other filters
    if (facultyFilter && record.faculty_name !== facultyFilter) return false;
    if (documentTypeFilter && record.document_type !== documentTypeFilter) return false;
    if (subjectCodeFilter && record.subject_code !== subjectCodeFilter) return false;
    if (courseFilter && record.course !== courseFilter) return false; 
    if (semesterFilter && record.semester !== semesterFilter) return false;
    if (schoolYearFilter && record.school_year !== schoolYearFilter) return false;
    
    // Year filter (from uploaded_at)
    if (yearFilter && record.uploaded_at) {
      const recordYear = new Date(record.uploaded_at).getFullYear();
      if (recordYear.toString() !== yearFilter) return false;
    }

    return true;
  });

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateA = new Date(sortOption === 'most_recent' ? a.archived_at : a.uploaded_at);
    const dateB = new Date(sortOption === 'most_recent' ? b.archived_at : b.uploaded_at);
    return sortOption === 'most_recent' ? dateB - dateA : dateA - dateB;
  });

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const currentRecords = sortedRecords.slice(startIndex, startIndex + recordsPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

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
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get document type label
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
      case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
      case 'late': return 'bg-orange-100 text-orange-800 border border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
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

  // Reset all filters
  const resetFilters = () => {
    setFacultyFilter("");
    setDocumentTypeFilter("");
    setSubjectCodeFilter("");
    setCourseFilter(""); 
    setSemesterFilter("");
    setSchoolYearFilter("");
    setYearFilter("");
    setSortOption("most_recent");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-3">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">History of Records</h1>
            </div>
            <p className="text-sm text-gray-500">
              Complete audit trail of all completed file submissions and their status history
            </p>
          </div>
        </div>

        {/* Statistics Panel */}
        {historyStats && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Records Overview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-sm font-medium">Total Records</div>
                <div className="text-2xl font-bold text-blue-800">{historyStats.total_records}</div>
              </div>
              
              {historyStats.by_course && historyStats.by_course.length > 0 && (
                historyStats.by_course.slice(0, 4).map((course, index) => (
                  <div key={index} className="p-4 rounded-lg border" style={{
                    backgroundColor: course._id === 'BSCS' ? '#f3e8ff' : 
                                    course._id === 'BSIT' ? '#f0fdf4' : 
                                    course._id === 'BSIS' ? '#eff6ff' : '#f9fafb',
                    borderColor: course._id === 'BSCS' ? '#d8b4fe' : 
                                 course._id === 'BSIT' ? '#bbf7d0' : 
                                 course._id === 'BSIS' ? '#93c5fd' : '#e5e7eb'
                  }}>
                    <div className="text-sm font-medium" style={{
                      color: course._id === 'BSCS' ? '#7e22ce' : 
                             course._id === 'BSIT' ? '#166534' : 
                             course._id === 'BSIS' ? '#1e40af' : '#374151'
                    }}>
                      {course._id}
                    </div>
                    <div className="text-2xl font-bold">{course.count}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Filtering Options */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full md:w-auto"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            
            <input
              type="text"
              placeholder="Search history records..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    {filterOptions.faculty_names?.map(faculty => (
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
                    {filterOptions.document_types?.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Year (Uploaded)
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
                    {filterOptions.active_years?.map(year => (
                      <option key={year} value={year}>{year}</option>
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
                    {filterOptions.subject_codes?.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    {filterOptions.semesters?.map(semester => (
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
                    {filterOptions.school_years?.map(year => (
                      <option key={year} value={year}>{year}</option>
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
                    {filterOptions.courses?.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sort by
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

              <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-gray-500">
                  {sortedRecords.length} of {historyRecords.length} records
                  {facultyFilter || documentTypeFilter || subjectCodeFilter || courseFilter || 
                   semesterFilter || schoolYearFilter || yearFilter ? (
                    <span className="ml-2 text-blue-600">
                      ({[
                        facultyFilter && "Faculty",
                        documentTypeFilter && "Type",
                        subjectCodeFilter && "Subject",
                        courseFilter && "Course",
                        semesterFilter && "Semester",
                        schoolYearFilter && "Year",
                        yearFilter && yearFilter
                      ].filter(Boolean).join(", ")})
                    </span>
                  ) : null}
                </div>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Faculty Name</th>
                <th className="px-4 py-3 text-left">File Name</th>
                <th className="px-4 py-3 text-left">Document Type</th>
                <th className="px-4 py-3 text-left">Subject Code</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Semester</th>
                <th className="px-4 py-3 text-left">Academic Year</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Uploaded</th>
                <th className="px-4 py-3 text-left">Completed</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                  </td>
                </tr>
              ) : currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-700">{record.faculty_name}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">{record.file_name}</td>
                    <td className="px-4 py-3 text-gray-700">{getDocumentTypeLabel(record.document_type, record.tos_type)}</td>
                    <td className="px-4 py-3 text-gray-700">{record.subject_code}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseColor(record.course)}`}>
                        {record.course}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(record.semester)}`}>
                        {record.semester}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{record.school_year}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(record.uploaded_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(record.archived_at)}
                    </td>
                    <td className="px-4 py-3 relative action-dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === record.file_id ? null : record.file_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === record.file_id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <button
                            onClick={() => handlePreview(record)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-8 text-gray-500">
                    No history records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            </div>
          ) : currentRecords.length > 0 ? (
            currentRecords.map((record) => (
              <div key={record._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 mr-2">
                    <h2 className="font-semibold text-gray-800 truncate">{record.file_name}</h2>
                    <p className="text-sm text-gray-600 truncate">{record.faculty_name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                    
                    <div className="relative action-dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === record.file_id ? null : record.file_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === record.file_id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <button
                            onClick={() => handlePreview(record)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Document Type:</span>
                    <p className="font-medium truncate">{getDocumentTypeLabel(record.document_type, record.tos_type)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Subject:</span>
                    <p className="font-medium truncate">{record.subject_code}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Course:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseColor(record.course)}`}>
                      {record.course}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Academic Year:</span>
                    <p className="font-medium">{record.school_year}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Uploaded:</span>
                    <p className="font-medium text-xs">{formatDate(record.uploaded_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <p className="font-medium text-xs">{formatDate(record.archived_at)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No history records found
            </div>
          )}
        </div>

        {/* Pagination */}
        {sortedRecords.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
            <div className="text-sm text-gray-600">
              Showing {currentRecords.length} of {sortedRecords.length} history records
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
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onRequestClose={() => setPreviewModalOpen(false)}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-auto my-8"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        {recordToPreview && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-black" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Record Details
                </h3>
              </div>
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
                  <label className="block text-sm font-medium text-gray-700">Record ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{recordToPreview.file_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recordToPreview.status)}`}>
                    {recordToPreview.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Faculty Name</label>
                <p className="mt-1 text-sm text-gray-900">{recordToPreview.faculty_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">File Name</label>
                <p className="mt-1 text-sm text-gray-900">{recordToPreview.file_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Original File Name</label>
                <p className="mt-1 text-sm text-gray-900">{recordToPreview.original_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <p className="mt-1 text-sm text-gray-900">{getDocumentTypeLabel(recordToPreview.document_type, recordToPreview.tos_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Size</label>
                  <p className="mt-1 text-sm text-gray-900">{formatFileSize(recordToPreview.file_size)}</p>
                </div>
              </div>

              {recordToPreview.tos_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">TOS Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{recordToPreview.tos_type}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                  <p className="mt-1 text-sm text-gray-900">{recordToPreview.subject_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Title</label>
                  <p className="mt-1 text-sm text-gray-900">{recordToPreview.subject_title}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Course</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseColor(recordToPreview.course)}`}>
                    {recordToPreview.course}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(recordToPreview.semester)}`}>
                    {recordToPreview.semester}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <p className="mt-1 text-sm text-gray-900">{recordToPreview.school_year}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Uploaded At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDateTime(recordToPreview.uploaded_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completed At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDateTime(recordToPreview.archived_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}