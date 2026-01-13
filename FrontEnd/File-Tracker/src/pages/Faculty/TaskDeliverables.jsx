import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, ClipboardPlus, Download, Filter, ArrowUpDown, History, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tokenService from "../../services/tokenService";
import * as XLSX from 'xlsx';

// Set app element for react-modal
Modal.setAppElement("#root");

export default function TaskDeliverablesManagement() {
  const [taskDeliverables, setTaskDeliverables] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const taskDeliverablesPerPage = 10;

  // History of Records states
  const [historyView, setHistoryView] = useState(false);

  // Filtering and Sorting states
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortOption, setSortOption] = useState("most_recent");
  const [showFilters, setShowFilters] = useState(false);

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
    
    fetchTaskDeliverables();
  }, [navigate]);

  // Fetch task deliverables from backend
  const fetchTaskDeliverables = async () => {
    try {
      setLoading(true);
      
      if (!tokenService.isFacultyAuthenticated()) {
        showFeedback("error", "Please login again");
        navigate('/auth/login');
        return;
      }
  
      // Use authFetch instead of direct fetch
      const response = await tokenService.authFetch(`${API_BASE_URL}/api/faculty/task-deliverables`);
      
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
      console.log("Fetched task deliverables for current user:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setTaskDeliverables(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setTaskDeliverables([]);
      }
    } catch (err) {
      console.error("Error fetching task deliverables:", err);
      if (err.message === 'Token refresh failed') {
        showFeedback("error", "Session expired. Please login again.");
        tokenService.clearFacultyTokens();
        navigate('/auth/login');
      }
      setTaskDeliverables([]);
    } finally {
      setLoading(false);
    }
  };

  // Show feedback modal
  const showFeedback = (type, message) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setFeedbackModalOpen(true);
  };

  // Calculate overall status for a task - UPDATED with "late" status
  const calculateOverallStatus = (task) => {
    const fields = [task.syllabus, task.tos_midterm, task.tos_final, task.midterm_exam, task.final_exam, task.instructional_materials];
    const completedCount = fields.filter(field => field === 'completed').length;
    const rejectedCount = fields.filter(field => field === 'rejected').length;
    const lateCount = fields.filter(field => field === 'late').length;
    const pendingCount = fields.filter(field => field === 'pending').length;
    
    let overallStatus = 'pending';
    let overallColor = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    
    if (rejectedCount > 0) {
      overallStatus = 'rejected';
      overallColor = 'bg-red-100 text-red-800 border border-red-200';
    } else if (lateCount > 0) {
      overallStatus = 'late';
      overallColor = 'bg-orange-100 text-orange-800 border border-orange-200';
    } else if (completedCount === 6) {
      overallStatus = 'completed';
      overallColor = 'bg-green-100 text-green-800 border border-green-200';
    } else if (completedCount > 0) {
      overallStatus = 'in-progress';
      overallColor = 'bg-blue-100 text-blue-800 border border-blue-200';
    }

    return { overallStatus, overallColor, completedCount, lateCount, pendingCount };
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

  // Calculate stats for charts - UPDATED with "late" status
  const calculateStats = (taskList) => {
    if (!Array.isArray(taskList) || taskList.length === 0) {
      return { total: 0, pending: 0, completed: 0, rejected: 0, late: 0, totalDeliverables: 0 };
    }

    let pendingCount = 0;
    let completedCount = 0;
    let rejectedCount = 0;
    let lateCount = 0;

    taskList.forEach(task => {
      // Count individual field statuses including both TOS types
      const fields = [
        task.syllabus, 
        task.tos_midterm, 
        task.tos_final,
        task.midterm_exam, 
        task.final_exam, 
        task.instructional_materials
      ];

      fields.forEach(field => {
        if (field === 'pending') pendingCount++;
        else if (field === 'completed') completedCount++;
        else if (field === 'rejected') rejectedCount++;
        else if (field === 'late') lateCount++;
      });
    });

    const totalDeliverables = pendingCount + completedCount + rejectedCount + lateCount;

    return {
      total: taskList.length, 
      pending: pendingCount, 
      completed: completedCount, 
      rejected: rejectedCount,
      late: lateCount,
      totalDeliverables: totalDeliverables 
    };
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
      } else if (key === 'months') {
        if (task.updated_at || task.created_at) {
          const date = task.updated_at || task.created_at;
          const month = new Date(date).getMonth();
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          values.add(monthNames[month]);
        }
      } else if (key === 'years') {
        if (task.updated_at || task.created_at) {
          const date = task.updated_at || task.created_at;
          const year = new Date(date).getFullYear();
          values.add(year);
        }
      }
    });

    return Array.from(values).sort();
  };

  // Get unique years for filter
  const getUniqueYears = () => {
    const years = new Set();
    taskDeliverables.forEach(task => {
      if (task.updated_at || task.created_at) {
        const date = task.updated_at || task.created_at;
        const year = new Date(date).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Reset all filters
  const resetFilters = () => {
    setSubjectCodeFilter("");
    setCourseFilter("");
    setMonthFilter("");
    setYearFilter("");
    setSortOption("most_recent");
    setCurrentPage(1);
  };

  // Get filtered task deliverables based on search and filters
  const getFilteredTaskDeliverables = () => {
    let filtered = (Array.isArray(taskDeliverables) ? taskDeliverables : [])
      .filter((td) => {
        if (!td) return false;
        
        const searchableFields = [
          td.task_deliverables_id, 
          td.subject_code, 
          td.course,
          td.syllabus, 
          td.tos_midterm, 
          td.tos_final,
          td.midterm_exam, 
          td.final_exam, 
          td.instructional_materials
        ].filter(field => field !== undefined && field !== null);
        
        return searchableFields.some((field) => 
          field.toString().toLowerCase().includes(search.toLowerCase())
        );
      });

    // Apply advanced filters
    if (subjectCodeFilter) {
      filtered = filtered.filter(task => task.subject_code === subjectCodeFilter);
    }

    if (courseFilter) {
      filtered = filtered.filter(task => task.course === courseFilter);
    }

    // Apply month filter
    if (monthFilter) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = monthNames.indexOf(monthFilter);
      
      filtered = filtered.filter(task => {
        if (!task.updated_at && !task.created_at) return false;
        const date = task.updated_at || task.created_at;
        const taskMonth = new Date(date).getMonth();
        return taskMonth === monthIndex;
      });
    }

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter(task => {
        if (!task.updated_at && !task.created_at) return false;
        const date = task.updated_at || task.created_at;
        const taskYear = new Date(date).getFullYear();
        return taskYear === parseInt(yearFilter);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      
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

  const filteredTaskDeliverables = getFilteredTaskDeliverables();
  const taskDeliverablesStats = calculateStats(filteredTaskDeliverables);

  // Pagination
  const totalPages = Math.ceil(filteredTaskDeliverables.length / taskDeliverablesPerPage);
  const startIndex = (currentPage - 1) * taskDeliverablesPerPage;
  const currentTaskDeliverables = filteredTaskDeliverables.slice(startIndex, startIndex + taskDeliverablesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Refresh data periodically to get latest sync status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTaskDeliverables();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // History of Records export function
  const handleExportReport = async () => {
    try {
      if (filteredTaskDeliverables.length === 0) {
        showFeedback("info", "No records to export with the current filters.");
        return;
      }
      
      // Prepare data for Excel - REMOVED Task ID from export
      const excelData = filteredTaskDeliverables.map(task => {
        const { overallStatus, completedCount, lateCount } = calculateOverallStatus(task);
        
        return {
          'Subject Code': task.subject_code,
          'Course': task.course || 'N/A',
          'Syllabus': task.syllabus || 'N/A',
          'TOS Midterm': task.tos_midterm || 'N/A',
          'TOS Final': task.tos_final || 'N/A',
          'Midterm Exam': task.midterm_exam || 'N/A',
          'Final Exam': task.final_exam || 'N/A',
          'Instructional Materials': task.instructional_materials || 'N/A',
          'Completed Deliverables': `${completedCount}/6`,
          'Late Deliverables': `${lateCount}/6`,
          'Overall Status': overallStatus,
          'Last Updated': new Date(task.updated_at || task.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      });
      
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Create a worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability - REMOVED Task ID column width
      const colWidths = [
        { wch: 15 }, // Subject Code
        { wch: 15 }, // Course
        { wch: 15 }, // Syllabus
        { wch: 15 }, // TOS Midterm
        { wch: 15 }, // TOS Final
        { wch: 15 }, // Midterm Exam
        { wch: 15 }, // Final Exam
        { wch: 25 }, // Instructional Materials
        { wch: 20 }, // Completed Deliverables
        { wch: 20 }, // Late Deliverables
        { wch: 15 }, // Overall Status
        { wch: 25 }  // Last Updated
      ];
      ws['!cols'] = colWidths;
      
      // Add header styling
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
      
      // Create sheet name with filters
      let sheetName = "Task_Deliverables";
      if (yearFilter) sheetName += `_${yearFilter}`;
      if (monthFilter) sheetName += `_${monthFilter.substring(0, 3)}`;
      sheetName = sheetName.substring(0, 31); // Excel sheet name limit
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Create and download file
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Create filename with filters
      let filename = 'task-deliverables-report';
      if (yearFilter) filename += `-${yearFilter}`;
      if (monthFilter) filename += `-${monthFilter.replace(/\s+/g, '-')}`;
      if (subjectCodeFilter) filename += `-${subjectCodeFilter}`;
      if (courseFilter) filename += `-${courseFilter}`;
      filename += '.xlsx';
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showFeedback("success", `Exported ${filteredTaskDeliverables.length} task deliverables with current filters as Excel file successfully!`);
    } catch (error) {
      console.error("Error exporting report:", error);
      showFeedback("error", "Error exporting report as Excel file");
    }
  };

  // Reset filters when switching views
  useEffect(() => {
    resetFilters();
  }, [historyView]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header - EXACT SAME LAYOUT AS FILE MANAGEMENT */}
        <div className="flex flex-col justify-between items-start mb-6 gap-3">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800">
              {historyView ? 'Reports' : 'Task Deliverables'}
            </h1>
            <p className="text-sm text-gray-500">
              {historyView 
                ? 'Generate reports for task deliverables data'
                : 'Monitor the status of your submitted deliverables.'
              }
            </p>
          </div>
          
          {/* Top Row: Show Filters button (only button in this row) */}
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-3 mb-4">
            {/* Show Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full md:w-auto"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              
            </button>
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
                  Report
                </div>
              </button>
            </div>

            <input
              type="text"
              placeholder={`Search ${historyView ? 'historical records' : 'task deliverables'}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Filtering and Sorting Options - 4x3 Grid */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 w-full mb-4">
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
                    Month
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
                    Year
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
                  {(subjectCodeFilter || courseFilter || monthFilter || yearFilter || sortOption !== "most_recent") && (
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
                {filteredTaskDeliverables.length} of {taskDeliverables.length} records
                {subjectCodeFilter || courseFilter || monthFilter || yearFilter ? (
                  <span className="ml-2 text-blue-600">
                    ({[
                      subjectCodeFilter && `Subject: ${subjectCodeFilter}`,
                      courseFilter && `Course: ${courseFilter}`,
                      monthFilter && monthFilter,
                      yearFilter && yearFilter
                    ].filter(Boolean).join(", ")})
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* History of Records Management Bar */}
          {historyView && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 w-full">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <ClipboardPlus className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-800">
                    Viewing {filteredTaskDeliverables.length} task deliverables records
                    {yearFilter && ` from ${yearFilter}`}
                    {monthFilter && `, ${monthFilter}`}
                    {subjectCodeFilter && ` • Subject: ${subjectCodeFilter}`}
                    {courseFilter && ` • Course: ${courseFilter}`}
                  </span>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    onClick={handleExportReport}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-yellow-500 hover:text-black transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export Filtered Report
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Export will include only the records matching current filters: {filteredTaskDeliverables.length} record(s)
              </p>
            </div>
          )}
        </div>

        {/* Auto-sync Notice - HIDDEN in history view */}
        {!historyView && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="text-blue-500 w-5 h-5 mr-2" />
              <p className="text-blue-700 text-sm">
                <strong>Auto-sync Enabled:</strong> Task deliverables are automatically created when you add faculty loads. 
                Each course section from your faculty loads gets its own task deliverables entry.
              </p>
            </div>
          </div>
        )}

        {/* Statistics Cards - UPDATED to 3x3 grid with "late" status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Tasks</div>
            <div className="text-2xl font-bold text-blue-800">{taskDeliverablesStats.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Pending Deliverables</div>
            <div className="text-2xl font-bold text-yellow-800">{taskDeliverablesStats.pending}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Completed Deliverables</div>
            <div className="text-2xl font-bold text-green-800">{taskDeliverablesStats.completed}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-600 text-sm font-medium">Rejected Deliverables</div>
            <div className="text-2xl font-bold text-red-800">{taskDeliverablesStats.rejected}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-orange-600 text-sm font-medium">Late Deliverables</div>
            <div className="text-2xl font-bold text-orange-800">{taskDeliverablesStats.late}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Overall Completion Rate</div>
            <div className="text-2xl font-bold text-purple-800">
              {taskDeliverablesStats.totalDeliverables > 0 ? 
                Math.round((taskDeliverablesStats.completed / taskDeliverablesStats.totalDeliverables) * 100) : 0}%
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {taskDeliverablesStats.completed} of {taskDeliverablesStats.totalDeliverables} deliverables completed
              {taskDeliverablesStats.late > 0 && ` • ${taskDeliverablesStats.late} deliverables are late`}
            </div>
          </div>
        </div>

        {/* Desktop Table - UPDATED with "late" status badges - REMOVED Task ID column */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Code</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Course</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Syllabus</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Midterm</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Final</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Midterm Exam</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Final Exam</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Instructional Materials</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Overall Status</th>
                <th className="px-4 py-3 text-left border-gray-600">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {currentTaskDeliverables.length > 0 ? (
                currentTaskDeliverables.map((task) => {
                  const { overallStatus, overallColor, completedCount, lateCount } = calculateOverallStatus(task);

                  return (
                    <tr key={task._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900 font-mono">{task.subject_code}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.course === 'BSCS' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          task.course === 'BSIT' ? 'bg-green-100 text-green-800 border border-green-200' :
                          'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {task.course}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.syllabus)}`}>
                          {getStatusIcon(task.syllabus)}
                          {task.syllabus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos_midterm)}`}>
                          {getStatusIcon(task.tos_midterm)}
                          {task.tos_midterm}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos_final)}`}>
                          {getStatusIcon(task.tos_final)}
                          {task.tos_final}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.midterm_exam)}`}>
                          {getStatusIcon(task.midterm_exam)}
                          {task.midterm_exam}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.final_exam)}`}>
                          {getStatusIcon(task.final_exam)}
                          {task.final_exam}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.instructional_materials)}`}>
                          {getStatusIcon(task.instructional_materials)}
                          {task.instructional_materials}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${overallColor}`}>
                          {overallStatus} ({completedCount}/6{lateCount > 0 ? `, ${lateCount} late` : ''})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {new Date(task.updated_at || task.created_at).toLocaleDateString()} {new Date(task.updated_at || task.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-500 font-medium">
                    {loading 
                      ? "Loading task deliverables..." 
                      : historyView 
                        ? `No task deliverables found with the current filters`
                        : "No task deliverables found. Add faculty loads to auto-create task deliverables."
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - UPDATED with "late" status - REMOVED Task ID */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentTaskDeliverables.length > 0 ? (
            currentTaskDeliverables.map((task) => {
              const { overallStatus, overallColor, completedCount, lateCount } = calculateOverallStatus(task);

              return (
                <div key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-800">{task.subject_code}</h2>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${overallColor}`}>
                      {overallStatus} ({completedCount}/6{lateCount > 0 ? `, ${lateCount} late` : ''})
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Course:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.course === 'BSCS' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        task.course === 'BSIT' ? 'bg-green-100 text-green-800 border border-green-200' :
                        'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {task.course}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Syllabus:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.syllabus)}`}>
                        {getStatusIcon(task.syllabus)}
                        {task.syllabus}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">TOS Midterm:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos_midterm)}`}>
                        {getStatusIcon(task.tos_midterm)}
                        {task.tos_midterm}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">TOS Final:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos_final)}`}>
                        {getStatusIcon(task.tos_final)}
                        {task.tos_final}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Midterm Exam:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.midterm_exam)}`}>
                        {getStatusIcon(task.midterm_exam)}
                        {task.midterm_exam}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Final Exam:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.final_exam)}`}>
                        {getStatusIcon(task.final_exam)}
                        {task.final_exam}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Instructional Materials:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.instructional_materials)}`}>
                        {getStatusIcon(task.instructional_materials)}
                        {task.instructional_materials}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    Updated: {new Date(task.updated_at || task.created_at).toLocaleDateString()} {new Date(task.updated_at || task.created_at).toLocaleTimeString()}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              {loading 
                ? "Loading task deliverables..." 
                : historyView 
                  ? `No task deliverables found with the current filters`
                  : "No task deliverables found. Add faculty loads to auto-create task deliverables."
              }
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentTaskDeliverables.length} of {filteredTaskDeliverables.length} tasks
            {yearFilter && ` from ${yearFilter}`}
            {monthFilter && `, ${monthFilter}`}
            {subjectCodeFilter && ` • Subject: ${subjectCodeFilter}`}
            {courseFilter && ` • Course: ${courseFilter}`}
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