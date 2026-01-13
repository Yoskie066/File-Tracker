import { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Edit, Trash2, ChevronDown, Search, X, Filter, ArrowUpDown } from "lucide-react";

// Set app element for react-modal
Modal.setAppElement("#root");

export default function SystemVariableManagement() {
  const [variables, setVariables] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const variablesPerPage = 10;

  // Filter states
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortOption, setSortOption] = useState("most_recent");

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState(null);

  // Subject Code Search/Dropdown state
  const [showSubjectCodeDropdown, setShowSubjectCodeDropdown] = useState(false);
  const [subjectCodeSearch, setSubjectCodeSearch] = useState("");
  const dropdownRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    variable_id: "",
    subject_code: "",
    subject_title: "",
    course: "",
    semester: "",
    academic_year: "",
    created_by: "admin"
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [academicYearError, setAcademicYearError] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Course options - Removed BOTH
  const courseOptions = ['BSCS', 'BSIT'];

  // Semester options
  const semesterOptions = ['1st Semester', '2nd Semester', 'Summer'];

  // Fetch variables from backend 
  const fetchVariables = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/system-variables`); 
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched system variables:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setVariables(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setVariables([]);
      }
    } catch (err) {
      console.error("Error fetching system variables:", err);
      setVariables([]); 
    }
  };

  // Fetch all subjects for dropdown
  const fetchAllSubjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/system-variables/all-subjects`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setAvailableSubjects(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching all subjects:", error);
    }
  };

  // Filter subjects by search term
  const getFilteredSubjects = () => {
    if (!subjectCodeSearch.trim()) {
      return availableSubjects;
    }
    
    const searchTerm = subjectCodeSearch.toLowerCase();
    return availableSubjects.filter(subject => 
      subject.value.toLowerCase().includes(searchTerm) ||
      subject.label.toLowerCase().includes(searchTerm) ||
      subject.subject_title.toLowerCase().includes(searchTerm) ||
      subject.course.toLowerCase().includes(searchTerm)
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

  useEffect(() => {
    fetchVariables();
    fetchAllSubjects();
  }, []);

  // Close action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Get unique values for filters
  const getUniqueValues = (key) => {
    const values = new Set();
    variables.forEach(variable => {
      if (variable[key]) {
        values.add(variable[key]);
      }
    });
    return Array.from(values).sort();
  };

  // Get unique years for filter
  const getUniqueYears = () => {
    const years = new Set();
    variables.forEach(variable => {
      if (variable.academic_year) {
        // Extract year from "A.Y: 2025" or "A.Y: 2025-2026"
        const yearMatch = variable.academic_year.match(/\d{4}/g);
        if (yearMatch) {
          yearMatch.forEach(year => years.add(year));
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Reset all filters
  const resetFilters = () => {
    setSubjectCodeFilter("");
    setCourseFilter("");
    setSemesterFilter("");
    setYearFilter("");
    setSortOption("most_recent");
    setCurrentPage(1);
  };

  // Validate Academic Year format - Updated for single year or range
  const validateAcademicYearFormat = (year) => {
    if (!year) return { valid: false, error: "Academic Year is required" };
    
    // Check format: either exactly 4 digits or 4 digits, hyphen, 4 digits
    const yearRegex = /^\d{4}$|^\d{4}-\d{4}$/;
    
    if (!yearRegex.test(year)) {
      return { valid: false, error: "Format must be: 2025 or 2025-2026 (four digits, optionally hyphen and four digits)" };
    }
    
    // If it's a range, check consecutive years
    if (year.includes('-')) {
      const [startYear, endYear] = year.split('-').map(Number);
      
      // Check if end year is exactly one year after start year
      if (endYear !== startYear + 1) {
        return { valid: false, error: "Must be consecutive years (e.g., 2025-2026)" };
      }
    }
    
    return { valid: true, cleaned: year };
  };

  // Handle Academic Year input
  const handleAcademicYearInput = (e) => {
    const value = e.target.value;
    setAcademicYearError("");
    setFormErrors(prev => ({ ...prev, academic_year: "" }));
    
    // Allow only numbers and hyphen
    const sanitizedValue = value.replace(/[^\d-]/g, '');
    
    // Auto-format as user types
    let formattedValue = sanitizedValue;
    if (sanitizedValue.length === 4 && !sanitizedValue.includes('-')) {
      formattedValue = sanitizedValue;
    } else if (sanitizedValue.length > 4 && !sanitizedValue.includes('-')) {
      formattedValue = sanitizedValue.slice(0, 4) + '-' + sanitizedValue.slice(4, 8);
    }
    
    setFormData(prev => ({
      ...prev,
      academic_year: formattedValue
    }));
  };

  // Handle subject selection from dropdown
  const handleSubjectSelect = (subject) => {
    setFormData({
      ...formData,
      subject_code: subject.value,
      subject_title: subject.subject_title,
      course: subject.course,
      semester: subject.semester || '1st Semester' // Auto-fill semester
    });
    setSubjectCodeSearch(subject.label);
    setShowSubjectCodeDropdown(false);
    
    // Clear form errors
    setFormErrors(prev => ({
      ...prev,
      subject_code: "",
      course: "",
      subject_title: "",
      semester: ""
    }));
  };

  // Clear subject search and selection
  const clearSubjectSearch = () => {
    setSubjectCodeSearch("");
    setFormData(prev => ({
      ...prev,
      subject_code: "",
      subject_title: "",
      course: "",
      semester: ""
    }));
    setShowSubjectCodeDropdown(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'academic_year') {
      handleAcademicYearInput(e);
    } else if (name === 'subject_code') {
      // This is for the search input, not for the actual selection
      setSubjectCodeSearch(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear form errors when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
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
      variable_id: "",
      subject_code: "",
      subject_title: "",
      course: "",
      semester: "",
      academic_year: "",
      created_by: "admin"
    });
    setSubjectCodeSearch("");
    setAcademicYearError("");
    setIsEditMode(false);
    setShowSubjectCodeDropdown(false);
    setFormErrors({});
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.subject_code) {
      errors.subject_code = "Subject Code is required";
    }
    
    if (!formData.course) {
      errors.course = "Course is required";
    }
    
    if (!formData.subject_title) {
      errors.subject_title = "Subject Title is required";
    }
    
    if (!formData.semester) {
      errors.semester = "Semester is required";
    }
    
    if (!formData.academic_year) {
      errors.academic_year = "Academic Year is required";
    } else {
      const validationResult = validateAcademicYearFormat(formData.academic_year);
      if (!validationResult.valid) {
        errors.academic_year = validationResult.error;
      }
    }
    
    if (!isEditMode && !formData.created_by) {
      errors.created_by = "Created By is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Search and filter function
  const getFilteredVariables = () => {
    let filtered = (Array.isArray(variables) ? variables : []);

    // Apply search filter
    filtered = filtered.filter((v) => {
      const searchMatch = [v.variable_id, v.subject_code, v.subject_title, v.course, v.semester, v.academic_year, v.created_by]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()));
      
      return searchMatch;
    });

    // Apply advanced filters
    if (subjectCodeFilter) {
      filtered = filtered.filter(v => v.subject_code === subjectCodeFilter);
    }
    
    if (courseFilter) {
      filtered = filtered.filter(v => v.course === courseFilter);
    }
    
    if (semesterFilter) {
      filtered = filtered.filter(v => v.semester === semesterFilter);
    }
    
    if (yearFilter) {
      filtered = filtered.filter(v => {
        const yearMatch = v.academic_year.match(/\d{4}/g);
        return yearMatch && yearMatch.some(year => year === yearFilter);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      
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

  const filteredVariables = getFilteredVariables();

  // Calculate stats for cards - Updated to remove BOTH count
  const calculateStats = (variablesList) => {
    if (!Array.isArray(variablesList) || variablesList.length === 0) {
      return { 
        total: 0, 
        bscs: 0, 
        bsit: 0,
        distinctSubjects: 0
      };
    }
  
    let bscsCount = 0;
    let bsitCount = 0;
    const subjectSet = new Set();
    
    variablesList.forEach(variable => {
      if (variable.course === 'BSCS') {
        bscsCount++;
      } else if (variable.course === 'BSIT') {
        bsitCount++;
      }
      
      // Count distinct subject codes
      if (variable.subject_code) {
        subjectSet.add(variable.subject_code);
      }
    });
  
    return {
      total: variablesList.length,
      bscs: bscsCount,
      bsit: bsitCount,
      distinctSubjects: subjectSet.size
    };
  };

  const variableStats = calculateStats(filteredVariables);

  // Pagination
  const totalPages = Math.ceil(filteredVariables.length / variablesPerPage);
  const startIndex = (currentPage - 1) * variablesPerPage;
  const currentVariables = filteredVariables.slice(startIndex, startIndex + variablesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Handle form submission 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAcademicYearError("");
    setFormErrors({});

    try {
      // Validate form
      if (!validateForm()) {
        setLoading(false);
        showFeedback("error", "Please fill in all required fields correctly.");
        return;
      }

      const url = isEditMode 
        ? `${API_BASE_URL}/api/admin/system-variables/${formData.variable_id}`
        : `${API_BASE_URL}/api/admin/system-variables`;
      
      const method = isEditMode ? "PUT" : "POST";

      // Note: semester is now auto-filled from subject selection
      const requestData = {
        subject_code: formData.subject_code,
        course: formData.course,
        academic_year: formData.academic_year,
        created_by: formData.created_by
      };

      const response = await fetch(url, { 
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        resetForm();
        setShowModal(false);
        fetchVariables();
        showFeedback("success", 
          isEditMode ? "System variable updated successfully!" : "System variable added successfully!"
        );
      } else {
        showFeedback("error", result.message || `Error ${isEditMode ? 'updating' : 'adding'} system variable`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} system variable:`, error);
      showFeedback("error", error.message || `Error ${isEditMode ? 'updating' : 'creating'} system variable`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit variable
  const handleEdit = async (variableId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/system-variables/${variableId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const variable = result.data;
        
        // Set form data
        const formDataObj = {
          variable_id: variable.variable_id,
          subject_code: variable.subject_code,
          subject_title: variable.subject_title,
          course: variable.course,
          semester: variable.semester,
          academic_year: variable.academic_year.replace('A.Y: ', ''),
          created_by: variable.created_by
        };

        setFormData(formDataObj);
        setSubjectCodeSearch(`${variable.subject_code} - ${variable.subject_title}`);
        setIsEditMode(true);
        setShowModal(true);
      } else {
        showFeedback("error", "Error loading system variable data");
      }
    } catch (error) {
      console.error("Error fetching system variable:", error);
      showFeedback("error", "Error loading system variable data");
    }
    setActionDropdown(null);
  }

  // Handle delete variable
  const handleDelete = async (variableId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/system-variables/${variableId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchVariables();
        showFeedback("success", "System variable deleted successfully!");
      } else {
        showFeedback("error", result.message || "Error deleting system variable");
      }
    } catch (error) {
      console.error("Error deleting system variable:", error);
      showFeedback("error", "Error deleting system variable");
    }
    setDeleteModalOpen(false);
    setVariableToDelete(null);
    setActionDropdown(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (variableId) => {
    setVariableToDelete(variableId);
    setDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">System Variables</h1>
            <p className="text-sm text-gray-500">
              Manage system configuration variables and settings
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-black text-white p-2 rounded-md hover:bg-yellow-400 hover:text-black transition-colors duration-200 flex items-center justify-center w-10 h-10"
              title="Add New Variable"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Show Filters Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full md:w-auto"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Filtering and Sorting Options */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 w-full mt-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    {courseOptions.map(course => (
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
                    {semesterOptions.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Academic Year
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="col-span-1">
                  <span className="text-xs text-gray-500">
                    {filteredVariables.length} of {variables.length} variables
                    {subjectCodeFilter || courseFilter || semesterFilter || yearFilter ? (
                      <span className="ml-2 text-blue-600">
                        ({[
                          subjectCodeFilter && `Subject: ${subjectCodeFilter}`,
                          courseFilter && `Course: ${courseFilter}`,
                          semesterFilter && semesterFilter,
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
                  {(subjectCodeFilter || courseFilter || semesterFilter || yearFilter || sortOption !== "most_recent") && (
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
        </div>

        {/* Statistics Cards - Updated: Removed BOTH, added Distinct Subjects */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Variables</div>
            <div className="text-2xl font-bold text-blue-800">{variableStats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">BSCS</div>
            <div className="text-2xl font-bold text-green-800">{variableStats.bscs}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">BSIT</div>
            <div className="text-2xl font-bold text-yellow-800">{variableStats.bsit}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Distinct Subjects</div>
            <div className="text-2xl font-bold text-purple-800">{variableStats.distinctSubjects}</div>
          </div>
        </div>

        {/* Desktop Table - WITHOUT VARIABLE ID COLUMN */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Code</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Title</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Course</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Semester</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Academic Year</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Created By</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentVariables.length > 0 ? (
                currentVariables.map((variable) => (
                  <tr key={variable._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">
                      {variable.subject_code}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">
                      {variable.subject_title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        variable.course === 'BSCS' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {variable.course}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        variable.semester === '1st Semester' ? 'bg-blue-100 text-blue-800' :
                        variable.semester === '2nd Semester' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {variable.semester}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{variable.academic_year}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{variable.created_by}</td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === variable.variable_id ? null : variable.variable_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === variable.variable_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(variable.variable_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(variable.variable_id)}
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
                  <td colSpan="7" className="text-center py-8 text-gray-500 font-medium">
                    No system variables found {subjectCodeFilter ? `for ${subjectCodeFilter}` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - WITHOUT VARIABLE ID */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentVariables.length > 0 ? (
            currentVariables.map((variable) => (
              <div key={variable._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800 font-mono">
                      {variable.subject_code}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      variable.course === 'BSCS' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {variable.course}
                    </span>
                    
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === variable.variable_id ? null : variable.variable_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === variable.variable_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(variable.variable_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(variable.variable_id)}
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
                    <p className="font-medium">{variable.subject_title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500">Semester:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                        variable.semester === '1st Semester' ? 'bg-blue-100 text-blue-800' :
                        variable.semester === '2nd Semester' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {variable.semester}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Academic Year:</span>
                      <p className="font-medium">{variable.academic_year}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created By:</span>
                    <p className="font-medium">{variable.created_by}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-3">
                  Created: {new Date(variable.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              No system variables found {subjectCodeFilter ? `for ${subjectCodeFilter}` : ""}.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentVariables.length} of {filteredVariables.length} variables
            {yearFilter && ` from ${yearFilter}`}
            {subjectCodeFilter && ` • Subject: ${subjectCodeFilter}`}
            {courseFilter && ` • Course: ${courseFilter}`}
            {semesterFilter && ` • Semester: ${semesterFilter}`}
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

        {/* Add/Edit Variable Modal */}
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
                {isEditMode ? "Update System Variable" : "Add New System Variable"}
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
              {/* Variable ID (readonly in edit mode) */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variable ID
                  </label>
                  <input
                    type="text"
                    name="variable_id"
                    value={formData.variable_id}
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
                      className={`w-full border ${formErrors.subject_code ? 'border-red-500' : 'border-gray-300'} rounded-md pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white`}
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
                        getFilteredSubjects().map((subject, index) => (
                          <div
                            key={`${subject.value}-${subject.course}-${index}`}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                              formData.subject_code === subject.value && formData.course === subject.course ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleSubjectSelect(subject)}
                          >
                            <div className="font-medium text-gray-900">{subject.value}</div>
                            <div className="text-sm text-gray-600">{subject.subject_title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Course: {subject.course} • Semester: {subject.semester}
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
                  {formErrors.subject_code && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.subject_code}</p>
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
                  className={`w-full border ${formErrors.course ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed`}
                  placeholder="Will auto-populate when you select a subject"
                />
                {formErrors.course && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.course}</p>
                )}
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
                  className={`w-full border ${formErrors.subject_title ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed`}
                  placeholder="Will auto-populate when you select a subject"
                />
                {formErrors.subject_title && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.subject_title}</p>
                )}
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
                  className={`w-full border ${formErrors.semester ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed`}
                  placeholder="Will auto-populate when you select a subject"
                />
                {formErrors.semester && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.semester}</p>
                )}
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-md px-3 py-2 text-sm text-gray-700">
                    A.Y:
                  </span>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    required
                    className={`w-full border ${formErrors.academic_year ? 'border-red-500' : 'border-gray-300'} rounded-r-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                    placeholder="2025 or 2025-2026"
                    maxLength={9}
                    title="Enter academic year in format: 2025 or 2025-2026"
                  />
                </div>
                {formErrors.academic_year ? (
                  <p className="mt-1 text-xs text-red-600">{formErrors.academic_year}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Format: 2025 or 2025-2026 (consecutive years for range)
                  </p>
                )}
              </div>

              {/* Created By (hidden in edit mode) */}
              {!isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created By *
                  </label>
                  <input
                    type="text"
                    name="created_by"
                    value={formData.created_by}
                    onChange={handleInputChange}
                    required
                    className={`w-full border ${formErrors.created_by ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors`}
                    placeholder="Enter creator name"
                  />
                  {formErrors.created_by && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.created_by}</p>
                  )}
                </div>
              )}

              {/* Auto-population notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  <strong>Auto-population:</strong> Course, Subject Title, and Semester are automatically populated when you select a Subject Code.
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
                  disabled={loading || !formData.subject_code || !formData.course || !formData.semester || !formData.academic_year}
                  className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Variable" : "Add Variable")}
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
              Are you sure you want to delete this system variable? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(variableToDelete)}
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