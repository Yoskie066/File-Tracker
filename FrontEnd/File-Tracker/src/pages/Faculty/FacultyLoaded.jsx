import { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Edit, Trash2, ChevronDown, Search, X, Filter, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tokenService from "../../services/tokenService";

// Set app element for react-modal
Modal.setAppElement("#root");

export default function FacultyLoadManagement() {
  const [facultyLoads, setFacultyLoads] = useState([]);
  const [systemSubjects, setSystemSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const facultyLoadsPerPage = 10;

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [facultyLoadToDelete, setFacultyLoadToDelete] = useState(null);

  // Subject Code Search/Dropdown state
  const [showSubjectCodeDropdown, setShowSubjectCodeDropdown] = useState(false);
  const [subjectCodeSearch, setSubjectCodeSearch] = useState("");
  const dropdownRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    faculty_loaded_id: "",
    subject_code: "",
    subject_title: "",
    course: "",
    semester: "",
    school_year: ""
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();

  // Filtering and Sorting states
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState("");
  const [sortOption, setSortOption] = useState("most_recent");
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch system subjects for dropdown
  const fetchSystemSubjects = async () => {
    try {
      const token = tokenService.getFacultyAccessToken();
      if (!token) {
        console.error("No access token found");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/faculty/faculty-loaded/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error("Server responded with " + res.status);
      }
      
      const result = await res.json();
      console.log("Fetched system subjects:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setSystemSubjects(result.data);
      } else {
        console.error("Unexpected API response format for system subjects:", result);
        setSystemSubjects([]);
      }
    } catch (err) {
      console.error("Error fetching system subjects:", err);
      setSystemSubjects([]);
    }
  };

  // Filter subjects by search term
  const getFilteredSubjects = () => {
    if (!subjectCodeSearch.trim()) {
      return systemSubjects;
    }
    
    const searchTerm = subjectCodeSearch.toLowerCase();
    return systemSubjects.filter(subject => 
      subject.value.toLowerCase().includes(searchTerm) ||
      subject.label.toLowerCase().includes(searchTerm) ||
      subject.subject_title.toLowerCase().includes(searchTerm)
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSubjectCodeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add authentication check on component mount
  useEffect(() => {
    // Check if user is authenticated
    const token = tokenService.getFacultyAccessToken();
    const facultyData = localStorage.getItem('faculty');
    
    if (!token || !facultyData) {
      showFeedback("error", "Please login to access this page");
      navigate('/auth/login');
      return;
    }
    
    fetchFacultyLoads();
    fetchSystemSubjects();
  }, [navigate]);

  // Fetch faculty loads from backend 
  const fetchFacultyLoads = async () => {
    try {
      if (!tokenService.isFacultyAuthenticated()) {
        showFeedback("error", "Please login again");
        navigate('/auth/login');
        return;
      }
  
      // Use authFetch instead of direct fetch
      const response = await tokenService.authFetch(`${API_BASE_URL}/api/faculty/faculty-loaded`);
      
      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearFacultyTokens();
          showFeedback("error", "Session expired. Please login again.");
          navigate('/auth/login');
          return;
        }
        throw new Error("Server responded with " + response.status);
      }
      
      const result = await response.json();
      console.log("Fetched faculty loads for current user:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setFacultyLoads(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setFacultyLoads([]);
      }
    } catch (err) {
      console.error("Error fetching faculty loads:", err);
      if (err.message === 'Token refresh failed') {
        showFeedback("error", "Session expired. Please login again.");
        tokenService.clearFacultyTokens();
        navigate('/auth/login');
      }
      setFacultyLoads([]);
    }
  };

  // Close action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'subject_code') {
      // This is for the search input, not for the actual selection
      setSubjectCodeSearch(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle subject code selection from dropdown
  const handleSubjectSelect = (subject) => {
    setFormData({
      faculty_loaded_id: formData.faculty_loaded_id,
      subject_code: subject.value,
      subject_title: subject.subject_title,
      course: subject.course,
      semester: subject.semester,
      school_year: subject.academic_year
    });
    setSubjectCodeSearch(subject.label);
    setShowSubjectCodeDropdown(false);
  };

  // Clear subject code search and selection
  const clearSubjectSearch = () => {
    setSubjectCodeSearch("");
    setFormData(prev => ({
      ...prev,
      subject_code: "",
      subject_title: "",
      course: "",
      semester: "",
      school_year: ""
    }));
    setShowSubjectCodeDropdown(false);
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
      faculty_loaded_id: "",
      subject_code: "",
      subject_title: "",
      course: "",
      semester: "",
      school_year: ""
    });
    setSubjectCodeSearch("");
    setShowSubjectCodeDropdown(false);
    setIsEditMode(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setSubjectCodeFilter("");
    setCourseFilter("");
    setSemesterFilter("");
    setSchoolYearFilter("");
    setSortOption("most_recent");
    setCurrentPage(1);
  };

  // Handle form submission 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const token = tokenService.getFacultyAccessToken();
      if (!token) {
        showFeedback("error", "Please login again. No authentication token found.");
        setLoading(false);
        return;
      }

      // Validate that subject code is selected
      if (!formData.subject_code) {
        showFeedback("error", "Please select a valid subject.");
        setLoading(false);
        return;
      }

      const url = isEditMode 
        ? `${API_BASE_URL}/api/faculty/faculty-loaded/${formData.faculty_loaded_id}`
        : `${API_BASE_URL}/api/faculty/faculty-loaded`;
      
      const method = isEditMode ? "PUT" : "POST";
  
      const requestData = {
        subject_code: formData.subject_code,
        course: formData.course,
        semester: formData.semester,
        school_year: formData.school_year
      };
  
      console.log("Sending request to:", url);
      console.log("Request method:", method);
      console.log("Request data:", requestData);
  
      const response = await fetch(url, { 
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(requestData),
      });
  
      const result = await response.json();
      console.log("Server response:", result);
  
      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearFacultyTokens();
          showFeedback("error", "Session expired. Please login again.");
          setTimeout(() => navigate('/faculty-login'), 2000);
          return;
        }
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
  
      if (result.success) {
        resetForm();
        setShowModal(false);
        fetchFacultyLoads();
        showFeedback("success", 
          isEditMode ? "Faculty load updated successfully!" : "Faculty load added successfully! Task deliverables auto-created."
        );
      } else {
        showFeedback("error", result.message || `Error ${isEditMode ? 'updating' : 'adding'} faculty load`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} faculty load:`, error);
      showFeedback("error", error.message || `Error ${isEditMode ? 'updating' : 'creating'} faculty load`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit faculty load 
  const handleEdit = async (facultyLoadId) => {
    try {
      const token = tokenService.getFacultyAccessToken();
      if (!token) {
        showFeedback("error", "Please login again");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/faculty/faculty-loaded/${facultyLoadId}`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearFacultyTokens();
          showFeedback("error", "Session expired. Please login again.");
          return;
        }
        throw new Error("Failed to fetch faculty load data");
      }

      const result = await response.json();
  
      if (result.success && result.data) {
        const facultyLoad = result.data;
        
        setFormData({
          faculty_loaded_id: facultyLoad.faculty_loaded_id,
          subject_code: facultyLoad.subject_code,
          subject_title: facultyLoad.subject_title,
          course: facultyLoad.course,
          semester: facultyLoad.semester,
          school_year: facultyLoad.school_year
        });
        setSubjectCodeSearch(`${facultyLoad.subject_code} - ${facultyLoad.subject_title}`);
        setIsEditMode(true);
        setShowModal(true);
      } else {
        showFeedback("error", "Error loading faculty load data");
      }
    } catch (error) {
      console.error("Error fetching faculty load:", error);
      showFeedback("error", "Error loading faculty load data");
    }
    setActionDropdown(null);
  }

  // Handle delete faculty load 
  const handleDelete = async (facultyLoadId) => {
    try {
      const token = tokenService.getFacultyAccessToken();
      if (!token) {
        showFeedback("error", "Please login again");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/faculty/faculty-loaded/${facultyLoadId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearFacultyTokens();
          showFeedback("error", "Session expired. Please login again.");
          return;
        }
        throw new Error(result.message || "Error deleting faculty load");
      }

      if (result.success) {
        fetchFacultyLoads();
        showFeedback("success", "Faculty load deleted successfully!");
      } else {
        showFeedback("error", result.message || "Error deleting faculty load");
      }
    } catch (error) {
      console.error("Error deleting faculty load:", error);
      showFeedback("error", "Error deleting faculty load");
    }
    setDeleteModalOpen(false);
    setFacultyLoadToDelete(null);
    setActionDropdown(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (facultyLoadId) => {
    setFacultyLoadToDelete(facultyLoadId);
    setDeleteModalOpen(true);
  };

  // Get unique values for filters
  const getUniqueValues = (key) => {
    let filtered = (Array.isArray(facultyLoads) ? facultyLoads : []);
    const values = new Set();
    
    filtered.forEach(load => {
      if (key === 'subject_code' && load.subject_code) {
        values.add(load.subject_code);
      } else if (key === 'course' && load.course) {
        values.add(load.course);
      } else if (key === 'semester' && load.semester) {
        values.add(load.semester);
      } else if (key === 'school_year' && load.school_year) {
        values.add(load.school_year);
      }
    });

    return Array.from(values).sort();
  };

  // Apply filters and sorting to faculty loads
  const getFilteredFacultyLoads = () => {
    let filtered = (Array.isArray(facultyLoads) ? facultyLoads : []);

    // Apply search filter
    filtered = filtered.filter((fl) =>
      [fl.faculty_loaded_id, fl.subject_code, fl.subject_title, fl.course, fl.semester, fl.school_year]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

    // Apply advanced filters
    if (subjectCodeFilter) {
      filtered = filtered.filter(load => load.subject_code === subjectCodeFilter);
    }
    
    if (courseFilter) {
      filtered = filtered.filter(load => load.course === courseFilter);
    }
    
    if (semesterFilter) {
      filtered = filtered.filter(load => load.semester === semesterFilter);
    }
    
    if (schoolYearFilter) {
      filtered = filtered.filter(load => load.school_year === schoolYearFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.updated_at);
      const dateB = new Date(b.created_at || b.updated_at);
      
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

  const filteredFacultyLoads = getFilteredFacultyLoads();

  // Calculate stats for cards
  const facultyLoadStats = {
    total: Array.isArray(facultyLoads) ? facultyLoads.length : 0,
    subjectCode: Array.isArray(facultyLoads) ? [...new Set(facultyLoads.map(fl => fl.subject_code))].length : 0,
    course: Array.isArray(facultyLoads) ? [...new Set(facultyLoads.map(fl => fl.course))].length : 0,
    schoolYear: Array.isArray(facultyLoads) ? [...new Set(facultyLoads.map(fl => fl.school_year))].length : 0
  };

  // Pagination
  const totalPages = Math.ceil(filteredFacultyLoads.length / facultyLoadsPerPage);
  const startIndex = (currentPage - 1) * facultyLoadsPerPage;
  const currentFacultyLoads = filteredFacultyLoads.slice(startIndex, startIndex + facultyLoadsPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Faculty Load</h1>
            <p className="text-sm text-gray-500">
              Manage faculty teaching loads and course assignments
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search faculty loads..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
            {/* Plus Sign Button */}
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-black text-white p-2 rounded-md hover:bg-yellow-400 hover:text-black transition-colors duration-200 flex items-center justify-center w-10 h-10"
              title="Add New Faculty Load"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filtering and Sorting Options - Show Filters Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full md:w-auto"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 w-full mt-4">
              {/* First Row - 4 columns */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <option value="">All Subject Codes</option>
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
                    <option value="">All Academic Years</option>
                    {getUniqueValues('school_year').map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Second Row - Sort and Reset */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
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
                
                <div className="col-span-1">
                  <div className="flex items-center gap-2 h-full">
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Sorted by: {sortOption === "most_recent" ? "Most Recent" : "Oldest"}</span>
                  </div>
                </div>
                
                <div className="col-span-1 text-right">
                  {(subjectCodeFilter || courseFilter || semesterFilter || schoolYearFilter || sortOption !== "most_recent") && (
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Summary */}
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                {filteredFacultyLoads.length} of {facultyLoads.length} faculty loads
                {subjectCodeFilter || courseFilter || semesterFilter || schoolYearFilter ? (
                  <span className="ml-2 text-blue-600">
                    ({[
                      subjectCodeFilter && `Subject: ${subjectCodeFilter}`,
                      courseFilter && `Course: ${courseFilter}`,
                      semesterFilter && `Semester: ${semesterFilter}`,
                      schoolYearFilter && `Year: ${schoolYearFilter}`
                    ].filter(Boolean).join(", ")})
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Loads</div>
            <div className="text-2xl font-bold text-blue-800">{facultyLoadStats.total}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Subject Code</div>
            <div className="text-2xl font-bold text-purple-800">{facultyLoadStats.subjectCode}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Courses</div>
            <div className="text-2xl font-bold text-green-800">{facultyLoadStats.course}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Academic Year</div>
            <div className="text-2xl font-bold text-yellow-800">{facultyLoadStats.schoolYear}</div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Load ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Code</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Title</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Course</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Semester</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Academic Year</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Created</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentFacultyLoads.length > 0 ? (
                currentFacultyLoads.map((facultyLoad) => (
                  <tr key={facultyLoad._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{facultyLoad.faculty_loaded_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 font-mono">{facultyLoad.subject_code}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{facultyLoad.subject_title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        facultyLoad.course === 'BSCS' ? 'bg-purple-100 text-purple-800' :
                        facultyLoad.course === 'BSIT' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {facultyLoad.course}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        facultyLoad.semester === '1st Semester' ? 'bg-blue-100 text-blue-800' :
                        facultyLoad.semester === '2nd Semester' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {facultyLoad.semester}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{facultyLoad.school_year}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {new Date(facultyLoad.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === facultyLoad.faculty_loaded_id ? null : facultyLoad.faculty_loaded_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === facultyLoad.faculty_loaded_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(facultyLoad.faculty_loaded_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(facultyLoad.faculty_loaded_id)}
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
                    No faculty loads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentFacultyLoads.length > 0 ? (
            currentFacultyLoads.map((facultyLoad) => (
              <div key={facultyLoad._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800 font-mono">{facultyLoad.subject_code}</h2>
                    <p className="text-sm text-gray-600 font-mono">ID: {facultyLoad.faculty_loaded_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      facultyLoad.course === 'BSCS' ? 'bg-purple-100 text-purple-800' :
                      facultyLoad.course === 'BSIT' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {facultyLoad.course}
                    </span>
                    
                    {/* Mobile Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === facultyLoad.faculty_loaded_id ? null : facultyLoad.faculty_loaded_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === facultyLoad.faculty_loaded_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(facultyLoad.faculty_loaded_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(facultyLoad.faculty_loaded_id)}
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
                
                <div className="grid grid-cols-1 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Subject Title:</span>
                    <p className="font-medium">{facultyLoad.subject_title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500">Semester:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                        facultyLoad.semester === '1st Semester' ? 'bg-blue-100 text-blue-800' :
                        facultyLoad.semester === '2nd Semester' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {facultyLoad.semester}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Academic Year:</span>
                      <p className="font-medium">{facultyLoad.school_year}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="font-medium text-xs">{new Date(facultyLoad.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              No faculty loads found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentFacultyLoads.length} of {filteredFacultyLoads.length} faculty loads
            {subjectCodeFilter && ` • Subject: ${subjectCodeFilter}`}
            {courseFilter && ` • Course: ${courseFilter}`}
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

        {/* Add/Edit Faculty Load Modal */}
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
                {isEditMode ? "Update Faculty Load" : "Add New Faculty Load"}
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
              {/* Faculty Load ID (readonly in edit mode) */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faculty Load ID
                  </label>
                  <input
                    type="text"
                    name="faculty_loaded_id"
                    value={formData.faculty_loaded_id}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Subject Code - COMBINED SEARCH AND DROPDOWN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code *
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="subject_code"
                      value={subjectCodeSearch}
                      onChange={handleInputChange}
                      onFocus={() => setShowSubjectCodeDropdown(true)}
                      placeholder="Search subject code or title..."
                      required
                      className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                    />
                    {subjectCodeSearch && (
                      <button
                        type="button"
                        onClick={clearSubjectSearch}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowSubjectCodeDropdown(!showSubjectCodeDropdown)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Dropdown with search results */}
                  {showSubjectCodeDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredSubjects().length > 0 ? (
                        getFilteredSubjects().map((subject) => (
                          <div
                            key={subject.value}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                              formData.subject_code === subject.value ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleSubjectSelect(subject)}
                          >
                            <div className="font-medium text-gray-900">{subject.value}</div>
                            <div className="text-sm text-gray-600">{subject.subject_title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Course: {subject.course} • Semester: {subject.semester} • {subject.academic_year}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-center text-gray-500">
                          No subjects found matching "{subjectCodeSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Course - Auto-populated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course *
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  placeholder="Will auto-populate when you select a subject"
                />
              </div>

              {/* Subject Title - Auto-populated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Title *
                </label>
                <input
                  type="text"
                  name="subject_title"
                  value={formData.subject_title}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  placeholder="Will auto-populate when you select a subject"
                />
              </div>

              {/* Semester - Auto-populated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester *
                </label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  placeholder="Will auto-populate when you select a subject"
                />
              </div>

              {/* School Year - Auto-populated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  name="school_year"
                  value={formData.school_year}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  placeholder="Will auto-populate when you select a subject"
                />
              </div>

              {/* Auto-sync notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  <strong>Auto-population:</strong> All fields except Subject Code are automatically populated from System Variables.
                  <br />
                  <strong>Auto-sync enabled:</strong> Task deliverables will be automatically created when you add a faculty load.
                </p>
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
                  disabled={loading || !formData.subject_code}
                  className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Faculty Load" : "Add Faculty Load")}
                </button>
              </div>
            </form>
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
              Are you sure you want to delete this faculty load? This will also delete all associated task deliverables.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(facultyLoadToDelete)}
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