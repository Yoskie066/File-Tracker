import { useState, useEffect } from "react";
import { Doughnut } from 'react-chartjs-2';
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Edit, Trash2 } from "lucide-react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Set app element for react-modal
Modal.setAppElement("#root");

export default function TaskDeliverablesManagement() {
  const [taskDeliverables, setTaskDeliverables] = useState([]);
  const [facultyLoadeds, setFacultyLoadeds] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const taskDeliverablesPerPage = 10;

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskDeliverablesToDelete, setTaskDeliverablesToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    task_deliverables_id: "",
    subject_code: "",
    course_section: "",
    syllabus: "pending",
    tos: "pending",
    midterm_exam: "pending",
    final_exam: "pending",
    instructional_materials: "pending"
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // Status options for combo box
  const statusOptions = [
    "pending",
    "submitted",
    "approved",
    "rejected"
  ];

  // Fetch task deliverables from backend 
  const fetchTaskDeliverables = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/faculty/task-deliverables"); 
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched task deliverables:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setTaskDeliverables(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setTaskDeliverables([]);
      }
    } catch (err) {
      console.error("Error fetching task deliverables:", err);
      setTaskDeliverables([]); 
    }
  };

  // Fetch faculty loadeds for dropdown
  const fetchFacultyLoadeds = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/faculty/task-deliverables/faculty-loaded"); 
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched faculty loadeds:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setFacultyLoadeds(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setFacultyLoadeds([]);
      }
    } catch (err) {
      console.error("Error fetching faculty loadeds:", err);
      setFacultyLoadeds([]); 
    }
  };
  
  useEffect(() => {
    fetchTaskDeliverables();
    fetchFacultyLoadeds();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
    const selectedFacultyLoaded = facultyLoadeds.find(fl => 
      `${fl.subject_code}-${fl.course_section}` === selectedId
    );
    
    if (selectedFacultyLoaded) {
      setFormData(prev => ({
        ...prev,
        subject_code: selectedFacultyLoaded.subject_code,
        course_section: selectedFacultyLoaded.course_section
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
      task_deliverables_id: "",
      subject_code: "",
      course_section: "",
      syllabus: "pending",
      tos: "pending",
      midterm_exam: "pending",
      final_exam: "pending",
      instructional_materials: "pending"
    });
    setIsEditMode(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const url = isEditMode 
        ? `http://localhost:3000/api/faculty/task-deliverables/${formData.task_deliverables_id}`
        : "http://localhost:3000/api/faculty/task-deliverables";
      
      const method = isEditMode ? "PUT" : "POST";
  
      const requestData = isEditMode ? {
        syllabus: formData.syllabus,
        tos: formData.tos,
        midterm_exam: formData.midterm_exam,
        final_exam: formData.final_exam,
        instructional_materials: formData.instructional_materials
      } : {
        subject_code: formData.subject_code,
        course_section: formData.course_section
        // Other fields will use default "pending" values
      };
  
      console.log("Sending request to:", url);
      console.log("Request method:", method);
      console.log("Request data:", requestData);
  
      const response = await fetch(url, { 
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
  
      const result = await response.json();
      console.log("Server response:", result);
  
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
  
      if (result.success) {
        resetForm();
        setShowModal(false);
        fetchTaskDeliverables();
        showFeedback("success", 
          isEditMode ? "Task deliverables updated successfully!" : "Task deliverables added successfully!"
        );
      } else {
        showFeedback("error", result.message || `Error ${isEditMode ? 'updating' : 'adding'} task deliverables`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} task deliverables:`, error);
      showFeedback("error", error.message || `Error ${isEditMode ? 'updating' : 'creating'} task deliverables`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit task deliverables
  const handleEdit = async (taskDeliverablesId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/faculty/task-deliverables/${taskDeliverablesId}`);
      const result = await response.json();
  
      if (result.success && result.data) {
        const taskDeliverable = result.data;
        setFormData({
          task_deliverables_id: taskDeliverable.task_deliverables_id,
          subject_code: taskDeliverable.subject_code,
          course_section: taskDeliverable.course_section,
          syllabus: taskDeliverable.syllabus,
          tos: taskDeliverable.tos,
          midterm_exam: taskDeliverable.midterm_exam,
          final_exam: taskDeliverable.final_exam,
          instructional_materials: taskDeliverable.instructional_materials
        });
        setIsEditMode(true);
        setShowModal(true);
      } else {
        showFeedback("error", "Error loading task deliverables data");
      }
    } catch (error) {
      console.error("Error fetching task deliverables:", error);
      showFeedback("error", "Error loading task deliverables data");
    }
    setActionDropdown(null);
  }

  // Handle delete task deliverables
  const handleDelete = async (taskDeliverablesId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/faculty/task-deliverables/${taskDeliverablesId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchTaskDeliverables();
        showFeedback("success", "Task deliverables deleted successfully!");
      } else {
        showFeedback("error", result.message || "Error deleting task deliverables");
      }
    } catch (error) {
      console.error("Error deleting task deliverables:", error);
      showFeedback("error", "Error deleting task deliverables");
    }
    setDeleteModalOpen(false);
    setTaskDeliverablesToDelete(null);
    setActionDropdown(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (taskDeliverablesId) => {
    setTaskDeliverablesToDelete(taskDeliverablesId);
    setDeleteModalOpen(true);
  };

  // Calculate stats for charts
  const taskDeliverablesStats = {
    total: Array.isArray(taskDeliverables) ? taskDeliverables.length : 0,
    pending: Array.isArray(taskDeliverables) ? taskDeliverables.filter(td => 
      td.syllabus === 'pending' || 
      td.tos === 'pending' || 
      td.midterm_exam === 'pending' || 
      td.final_exam === 'pending' || 
      td.instructional_materials === 'pending'
    ).length : 0,
    submitted: Array.isArray(taskDeliverables) ? taskDeliverables.filter(td => 
      td.syllabus === 'submitted' || 
      td.tos === 'submitted' || 
      td.midterm_exam === 'submitted' || 
      td.final_exam === 'submitted' || 
      td.instructional_materials === 'submitted'
    ).length : 0,
    completed: Array.isArray(taskDeliverables) ? taskDeliverables.filter(td => 
      td.syllabus !== 'pending' && 
      td.tos !== 'pending' && 
      td.midterm_exam !== 'pending' && 
      td.final_exam !== 'pending' && 
      td.instructional_materials !== 'pending'
    ).length : 0
  };

  // Search filter
  const filteredTaskDeliverables = (Array.isArray(taskDeliverables) ? taskDeliverables : [])
    .filter((td) =>
      [td.task_deliverables_id, td.subject_code, td.course_section, td.syllabus, td.tos, td.midterm_exam, td.final_exam, td.instructional_materials]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

  // Chart data for status distribution
  const statusChartData = {
    labels: ['Pending', 'Submitted', 'Completed'],
    datasets: [
      {
        data: [
          taskDeliverablesStats.pending,
          taskDeliverablesStats.submitted,
          taskDeliverablesStats.completed
        ],
        backgroundColor: [
          '#F59E0B',
          '#3B82F6',
          '#10B981'
        ],
        borderColor: [
          '#F59E0B',
          '#3B82F6',
          '#10B981'
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Pagination
  const totalPages = Math.ceil(filteredTaskDeliverables.length / taskDeliverablesPerPage);
  const startIndex = (currentPage - 1) * taskDeliverablesPerPage;
  const currentTaskDeliverables = filteredTaskDeliverables.slice(startIndex, startIndex + taskDeliverablesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Task Deliverables Management</h1>
            <p className="text-sm text-gray-500">
              Manage and track faculty task deliverables and submissions
            </p>
          </div>
          <div className="flex gap-3">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Tasks</div>
            <div className="text-2xl font-bold text-blue-800">{taskDeliverablesStats.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">{taskDeliverablesStats.pending}</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="text-indigo-600 text-sm font-medium">Submitted</div>
            <div className="text-2xl font-bold text-indigo-800">{taskDeliverablesStats.submitted}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Completed</div>
            <div className="text-2xl font-bold text-green-800">{taskDeliverablesStats.completed}</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h3>
            <div className="h-64">
              <Doughnut data={statusChartData} options={chartOptions} />
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
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Midterm Exam</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Final Exam</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Instructional Materials</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTaskDeliverables.length > 0 ? (
                currentTaskDeliverables.map((task) => (
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos)}`}>
                        {task.tos}
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
                    <td className="px-4 py-3 relative">
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
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(task.task_deliverables_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(task.task_deliverables_id)}
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
                  <td colSpan="9" className="text-center py-8 text-gray-500 font-medium">
                    No task deliverables found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentTaskDeliverables.length > 0 ? (
            currentTaskDeliverables.map((task) => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">{task.subject_code} - {task.course_section}</h2>
                    <p className="text-sm text-gray-600 font-mono">ID: {task.task_deliverables_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Mobile Actions Dropdown */}
                    <div className="relative">
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
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(task.task_deliverables_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(task.task_deliverables_id)}
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
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Syllabus:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.syllabus)}`}>
                      {task.syllabus}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">TOS:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.tos)}`}>
                      {task.tos}
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
                  <div className="col-span-2">
                    <span className="text-gray-500">Instructional Materials:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.instructional_materials)}`}>
                      {task.instructional_materials}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Created: {new Date(task.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              No task deliverables found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentTaskDeliverables.length} of {filteredTaskDeliverables.length} task deliverables
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

        {/* Add/Edit Task Deliverables Modal */}
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
                {isEditMode ? "Update Task Deliverables" : "Add New Task Deliverables"}
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
              {/* Task Deliverables ID (readonly in edit mode) */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Deliverables ID
                  </label>
                  <input
                    type="text"
                    name="task_deliverables_id"
                    value={formData.task_deliverables_id}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Faculty Loaded Selection (only for add mode) */}
              {!isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Faculty Loaded *
                  </label>
                  <select
                    onChange={handleFacultyLoadedChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                  >
                    <option value="">Select faculty loaded</option>
                    {facultyLoadeds.map((facultyLoaded) => (
                      <option 
                        key={`${facultyLoaded.subject_code}-${facultyLoaded.course_section}`}
                        value={`${facultyLoaded.subject_code}-${facultyLoaded.course_section}`}
                      >
                        {facultyLoaded.subject_code} - {facultyLoaded.course_section} {facultyLoaded.subject_title ? `(${facultyLoaded.subject_title})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject Code (readonly in edit mode, auto-filled in add mode) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code {isEditMode ? '' : '(auto-filled)'}
                </label>
                <input
                  type="text"
                  name="subject_code"
                  value={formData.subject_code}
                  readOnly={!isEditMode}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Course Section (readonly in edit mode, auto-filled in add mode) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Section {isEditMode ? '' : '(auto-filled)'}
                </label>
                <input
                  type="text"
                  name="course_section"
                  value={formData.course_section}
                  readOnly={!isEditMode}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Status Fields (only in edit mode) */}
              {isEditMode && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Syllabus Status
                    </label>
                    <select
                      name="syllabus"
                      value={formData.syllabus}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TOS Status
                    </label>
                    <select
                      name="tos"
                      value={formData.tos}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Midterm Exam Status
                    </label>
                    <select
                      name="midterm_exam"
                      value={formData.midterm_exam}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Final Exam Status
                    </label>
                    <select
                      name="final_exam"
                      value={formData.final_exam}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructional Materials Status
                    </label>
                    <select
                      name="instructional_materials"
                      value={formData.instructional_materials}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
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
                  disabled={loading}
                  className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Task Deliverables" : "Add Task Deliverables")}
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
              Are you sure you want to delete this task deliverables? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(taskDeliverablesToDelete)}
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