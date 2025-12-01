import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, ClipboardPlus, Download } from "lucide-react";
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

  // History of Records states - NEWLY ADDED
  const [historyView, setHistoryView] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

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

  // Fetch task deliverables from backend - MODIFIED to extract years
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
        
        // Extract available years from task deliverables - NEWLY ADDED
        const years = [...new Set(result.data.map(task => {
          const date = new Date(task.updated_at || task.created_at);
          return date.getFullYear();
        }))].sort((a, b) => b - a);
        
        setAvailableYears(years);
        if (years.length > 0 && !years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }
      } else {
        console.error("Unexpected API response format:", result);
        setTaskDeliverables([]);
        setAvailableYears([]);
      }
    } catch (err) {
      console.error("Error fetching task deliverables:", err);
      if (err.message === 'Token refresh failed') {
        showFeedback("error", "Session expired. Please login again.");
        tokenService.clearFacultyTokens();
        navigate('/auth/login');
      }
      setTaskDeliverables([]);
      setAvailableYears([]);
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

  // Calculate overall status for a task
  const calculateOverallStatus = (task) => {
    const fields = [task.syllabus, task.tos_midterm, task.tos_final, task.midterm_exam, task.final_exam, task.instructional_materials];
    const completedCount = fields.filter(field => field === 'completed').length;
    const rejectedCount = fields.filter(field => field === 'rejected').length;
    
    let overallStatus = 'pending';
    let overallColor = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    
    if (rejectedCount > 0) {
      overallStatus = 'rejected';
      overallColor = 'bg-red-100 text-red-800 border border-red-200';
    } else if (completedCount === 6) {
      overallStatus = 'completed';
      overallColor = 'bg-green-100 text-green-800 border border-green-200';
    } else if (completedCount > 0) {
      overallStatus = 'in-progress';
      overallColor = 'bg-blue-100 text-blue-800 border border-blue-200';
    }

    return { overallStatus, overallColor, completedCount };
  };

  // FIXED: Calculate stats for charts - SIMPLE AND ACCURATE COUNTING
  const calculateStats = (taskList) => {
    if (!Array.isArray(taskList) || taskList.length === 0) {
      return { total: 0, pending: 0, completed: 0, rejected: 0, totalDeliverables: 0 };
    }

    let pendingCount = 0;
    let completedCount = 0;
    let rejectedCount = 0;

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
      });
    });

    const totalDeliverables = pendingCount + completedCount + rejectedCount;

    return {
      total: taskList.length, 
      pending: pendingCount, 
      completed: completedCount, 
      rejected: rejectedCount,
      totalDeliverables: totalDeliverables 
    };
  };

  // Get filtered task deliverables based on search and history view
  const getFilteredTaskDeliverables = () => {
    let filtered = (Array.isArray(taskDeliverables) ? taskDeliverables : [])
      .filter((td) => {
        if (!td) return false;
        
        const searchableFields = [
          td.task_deliverables_id, 
          td.subject_code, 
          td.course_section, 
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

    // Apply filters for history view - NEWLY ADDED
    if (historyView) {
      // Year filter
      filtered = filtered.filter(task => {
        const taskYear = new Date(task.updated_at || task.created_at).getFullYear();
        return taskYear === selectedYear;
      });
    }

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

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border border-yellow-200'; 
    }
  };

  // Refresh data periodically to get latest sync status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTaskDeliverables();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // History of Records export function - MODIFIED for Excel export
  const handleExportReport = async (year) => {
    try {
      const tasksForYear = filteredTaskDeliverables.filter(task => 
        new Date(task.updated_at || task.created_at).getFullYear() === year
      );
      
      // Prepare data for Excel
      const excelData = tasksForYear.map(task => {
        const { overallStatus, completedCount } = calculateOverallStatus(task);
        
        return {
          'Task ID': task.task_deliverables_id,
          'Subject Code': task.subject_code,
          'Course Section': task.course_section,
          'Syllabus': task.syllabus || 'N/A',
          'TOS Midterm': task.tos_midterm || 'N/A',
          'TOS Final': task.tos_final || 'N/A',
          'Midterm Exam': task.midterm_exam || 'N/A',
          'Final Exam': task.final_exam || 'N/A',
          'Instructional Materials': task.instructional_materials || 'N/A',
          'Completed Deliverables': `${completedCount}/6`,
          'Overall Status': overallStatus,
          'Last Updated': new Date(task.updated_at).toLocaleString('en-US', {
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
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 20 }, // Task ID
        { wch: 15 }, // Subject Code
        { wch: 15 }, // Course Section
        { wch: 15 }, // Syllabus
        { wch: 15 }, // TOS Midterm
        { wch: 15 }, // TOS Final
        { wch: 15 }, // Midterm Exam
        { wch: 15 }, // Final Exam
        { wch: 25 }, // Instructional Materials
        { wch: 20 }, // Completed Deliverables
        { wch: 15 }, // Overall Status
        { wch: 25 }  // Last Updated
      ];
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, `Report_${year}`);
      
      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Create and download file
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `task-deliverables-report-${year}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showFeedback("success", `Task Deliverables Report for ${year} exported as Excel file successfully!`);
    } catch (error) {
      console.error("Error exporting report:", error);
      showFeedback("error", "Error exporting report as Excel file");
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header - MODIFIED for history view */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {historyView ? `Task Deliverables Report - ${selectedYear}` : 'Task Deliverables'}
            </h1>
            <p className="text-sm text-gray-500">
              {historyView 
                ? `Viewing historical task deliverables data for ${selectedYear}`
                : 'Auto-synced with your faculty loads. Monitor the status of your submitted deliverables.'
              }
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* History of Records Filters - NEWLY ADDED */}
            {historyView && (
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* View Toggle Buttons - NEWLY ADDED */}
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => {
                  setHistoryView(false);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
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
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  historyView 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ClipboardPlus className="w-4 h-4" />
                  Report
                </div>
              </button>
            </div>

            <input
              type="text"
              placeholder={`Search ${historyView ? 'report' : 'task deliverables'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
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

        {/* Report Management Bar - NEWLY ADDED */}
        {historyView && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <ClipboardPlus className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-800">
                  Viewing {filteredTaskDeliverables.length} task deliverables records from {selectedYear}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportReport(selectedYear)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-yellow-500 hover:text-black transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export {selectedYear} Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards - MODIFIED for history view */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Completion Rate</div>
            <div className="text-2xl font-bold text-purple-800">
              {taskDeliverablesStats.totalDeliverables > 0 ? 
                Math.round((taskDeliverablesStats.completed / taskDeliverablesStats.totalDeliverables) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Desktop Table - UPDATED for history view */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Task ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Code</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Course Section</th>
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
                  const { overallStatus, overallColor, completedCount } = calculateOverallStatus(task);

                  return (
                    <tr key={task._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{task.task_deliverables_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 font-mono">{task.subject_code}</td>
                      <td className="px-4 py-3 text-gray-700">{task.course_section}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.syllabus)}`}>
                          {task.syllabus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos_midterm)}`}>
                          {task.tos_midterm}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos_final)}`}>
                          {task.tos_final}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.midterm_exam)}`}>
                          {task.midterm_exam}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.final_exam)}`}>
                          {task.final_exam}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.instructional_materials)}`}>
                          {task.instructional_materials}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${overallColor}`}>
                          {overallStatus} ({completedCount}/6)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {new Date(task.updated_at).toLocaleDateString()} {new Date(task.updated_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-8 text-gray-500 font-medium">
                    {loading 
                      ? "Loading task deliverables..." 
                      : historyView 
                        ? `No task deliverables found for ${selectedYear}`
                        : "No task deliverables found. Add faculty loads to auto-create task deliverables."
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - UPDATED for history view */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentTaskDeliverables.length > 0 ? (
            currentTaskDeliverables.map((task) => {
              const { overallStatus, overallColor, completedCount } = calculateOverallStatus(task);

              return (
                <div key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-800">{task.subject_code} - {task.course_section}</h2>
                      <p className="text-sm text-gray-600 font-mono">ID: {task.task_deliverables_id}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${overallColor}`}>
                      {overallStatus} ({completedCount}/6)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Syllabus:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.syllabus)}`}>
                        {task.syllabus}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">TOS Midterm:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos_midterm)}`}>
                        {task.tos_midterm}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">TOS Final:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos_final)}`}>
                        {task.tos_final}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Midterm Exam:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.midterm_exam)}`}>
                        {task.midterm_exam}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Final Exam:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.final_exam)}`}>
                        {task.final_exam}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Instructional Materials:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.instructional_materials)}`}>
                        {task.instructional_materials}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    Updated: {new Date(task.updated_at).toLocaleDateString()} {new Date(task.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              {loading 
                ? "Loading task deliverables..." 
                : historyView 
                  ? `No task deliverables found for ${selectedYear}`
                  : "No task deliverables found. Add faculty loads to auto-create task deliverables."
              }
            </div>
          )}
        </div>

        {/* Pagination - MODIFIED for history view */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentTaskDeliverables.length} of {filteredTaskDeliverables.length} tasks
            {historyView && ` for ${selectedYear}`}
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