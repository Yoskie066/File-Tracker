import { useState, useEffect } from "react";
import { Filter, Calendar, BarChart, Eye, MoreVertical } from "lucide-react";
import Modal from "react-modal";

Modal.setAppElement("#root");

export default function AdminArchive() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const archivesPerPage = 10;
  
  // Filters
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");
  const [courseSectionFilter, setCourseSectionFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortOption, setSortOption] = useState("most_recent");
  const [showFilters, setShowFilters] = useState(false);
  
  // Statistics
  const [archiveStats, setArchiveStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    faculty_names: [],
    document_types: [],
    subject_codes: [],
    semesters: [],
    school_years: [],
    course_sections: [],
    active_years: []
  });

  // Action dropdown
  const [actionDropdown, setActionDropdown] = useState(null);

  // Modals
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [archiveToPreview, setArchiveToPreview] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch archived files
  const fetchArchivedFiles = async () => {
    try {
      setLoading(true);
      
      // Build query string
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (facultyFilter) params.append('faculty_name', facultyFilter);
      if (documentTypeFilter) params.append('document_type', documentTypeFilter);
      if (subjectCodeFilter) params.append('subject_code', subjectCodeFilter);
      if (courseSectionFilter) params.append('course_section', courseSectionFilter);
      if (semesterFilter) params.append('semester', semesterFilter);
      if (schoolYearFilter) params.append('school_year', schoolYearFilter);
      if (yearFilter) params.append('year', yearFilter);
      params.append('sort_by', sortOption === 'most_recent' ? 'archived_at' : 'uploaded_at');
      params.append('sort_order', sortOption === 'most_recent' ? 'desc' : 'asc');
      
      const res = await fetch(`${API_BASE_URL}/api/admin/archive?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access_token')}`
        }
      });
      
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      
      if (result.success && result.data) {
        setArchives(result.data.files || []);
        setFilterOptions(result.data.filters || {});
      } else {
        setArchives([]);
      }
    } catch (err) {
      console.error("Error fetching archived files:", err);
      setArchives([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archive statistics
  const fetchArchiveStatistics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/archive/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_access_token')}`
        }
      });
      
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      
      if (result.success) {
        setArchiveStats(result.data);
      }
    } catch (err) {
      console.error("Error fetching archive statistics:", err);
    }
  };

  // Handle preview
  const handlePreview = (archive) => {
    setArchiveToPreview(archive);
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
    fetchArchivedFiles();
    fetchArchiveStatistics();
  }, []);

  // Apply filters
  const filteredArchives = archives.filter(archive => {
    // Search filter
    if (search && ![
      archive.file_id,
      archive.faculty_name,
      archive.file_name,
      archive.document_type,
      archive.subject_code,
      archive.subject_title
    ].some(field => field?.toLowerCase().includes(search.toLowerCase()))) {
      return false;
    }

    // Other filters
    if (facultyFilter && archive.faculty_name !== facultyFilter) return false;
    if (documentTypeFilter && archive.document_type !== documentTypeFilter) return false;
    if (subjectCodeFilter && archive.subject_code !== subjectCodeFilter) return false;
    if (courseSectionFilter && !archive.course_sections.includes(courseSectionFilter)) return false;
    if (semesterFilter && archive.semester !== semesterFilter) return false;
    if (schoolYearFilter && archive.school_year !== schoolYearFilter) return false;
    
    // Year filter (from uploaded_at)
    if (yearFilter && archive.uploaded_at) {
      const archiveYear = new Date(archive.uploaded_at).getFullYear();
      if (archiveYear.toString() !== yearFilter) return false;
    }

    return true;
  });

  // Sort archives
  const sortedArchives = [...filteredArchives].sort((a, b) => {
    const dateA = new Date(sortOption === 'most_recent' ? a.archived_at : a.uploaded_at);
    const dateB = new Date(sortOption === 'most_recent' ? b.archived_at : b.uploaded_at);
    return sortOption === 'most_recent' ? dateB - dateA : dateA - dateB;
  });

  // Pagination
  const totalPages = Math.ceil(sortedArchives.length / archivesPerPage);
  const startIndex = (currentPage - 1) * archivesPerPage;
  const currentArchives = sortedArchives.slice(startIndex, startIndex + archivesPerPage);

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

  // Get document type order for sorting
  const getDocumentTypeOrder = (documentType, tosType = null) => {
    const label = getDocumentTypeLabel(documentType, tosType);
    const order = {
      'Syllabus': 1,
      'TOS (Midterm)': 2,
      'TOS (Final)': 3,
      'Midterm Exam': 4,
      'Final Exam': 5,
      'Instructional Materials': 6,
      'TOS': 7 // fallback
    };
    return order[label] || 99;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Get semester badge color
  const getSemesterColor = (semester) => {
    if (semester?.includes('1st')) return 'bg-purple-100 text-purple-800';
    if (semester?.includes('2nd')) return 'bg-green-100 text-green-800';
    if (semester?.includes('Summer')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Format course sections
  const formatCourseSections = (sections) => {
    if (!sections || !Array.isArray(sections)) return 'N/A';
    return sections.join(', ');
  };

  // Reset all filters
  const resetFilters = () => {
    setFacultyFilter("");
    setDocumentTypeFilter("");
    setSubjectCodeFilter("");
    setCourseSectionFilter("");
    setSemesterFilter("");
    setSchoolYearFilter("");
    setYearFilter("");
    setSortOption("most_recent");
    setCurrentPage(1);
  };

  // Sort document types for statistics display
  const getSortedDocumentTypes = () => {
    if (!archiveStats || !archiveStats.by_document_type) return [];
    
    return [...archiveStats.by_document_type].sort((a, b) => {
      return getDocumentTypeOrder(a._id) - getDocumentTypeOrder(b._id);
    }).slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-3">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800">Archive </h1>
            <p className="text-sm text-gray-500">
              Automatically synchronizes completed files from File Management while preserving original file status
            </p>
          </div>
        </div>

        {/* Statistics Panel - Always Visible */}
        {archiveStats && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Archive Statistics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-sm font-medium">Total Archives</div>
                <div className="text-2xl font-bold text-blue-800">{archiveStats.total_archives}</div>
              </div>
              
              {archiveStats.by_document_type && archiveStats.by_document_type.length > 0 && (
                <div className="col-span-1 md:col-span-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">By Document Type</div>
                  <div className="space-y-2">
                    {getSortedDocumentTypes().map((type, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{getDocumentTypeLabel(type._id)}</span>
                        <span className="text-sm font-medium">{type.count} files</span>
                      </div>
                    ))}
                  </div>
                </div>
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
              placeholder="Search archives..."
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
                    Course Section
                  </label>
                  <select
                    value={courseSectionFilter}
                    onChange={(e) => {
                      setCourseSectionFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Sections</option>
                    {filterOptions.course_sections?.map(section => (
                      <option key={section} value={section}>{section}</option>
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
                    <option value="most_recent">Most Recent </option>
                    <option value="oldest">Oldest </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
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

        {/* Desktop Table - UPDATED with only Preview action */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">File ID</th>
                <th className="px-4 py-3 text-left">Faculty Name</th>
                <th className="px-4 py-3 text-left">File Name</th>
                <th className="px-4 py-3 text-left">Document Type</th>
                <th className="px-4 py-3 text-left">Subject Code</th>
                <th className="px-4 py-3 text-left">Course/Section</th>
                <th className="px-4 py-3 text-left">Semester</th>
                <th className="px-4 py-3 text-left">Academic Year</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Uploaded At</th>
                <th className="px-4 py-3 text-left">Archived At</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                  </td>
                </tr>
              ) : currentArchives.length > 0 ? (
                currentArchives.map((archive) => (
                  <tr key={archive._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{archive.file_id}</td>
                    <td className="px-4 py-3 text-gray-700">{archive.faculty_name}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">{archive.file_name}</td>
                    <td className="px-4 py-3 text-gray-700">{getDocumentTypeLabel(archive.document_type, archive.tos_type)}</td>
                    <td className="px-4 py-3 text-gray-700">{archive.subject_code}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {archive.course_sections && archive.course_sections.length > 0 ? (
                          archive.course_sections.slice(0, 2).map((section, idx) => (
                            <span key={idx} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {section}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                        {archive.course_sections && archive.course_sections.length > 2 && (
                          <span className="text-xs text-gray-500">+{archive.course_sections.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(archive.semester)}`}>
                        {archive.semester}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{archive.school_year}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(archive.status)}`}>
                        {archive.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(archive.uploaded_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(archive.archived_at)}
                    </td>
                    <td className="px-4 py-3 relative action-dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === archive.file_id ? null : archive.file_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === archive.file_id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <button
                            onClick={() => handlePreview(archive)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="text-center py-8 text-gray-500">
                    No archived files found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - UPDATED with only Preview action */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            </div>
          ) : currentArchives.length > 0 ? (
            currentArchives.map((archive) => (
              <div key={archive._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 mr-2">
                    <h2 className="font-semibold text-gray-800 truncate">{archive.file_name}</h2>
                    <p className="text-xs text-gray-600 font-mono truncate">ID: {archive.file_id}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(archive.status)}`}>
                      {archive.status}
                    </span>
                    
                    <div className="relative action-dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === archive.file_id ? null : archive.file_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === archive.file_id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <button
                            onClick={() => handlePreview(archive)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Faculty:</span>
                    <p className="font-medium truncate">{archive.faculty_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Subject:</span>
                    <p className="font-medium truncate">{archive.subject_code}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Course/Section:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {archive.course_sections && archive.course_sections.slice(0, 2).map((section, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Document Type:</span>
                    <p className="font-medium truncate">{getDocumentTypeLabel(archive.document_type, archive.tos_type)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Academic Year:</span>
                    <p className="font-medium">{archive.school_year}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Archived:</span>
                    <p className="font-medium text-xs">{formatDate(archive.archived_at)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No archived files found
            </div>
          )}
        </div>

        {/* Pagination */}
        {sortedArchives.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
            <div className="text-sm text-gray-600">
              Showing {currentArchives.length} of {sortedArchives.length} archived files
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
        {archiveToPreview && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Archive Details
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
                  <p className="mt-1 text-sm text-gray-900 font-mono">{archiveToPreview.file_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(archiveToPreview.status)}`}>
                    {archiveToPreview.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Faculty Name</label>
                <p className="mt-1 text-sm text-gray-900">{archiveToPreview.faculty_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">File Name</label>
                <p className="mt-1 text-sm text-gray-900">{archiveToPreview.file_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Original File Name</label>
                <p className="mt-1 text-sm text-gray-900">{archiveToPreview.original_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <p className="mt-1 text-sm text-gray-900">{getDocumentTypeLabel(archiveToPreview.document_type, archiveToPreview.tos_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Size</label>
                  <p className="mt-1 text-sm text-gray-900">{formatFileSize(archiveToPreview.file_size)}</p>
                </div>
              </div>

              {archiveToPreview.tos_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">TOS Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{archiveToPreview.tos_type}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                  <p className="mt-1 text-sm text-gray-900">{archiveToPreview.subject_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Title</label>
                  <p className="mt-1 text-sm text-gray-900">{archiveToPreview.subject_title}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Course Sections</label>
                <div className="mt-1">
                  <div className="flex flex-wrap gap-2">
                    {archiveToPreview.course_sections && Array.isArray(archiveToPreview.course_sections) ? (
                      archiveToPreview.course_sections.map((section, index) => (
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
                    Total: {archiveToPreview.course_sections?.length || 0} sections
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(archiveToPreview.semester)}`}>
                    {archiveToPreview.semester}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <p className="mt-1 text-sm text-gray-900">{archiveToPreview.school_year}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">File Path</label>
                <p className="mt-1 text-sm text-gray-900 break-all">{archiveToPreview.file_path}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Uploaded At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDateTime(archiveToPreview.uploaded_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Archived At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDateTime(archiveToPreview.archived_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}