import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tokenService from "../../services/tokenService";

// Set app element for react-modal
Modal.setAppElement("#root");

export default function TaskDeliverablesManagement() {
  const [taskDeliverables, setTaskDeliverables] = useState([]);
  const [facultyLoadeds, setFacultyLoadeds] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const taskDeliverablesPerPage = 10;

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    subject_code: "",
    course_section: ""
  });

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
    fetchFacultyLoadeds();
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
  
  // Fetch faculty loadeds for dropdown 
  const fetchFacultyLoadeds = async () => {
    try {
      if (!tokenService.isFacultyAuthenticated()) {
        return;
      }
  
      // Use authFetch instead of direct fetch
      const response = await tokenService.authFetch(`${API_BASE_URL}/api/faculty/task-deliverables/faculty-loaded`);
      
      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearFacultyTokens();
          return;
        }
        throw new Error("Server responded with " + response.status);
      }
      
      const result = await response.json();
      console.log("Fetched faculty loadeds for dropdown:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setFacultyLoadeds(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setFacultyLoadeds([]);
      }
    } catch (err) {
      console.error("Error fetching faculty loadeds:", err);
      if (err.message === 'Token refresh failed') {
        tokenService.clearFacultyTokens();
      }
      setFacultyLoadeds([]); 
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle faculty loaded selection
  const handleFacultyLoadedChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const [subjectCode, courseSection] = selectedId.split('|');
      setFormData(prev => ({
        ...prev,
        subject_code: subjectCode,
        course_section: courseSection
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        subject_code: "",
        course_section: ""
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
      subject_code: "",
      course_section: ""
    });
  };

  // Handle form submission (ADD ONLY) 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      if (!tokenService.isFacultyAuthenticated()) {
        showFeedback("error", "Please login again. No authentication token found.");
        setLoading(false);
        return;
      }
  
      const url = `${API_BASE_URL}/api/faculty/task-deliverables`;
      
      const requestData = {
        subject_code: formData.subject_code,
        course_section: formData.course_section
      };
  
      console.log("Sending request to:", url);
      console.log("Request data:", requestData);
  
      // Use authFetch instead of direct fetch
      const response = await tokenService.authFetch(url, { 
        method: "POST",
        body: JSON.stringify(requestData),
      });
  
      const result = await response.json();
      console.log("Server response:", result);
  
      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearFacultyTokens();
          showFeedback("error", "Session expired. Please login again.");
          setTimeout(() => navigate('/auth/login'), 2000);
          return;
        }
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
  
      if (result.success) {
        resetForm();
        setShowModal(false);
        fetchTaskDeliverables();
        showFeedback("success", "Task deliverables added successfully!");
      } else {
        showFeedback("error", result.message || "Error adding task deliverables");
      }
    } catch (error) {
      console.error("Error creating task deliverables:", error);
      if (error.message === 'Token refresh failed') {
        showFeedback("error", "Session expired. Please login again.");
        tokenService.clearFacultyTokens();
        navigate('/auth/login');
      } else {
        showFeedback("error", error.message || "Error creating task deliverables");
      }
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Calculate stats for charts - SIMPLE AND ACCURATE COUNTING
  const calculateStats = () => {
    if (!Array.isArray(taskDeliverables) || taskDeliverables.length === 0) {
      return { total: 0, pending: 0, completed: 0, rejected: 0 };
    }

    let pendingCount = 0;
    let completedCount = 0;
    let rejectedCount = 0;

    taskDeliverables.forEach(task => {
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
      total: taskDeliverables.length, 
      pending: pendingCount, 
      completed: completedCount, 
      rejected: rejectedCount,
      totalDeliverables: totalDeliverables 
    };
  };

  const taskDeliverablesStats = calculateStats();

  // Search filter
  const filteredTaskDeliverables = (Array.isArray(taskDeliverables) ? taskDeliverables : [])
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

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Task Deliverables</h1>
            <p className="text-sm text-gray-500">
              Monitor the status of your submitted deliverables with ease
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search task deliverables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
            {/* Plus Sign Button */}
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-black text-white p-2 rounded-md hover:bg-yellow-400 hover:text-black transition-colors duration-200 flex items-center justify-center w-10 h-10"
              title="Add New Task Deliverables"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
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

        {/* Desktop Table */}
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
                  // Calculate overall status for this task
                  const fields = [task.syllabus, task.tos_midterm, task.tos_final, task.midterm_exam, task.final_exam, task.instructional_materials];
                  const completedCount = fields.filter(field => field === 'completed').length;
                  const rejectedCount = fields.filter(field => field === 'rejected').length;
                  const pendingCount = fields.filter(field => field === 'pending').length;
                  
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
                    {loading ? "Loading task deliverables..." : "No task deliverables found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentTaskDeliverables.length > 0 ? (
            currentTaskDeliverables.map((task) => {
              // Calculate overall status for mobile view
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
              {loading ? "Loading task deliverables..." : "No task deliverables found."}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentTaskDeliverables.length} of {filteredTaskDeliverables.length} tasks
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

        {/* Add Task Deliverables Modal */}
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
                Add New Task Deliverables
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
              {/* Faculty Loaded Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Subject & Section *
                </label>
                <select
                  onChange={handleFacultyLoadedChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  <option value="">Select subject and section</option>
                  {facultyLoadeds.map((facultyLoaded) => (
                    <option 
                      key={`${facultyLoaded.subject_code}|${facultyLoaded.course_section}`}
                      value={`${facultyLoaded.subject_code}|${facultyLoaded.course_section}`}
                    >
                      {facultyLoaded.subject_code} - {facultyLoaded.course_section} 
                      {facultyLoaded.subject_title && ` (${facultyLoaded.subject_title})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Code (auto-filled, readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code (auto-filled)
                </label>
                <input
                  type="text"
                  name="subject_code"
                  value={formData.subject_code}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Course Section (auto-filled, readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Section (auto-filled)
                </label>
                <input
                  type="text"
                  name="course_section"
                  value={formData.course_section}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                />
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
                  disabled={loading}
                  className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add Task Deliverables"}
                </button>
              </div>
            </form>
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