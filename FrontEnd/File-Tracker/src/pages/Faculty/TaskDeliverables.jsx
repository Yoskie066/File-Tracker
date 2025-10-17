import { useState, useEffect } from "react";
import { Doughnut } from 'react-chartjs-2';
import Modal from "react-modal";
import { CheckCircle, XCircle } from "lucide-react";
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

  // Status options for combo box - CHANGED TO: pending, completed, rejected
  const statusOptions = [
    "pending",
    "completed",
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
      subject_code: "",
      course_section: ""
    });
  };

  // Handle form submission (ADD ONLY)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = "http://localhost:3000/api/faculty/task-deliverables";
      
      const requestData = {
        subject_code: formData.subject_code,
        course_section: formData.course_section
      };

      console.log("Sending request to:", url);
      console.log("Request data:", requestData);

      const response = await fetch(url, { 
        method: "POST",
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
        showFeedback("success", "Task deliverables added successfully!");
      } else {
        showFeedback("error", result.message || "Error adding task deliverables");
      }
    } catch (error) {
      console.error("Error creating task deliverables:", error);
      showFeedback("error", error.message || "Error creating task deliverables");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for charts - UPDATED FOR NEW STATUS OPTIONS
  const taskDeliverablesStats = {
    total: Array.isArray(taskDeliverables) ? taskDeliverables.length : 0,
    pending: Array.isArray(taskDeliverables) ? taskDeliverables.filter(td => 
      td.syllabus === 'pending' || 
      td.tos === 'pending' || 
      td.midterm_exam === 'pending' || 
      td.final_exam === 'pending' || 
      td.instructional_materials === 'pending'
    ).length : 0,
    completed: Array.isArray(taskDeliverables) ? taskDeliverables.filter(td => 
      td.syllabus === 'completed' && 
      td.tos === 'completed' && 
      td.midterm_exam === 'completed' && 
      td.final_exam === 'completed' && 
      td.instructional_materials === 'completed'
    ).length : 0,
    rejected: Array.isArray(taskDeliverables) ? taskDeliverables.filter(td => 
      td.syllabus === 'rejected' || 
      td.tos === 'rejected' || 
      td.midterm_exam === 'rejected' || 
      td.final_exam === 'rejected' || 
      td.instructional_materials === 'rejected'
    ).length : 0
  };

  // Search filter
  const filteredTaskDeliverables = (Array.isArray(taskDeliverables) ? taskDeliverables : [])
    .filter((td) =>
      [td.task_deliverables_id, td.subject_code, td.course_section, td.syllabus, td.tos, td.midterm_exam, td.final_exam, td.instructional_materials]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

  // Chart data for status distribution - UPDATED FOR NEW STATUS OPTIONS
  const statusChartData = {
    labels: ['Pending', 'Completed', 'Rejected'],
    datasets: [
      {
        data: [
          taskDeliverablesStats.pending,
          taskDeliverablesStats.completed,
          taskDeliverablesStats.rejected
        ],
        backgroundColor: [
          '#F59E0B', // Yellow for pending
          '#10B981', // Green for completed
          '#EF4444'  // Red for rejected
        ],
        borderColor: [
          '#F59E0B',
          '#10B981',
          '#EF4444'
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

  // Get status badge color - UPDATED FOR NEW STATUS OPTIONS
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800'; // pending
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

        {/* Statistics Cards - UPDATED FOR NEW STATUS OPTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Tasks</div>
            <div className="text-2xl font-bold text-blue-800">{taskDeliverablesStats.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">{taskDeliverablesStats.pending}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Completed</div>
            <div className="text-2xl font-bold text-green-800">{taskDeliverablesStats.completed}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-600 text-sm font-medium">Rejected</div>
            <div className="text-2xl font-bold text-red-800">{taskDeliverablesStats.rejected}</div>
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

        {/* Desktop Table - NO ACTIONS COLUMN */}
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 font-medium">
                    No task deliverables found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - NO ACTIONS */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentTaskDeliverables.length > 0 ? (
            currentTaskDeliverables.map((task) => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">{task.subject_code} - {task.course_section}</h2>
                    <p className="text-sm text-gray-600 font-mono">ID: {task.task_deliverables_id}</p>
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

        {/* Add Task Deliverables Modal - NO EDIT MODE */}
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