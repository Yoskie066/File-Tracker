import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Filter, Search, ArrowUpDown, MoreVertical, Eye } from "lucide-react";
import Modal from "react-modal";
import tokenService from "../../services/tokenService";

Modal.setAppElement("#root");

export default function TaskDeliverables() {
  const [taskDeliverables, setTaskDeliverables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters
  const [search, setSearch] = useState("");
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOption, setSortOption] = useState("most_recent");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [actionDropdown, setActionDropdown] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch task deliverables
  const fetchTaskDeliverables = async () => {
    try {
      setLoading(true);
      if (!tokenService.isFacultyAuthenticated()) {
        console.error("No token found");
        return;
      }

      const response = await tokenService.authFetch(`${API_BASE_URL}/api/faculty/task-deliverables`);
      
      if (!response.ok) throw new Error("Server responded with " + response.status);
      const result = await response.json();
      console.log("Fetched task deliverables:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setTaskDeliverables(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setTaskDeliverables([]);
      }
    } catch (err) {
      console.error("Error fetching task deliverables:", err);
      if (err.message === 'Token refresh failed') {
        tokenService.clearFacultyTokens();
      }
      setTaskDeliverables([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDeliverables();
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

  // Handle preview
  const handlePreview = (task) => {
    setSelectedTask(task);
    setPreviewModalOpen(true);
    setActionDropdown(null);
  };

  // Get unique values for filters
  const getUniqueValues = (key) => {
    let filtered = (Array.isArray(taskDeliverables) ? taskDeliverables : []);
    const values = new Set();
    
    filtered.forEach(task => {
      if (key === 'subject_code' && task.subject_code) {
        values.add(task.subject_code);
      } else if (key === 'course' && task.course) {
        values.add(task.course);
      } else if (key === 'semester' && task.semester) {
        values.add(task.semester);
      } else if (key === 'school_year' && task.school_year) {
        values.add(task.school_year);
      }
    });

    return Array.from(values).sort();
  };

  // Reset all filters
  const resetFilters = () => {
    setSubjectCodeFilter("");
    setCourseFilter("");
    setSemesterFilter("");
    setSchoolYearFilter("");
    setStatusFilter("");
    setSortOption("most_recent");
    setCurrentPage(1);
  };

  // Apply filters and sorting
  const getFilteredTasks = () => {
    let filtered = (Array.isArray(taskDeliverables) ? taskDeliverables : []);

    // Apply search filter
    filtered = filtered.filter((task) =>
      [task.subject_code, task.subject_title, task.course, task.semester, task.school_year]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

    // Apply advanced filters
    if (subjectCodeFilter) {
      filtered = filtered.filter(task => task.subject_code === subjectCodeFilter);
    }
    
    if (courseFilter) {
      filtered = filtered.filter(task => task.course === courseFilter);
    }
    
    if (semesterFilter) {
      filtered = filtered.filter(task => task.semester === semesterFilter);
    }
    
    if (schoolYearFilter) {
      filtered = filtered.filter(task => task.school_year === schoolYearFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(task => {
        // Check if any of the task statuses match the filter
        const statuses = [
          task.syllabus,
          task.tos_midterm,
          task.tos_final,
          task.midterm_exam,
          task.final_exam,
          task.instructional_materials
        ];
        return statuses.includes(statusFilter);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.updated_at);
      const dateB = new Date(b.updated_at);
      
      switch (sortOption) {
        case "most_recent":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "subject_asc":
          return a.subject_code.localeCompare(b.subject_code);
        case "subject_desc":
          return b.subject_code.localeCompare(a.subject_code);
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  // Calculate completion percentage
  const calculateCompletion = (task) => {
    const statuses = [
      task.syllabus,
      task.tos_midterm,
      task.tos_final,
      task.midterm_exam,
      task.final_exam,
      task.instructional_materials
    ];
    
    const completedCount = statuses.filter(status => status === 'completed').length;
    const totalCount = statuses.length;
    
    return {
      percentage: Math.round((completedCount / totalCount) * 100),
      completed: completedCount,
      total: totalCount
    };
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Get completion badge color
  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTaskDeliverables();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Task Deliverables</h1>
            <p className="text-sm text-gray-500">
              Automatically synced from Faculty Load and File Upload. Shows document completion status.
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search task deliverables..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </div>

        {/* Filtering Options */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 mb-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status Filter
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
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
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
                  <option value="subject_asc">Subject A-Z</option>
                  <option value="subject_desc">Subject Z-A</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors w-full"
                >
                  Reset All Filters
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              {filteredTasks.length} of {taskDeliverables.length} task deliverables
              {subjectCodeFilter || courseFilter || semesterFilter || schoolYearFilter || statusFilter ? (
                <span className="ml-2 text-blue-600">
                  ({[
                    subjectCodeFilter && `Subject: ${subjectCodeFilter}`,
                    courseFilter && `Course: ${courseFilter}`,
                    semesterFilter && `Semester: ${semesterFilter}`,
                    schoolYearFilter && `Year: ${schoolYearFilter}`,
                    statusFilter && `Status: ${statusFilter}`
                  ].filter(Boolean).join(", ")})
                </span>
              ) : null}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Tasks</div>
            <div className="text-2xl font-bold text-blue-800">{taskDeliverables.length}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Unique Subjects</div>
            <div className="text-2xl font-bold text-purple-800">{getUniqueValues('subject_code').length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Total Courses</div>
            <div className="text-2xl font-bold text-green-800">{getUniqueValues('course').length}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Avg Completion</div>
            <div className="text-2xl font-bold text-yellow-800">
              {taskDeliverables.length > 0 
                ? Math.round(taskDeliverables.reduce((acc, task) => 
                    acc + calculateCompletion(task).percentage, 0) / taskDeliverables.length) 
                : 0}%
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Task ID</th>
                <th className="px-4 py-3 text-left">Subject Code</th>
                <th className="px-4 py-3 text-left">Subject Title</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Semester</th>
                <th className="px-4 py-3 text-left">Academic Year</th>
                <th className="px-4 py-3 text-left">Completion</th>
                <th className="px-4 py-3 text-left">Document Status</th>
                <th className="px-4 py-3 text-left">Last Updated</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                  </td>
                </tr>
              ) : currentTasks.length > 0 ? (
                currentTasks.map((task) => {
                  const completion = calculateCompletion(task);
                  return (
                    <tr key={task._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{task.task_deliverables_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{task.subject_code}</td>
                      <td className="px-4 py-3 text-gray-700 text-sm">{task.subject_title}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseColor(task.course)}`}>
                          {task.course}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(task.semester)}`}>
                          {task.semester}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{task.school_year}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${getCompletionColor(completion.percentage)}`}
                              style={{ width: `${completion.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{completion.percentage}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {completion.completed}/{completion.total} documents
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-1">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.syllabus)}`}>
                            Syllabus
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.tos_midterm)}`}>
                            TOS Midterm
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.tos_final)}`}>
                            TOS Final
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.midterm_exam)}`}>
                            Midterm Exam
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.final_exam)}`}>
                            Final Exam
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.instructional_materials)}`}>
                            Materials
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {new Date(task.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 relative action-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionDropdown(actionDropdown === task.task_deliverables_id ? null : task.task_deliverables_id);
                          }}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {actionDropdown === task.task_deliverables_id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                            <button
                              onClick={() => handlePreview(task)}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-500">
                    No task deliverables found. Task deliverables are automatically created when you add a faculty load.
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
          ) : currentTasks.length > 0 ? (
            currentTasks.map((task) => {
              const completion = calculateCompletion(task);
              return (
                <div key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <h2 className="font-semibold text-gray-800 truncate">{task.subject_code}</h2>
                      <p className="text-sm text-gray-600 truncate">{task.subject_title}</p>
                      <p className="text-xs text-gray-500 font-mono truncate">ID: {task.task_deliverables_id}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompletionColor(completion.percentage)}`}>
                        {completion.percentage}%
                      </span>
                      
                      <div className="relative action-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionDropdown(actionDropdown === task.task_deliverables_id ? null : task.task_deliverables_id);
                          }}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {actionDropdown === task.task_deliverables_id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                            <button
                              onClick={() => handlePreview(task)}
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
                      <span className="text-gray-500">Course:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getCourseColor(task.course)}`}>
                        {task.course}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Semester:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getSemesterColor(task.semester)}`}>
                        {task.semester}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Academic Year:</span>
                      <p className="font-medium">{task.school_year}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Completion:</span>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getCompletionColor(completion.percentage)}`}
                            style={{ width: `${completion.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {completion.completed}/{completion.total} documents
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-gray-500 text-sm">Document Status:</span>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      <span className={`text-xs px-2 py-1 rounded text-center ${getStatusColor(task.syllabus)}`}>
                        Syllabus
                      </span>
                      <span className={`text-xs px-2 py-1 rounded text-center ${getStatusColor(task.tos_midterm)}`}>
                        TOS Midterm
                      </span>
                      <span className={`text-xs px-2 py-1 rounded text-center ${getStatusColor(task.tos_final)}`}>
                        TOS Final
                      </span>
                      <span className={`text-xs px-2 py-1 rounded text-center ${getStatusColor(task.midterm_exam)}`}>
                        Midterm Exam
                      </span>
                      <span className={`text-xs px-2 py-1 rounded text-center ${getStatusColor(task.final_exam)}`}>
                        Final Exam
                      </span>
                      <span className={`text-xs px-2 py-1 rounded text-center ${getStatusColor(task.instructional_materials)}`}>
                        Materials
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(task.updated_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No task deliverables found. Task deliverables are automatically created when you add a faculty load.
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredTasks.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
            <div className="text-sm text-gray-600">
              Showing {currentTasks.length} of {filteredTasks.length} task deliverables
              {subjectCodeFilter || courseFilter || semesterFilter || schoolYearFilter || statusFilter ? (
                <span className="ml-2 text-blue-600">
                  ({[
                    subjectCodeFilter && `Subject: ${subjectCodeFilter}`,
                    courseFilter && `Course: ${courseFilter}`,
                    semesterFilter && `Semester: ${semesterFilter}`,
                    schoolYearFilter && `Year: ${schoolYearFilter}`,
                    statusFilter && `Status: ${statusFilter}`
                  ].filter(Boolean).join(", ")})
                </span>
              ) : null}
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

        {/* Preview Modal */}
        <Modal
          isOpen={previewModalOpen}
          onRequestClose={() => setPreviewModalOpen(false)}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          {selectedTask && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Task Deliverables Details
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
                    <label className="block text-sm font-medium text-gray-700">Task ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedTask.task_deliverables_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Faculty</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTask.faculty_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTask.subject_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject Title</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTask.subject_title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCourseColor(selectedTask.course)}`}>
                      {selectedTask.course}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Semester</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(selectedTask.semester)}`}>
                      {selectedTask.semester}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTask.school_year}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Overall Completion</label>
                  <div className="flex items-center mb-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getCompletionColor(calculateCompletion(selectedTask).percentage)}`}
                        style={{ width: `${calculateCompletion(selectedTask).percentage}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm font-medium">{calculateCompletion(selectedTask).percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {calculateCompletion(selectedTask).completed}/{calculateCompletion(selectedTask).total} documents completed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Document Status Details</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Syllabus</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.syllabus)}`}>
                        {selectedTask.syllabus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">TOS Midterm</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.tos_midterm)}`}>
                        {selectedTask.tos_midterm}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">TOS Final</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.tos_final)}`}>
                        {selectedTask.tos_final}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Midterm Exam</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.midterm_exam)}`}>
                        {selectedTask.midterm_exam}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Final Exam</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.final_exam)}`}>
                        {selectedTask.final_exam}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Instructional Materials</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.instructional_materials)}`}>
                        {selectedTask.instructional_materials}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedTask.created_at || selectedTask.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedTask.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Auto-sync Information:</strong> This task deliverables record was automatically created when you added the faculty load for {selectedTask.subject_code}. Status updates are automatically synced from File Upload.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}