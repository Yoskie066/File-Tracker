import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Edit, Trash2, Filter, ArrowUpDown } from "lucide-react";

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
  const [typeFilter, setTypeFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortOption, setSortOption] = useState("most_recent");

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    variable_id: "",
    variable_type: "",
    subject_code: "",
    subject_title: "",
    course_section: "",
    semester: "",
    academic_year: "",
    created_by: "admin"
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [academicYearError, setAcademicYearError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Variable type options 
  const variableTypeOptions = [
    "subject_code",
    "course_section", 
    "academic_year",
    "semester"
  ];

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

  useEffect(() => {
    fetchVariables();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Get unique values for filters
  const getUniqueValues = (key) => {
    const values = new Set();
    variables.forEach(variable => {
      if (key === 'variable_type' && variable.variable_type) {
        values.add(variable.variable_type);
      } else if (key === 'months') {
        if (variable.created_at) {
          const month = new Date(variable.created_at).getMonth();
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          values.add(monthNames[month]);
        }
      } else if (key === 'years') {
        if (variable.created_at) {
          const year = new Date(variable.created_at).getFullYear();
          values.add(year);
        }
      }
    });
    return Array.from(values).sort();
  };

  // Get unique years for filter
  const getUniqueYears = () => {
    const years = new Set();
    variables.forEach(variable => {
      if (variable.created_at) {
        const year = new Date(variable.created_at).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Reset all filters
  const resetFilters = () => {
    setTypeFilter("");
    setMonthFilter("");
    setYearFilter("");
    setSortOption("most_recent");
    setCurrentPage(1);
  };

  // Validate Academic Year format
  const validateAcademicYearFormat = (year) => {
    if (!year) return { valid: false, error: "Academic Year is required" };
    
    // Check format: exactly 4 digits, hyphen, exactly 4 digits
    const yearRegex = /^\d{4}-\d{4}$/;
    
    if (!yearRegex.test(year)) {
      return { valid: false, error: "Format must be: 2025-2026 (four digits, hyphen, four digits)" };
    }
    
    const [startYear, endYear] = year.split('-').map(Number);
    
    // Check if end year is exactly one year after start year
    if (endYear !== startYear + 1) {
      return { valid: false, error: "Must be consecutive years (e.g., 2025-2026)" };
    }
    
    return { valid: true, cleaned: `${startYear}-${endYear}` };
  };

  // Handle Academic Year input
  const handleAcademicYearInput = (e) => {
    const value = e.target.value;
    setAcademicYearError("");
    
    // Allow only numbers and hyphen
    const sanitizedValue = value.replace(/[^\d-]/g, '');
    
    // Format as user types
    let formattedValue = sanitizedValue;
    if (sanitizedValue.length === 4 && !sanitizedValue.includes('-')) {
      formattedValue = sanitizedValue + '-';
    }
    
    setFormData(prev => ({
      ...prev,
      academic_year: formattedValue
    }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'academic_year') {
      handleAcademicYearInput(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle variable type change - reset all fields
  const handleVariableTypeChange = (e) => {
    const { value } = e.target;
    setAcademicYearError("");
    setFormData({
      variable_id: formData.variable_id,
      variable_type: value,
      subject_code: "",
      subject_title: "",
      course_section: "",
      semester: "",
      academic_year: "",
      created_by: formData.created_by
    });
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
      variable_type: "",
      subject_code: "",
      subject_title: "",
      course_section: "",
      semester: "",
      academic_year: "",
      created_by: "admin"
    });
    setAcademicYearError("");
    setIsEditMode(false);
  };

  // Get variable name based on type
  const getVariableNameByType = () => {
    switch(formData.variable_type) {
      case 'subject_code': return formData.subject_code;
      case 'course_section': return formData.course_section;
      case 'semester': return formData.semester;
      case 'academic_year': return formData.academic_year;
      default: return "";
    }
  };

  // Search and filter function
  const getFilteredVariables = () => {
    let filtered = (Array.isArray(variables) ? variables : []);

    // Apply search filter
    filtered = filtered.filter((v) => {
      const searchMatch = [v.variable_id, v.variable_name, v.variable_type, v.created_by, v.subject_title]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()));
      
      const typeMatch = !typeFilter || v.variable_type === typeFilter;
      
      return searchMatch && typeMatch;
    });

    // Apply month filter (created date)
    if (monthFilter) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = monthNames.indexOf(monthFilter);
      
      filtered = filtered.filter(variable => {
        if (!variable.created_at) return false;
        const variableMonth = new Date(variable.created_at).getMonth();
        return variableMonth === monthIndex;
      });
    }

    // Apply year filter (created date)
    if (yearFilter) {
      filtered = filtered.filter(variable => {
        if (!variable.created_at) return false;
        const variableYear = new Date(variable.created_at).getFullYear();
        return variableYear === parseInt(yearFilter);
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

  // Calculate stats for cards
  const calculateStats = (variablesList) => {
    if (!Array.isArray(variablesList) || variablesList.length === 0) {
      return { total: 0, subject_code: 0, course_section: 0, academic_year: 0, semester: 0 };
    }
  
    let subjectCodeCount = 0;
    let courseSectionCount = 0;
    let academicYearCount = 0;
    let semesterCount = 0;
  
    variablesList.forEach(variable => {
      const type = variable.variable_type?.toLowerCase().trim();
      
      if (type === 'subject_code') {
        subjectCodeCount++;
      } else if (type === 'course_section') {
        courseSectionCount++;
      } else if (type === 'academic_year') {
        academicYearCount++;
      } else if (type === 'semester') {
        semesterCount++;
      }
    });
  
    return {
      total: variablesList.length,
      subject_code: subjectCodeCount,
      course_section: courseSectionCount,
      academic_year: academicYearCount,
      semester: semesterCount
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

    try {
      // Get variable name based on type
      const variableName = getVariableNameByType();
      
      if (!variableName || !formData.variable_type || (!isEditMode && !formData.created_by)) {
        throw new Error("Please fill in all required fields");
      }

      // Additional validation for subject_code
      if (formData.variable_type === 'subject_code' && !formData.subject_title) {
        throw new Error("Subject Title is required for Subject Code type");
      }

      // Validate Academic Year format
      if (formData.variable_type === 'academic_year') {
        const validationResult = validateAcademicYearFormat(formData.academic_year);
        if (!validationResult.valid) {
          setAcademicYearError(validationResult.error);
          throw new Error(validationResult.error);
        }
      }

      const url = isEditMode 
        ? `${API_BASE_URL}/api/admin/system-variables/${formData.variable_id}`
        : `${API_BASE_URL}/api/admin/system-variables`;
      
      const method = isEditMode ? "PUT" : "POST";

      // Prepare request data based on variable type
      const requestData = {
        variable_type: formData.variable_type,
        created_by: formData.created_by
      };

      // Add type-specific fields
      if (formData.variable_type === 'subject_code') {
        requestData.subject_code = formData.subject_code;
        requestData.subject_title = formData.subject_title;
      } else if (formData.variable_type === 'course_section') {
        requestData.course_section = formData.course_section;
      } else if (formData.variable_type === 'semester') {
        requestData.semester = formData.semester;
      } else if (formData.variable_type === 'academic_year') {
        requestData.academic_year = formData.academic_year;
      }

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
        
        // Set form data based on variable type
        const formDataObj = {
          variable_id: variable.variable_id,
          variable_type: variable.variable_type,
          created_by: variable.created_by
        };

        // Set type-specific fields
        if (variable.variable_type === 'subject_code') {
          formDataObj.subject_code = variable.variable_name;
          formDataObj.subject_title = variable.subject_title || "";
        } else if (variable.variable_type === 'course_section') {
          formDataObj.course_section = variable.variable_name;
        } else if (variable.variable_type === 'semester') {
          formDataObj.semester = variable.variable_name;
        } else if (variable.variable_type === 'academic_year') {
          // Extract just the year range from "A.Y: 2025-2026"
          const yearMatch = variable.variable_name.match(/\d{4}-\d{4}/);
          formDataObj.academic_year = yearMatch ? yearMatch[0] : "";
        }

        setFormData(formDataObj);
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

  // Format variable name for display
  const formatVariableNameForDisplay = (variable) => {
    if (variable.variable_type === 'academic_year') {
      return variable.variable_name; // Already formatted as "A.Y: 2025-2026"
    }
    return variable.variable_name;
  };

  // Render form fields based on variable type
  const renderFormFields = () => {
    switch(formData.variable_type) {
      case 'subject_code':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                name="subject_code"
                value={formData.subject_code}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                placeholder="Enter subject code (e.g., COSC-50)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Title *
              </label>
              <input
                type="text"
                name="subject_title"
                value={formData.subject_title}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                placeholder="Enter subject title (e.g., Discrete Structure)"
              />
            </div>
          </>
        );
      case 'course_section':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course/Section *
            </label>
            <input
              type="text"
              name="course_section"
              value={formData.course_section}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
              placeholder="Enter course/section (e.g., BSCS-1A)"
            />
          </div>
        );
      case 'semester':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester *
            </label>
            <input
              type="text"
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
              placeholder="Enter semester (e.g., 1st Semester)"
            />
          </div>
        );
      case 'academic_year':
        return (
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
                className="w-full border border-gray-300 rounded-r-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                placeholder="2025-2026"
                maxLength={9}
                pattern="\d{4}-\d{4}"
                title="Enter academic year in format: 2025-2026"
              />
            </div>
            {academicYearError && (
              <p className="mt-1 text-xs text-red-600">{academicYearError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Format: 2025-2026 (consecutive years only)
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header - UPDATED STRUCTURE */}
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

        {/* Show Filters Button - MOVED BELOW HEADER LIKE FACULTY LOAD */}
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
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Types</option>
                    {variableTypeOptions.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Month (Created At)
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
                    Year (Created At)
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

                <div className="flex items-end">
                  {(typeFilter || monthFilter || yearFilter || sortOption !== "most_recent") && (
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors w-full"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="col-span-1">
                  <span className="text-xs text-gray-500">
                    {filteredVariables.length} of {variables.length} variables
                    {typeFilter || monthFilter || yearFilter ? (
                      <span className="ml-2 text-blue-600">
                        ({[
                          typeFilter && "Type",
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
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Variables</div>
            <div className="text-2xl font-bold text-blue-800">{variableStats.total}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Subject Code</div>
            <div className="text-2xl font-bold text-purple-800">{variableStats.subject_code}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Course Section</div>
            <div className="text-2xl font-bold text-green-800">{variableStats.course_section}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Academic Year</div>
            <div className="text-2xl font-bold text-yellow-800">{variableStats.academic_year}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-600 text-sm font-medium">Semester</div>
            <div className="text-2xl font-bold text-red-800">{variableStats.semester}</div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Variable ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Variable Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Title</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Created By</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Created At</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentVariables.length > 0 ? (
                currentVariables.map((variable) => (
                  <tr key={variable._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{variable.variable_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatVariableNameForDisplay(variable)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        variable.variable_type === 'subject_code' ? 'bg-purple-100 text-purple-800' :
                        variable.variable_type === 'course_section' ? 'bg-green-100 text-green-800' :
                        variable.variable_type === 'academic_year' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {variable.variable_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">
                      {variable.variable_type === 'subject_code' ? (variable.subject_title || 'N/A') : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{variable.created_by}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(variable.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
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
                    No system variables found {typeFilter ? `for ${typeFilter.replace('_', ' ')}` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentVariables.length > 0 ? (
            currentVariables.map((variable) => (
              <div key={variable._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {formatVariableNameForDisplay(variable)}
                    </h2>
                    <p className="text-sm text-gray-600 font-mono">ID: {variable.variable_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      variable.variable_type === 'subject_code' ? 'bg-purple-100 text-purple-800' :
                      variable.variable_type === 'course_section' ? 'bg-green-100 text-green-800' :
                      variable.variable_type === 'academic_year' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {variable.variable_type.replace('_', ' ')}
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
                    <p className="font-medium">
                      {variable.variable_type === 'subject_code' ? (variable.subject_title || 'N/A') : 'N/A'}
                    </p>
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
              No system variables found {typeFilter ? `for ${typeFilter.replace('_', ' ')}` : ""}.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentVariables.length} of {filteredVariables.length} variables
            {yearFilter && ` from ${yearFilter}`}
            {monthFilter && `, ${monthFilter}`}
            {typeFilter && ` • Type: ${typeFilter.replace('_', ' ')}`}
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
          className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto mx-auto my-8"
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

              {/* Variable Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variable Type *
                </label>
                <select
                  name="variable_type"
                  value={formData.variable_type}
                  onChange={handleVariableTypeChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  <option value="">Select variable type</option>
                  {variableTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditionally render form fields based on variable type */}
              {renderFormFields()}

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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder="Enter creator name"
                  />
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
                  disabled={loading || !formData.variable_type}
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