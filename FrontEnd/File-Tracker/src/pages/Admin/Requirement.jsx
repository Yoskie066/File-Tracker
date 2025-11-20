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

export default function RequirementManagement() {
  const [requirements, setRequirements] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const requirementsPerPage = 10;

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    requirement_id: "",
    task_name: "",
    prof_name: "",
    file_type: "",
    tos_type: "",
    due_date: "",
    notes: ""
  });

  const [isEditMode, setIsEditMode] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // File type options for combo box
  const fileTypeOptions = [
    "syllabus",
    "tos",
    "midterm-exam",
    "final-exam",
    "instrumental materials",
    "all-files"
  ];

  // TOS type options (only shown when file_type is "tos")
  const tosTypeOptions = [
    "TOS-Midterm",
    "TOS-Finals"
  ];

  // Fetch requirements from backend 
  const fetchRequirements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/requirement`); 
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched requirements:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setRequirements(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setRequirements([]);
      }
    } catch (err) {
      console.error("Error fetching requirements:", err);
      setRequirements([]); 
    }
  };

  // Fetch faculty list from backend
  const fetchFacultyList = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/user-management`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const data = await res.json();
      console.log("Fetched users for faculty list:", data);
      
      // Filter only faculty users and extract their names
      const facultyUsers = data.filter(user => 
        user.role === 'faculty' && user.name
      );
      
      console.log("Filtered faculty users:", facultyUsers);
      setFacultyList(facultyUsers);
      
    } catch (err) {
      console.error("Error fetching faculty list:", err);
      setFacultyList([]);
    }
  };
  
  useEffect(() => {
    fetchRequirements();
    fetchFacultyList();
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
    
    // If file type is changed and it's not "tos", clear the tos_type
    if (name === "file_type" && value !== "tos") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        tos_type: ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
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
      requirement_id: "",
      task_name: "",
      prof_name: "",
      file_type: "",
      tos_type: "",
      due_date: "",
      notes: ""
    });
    setIsEditMode(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const url = isEditMode 
        ? `${API_BASE_URL}/api/admin/requirement/${formData.requirement_id}`
        : `${API_BASE_URL}/api/admin/requirement`;
      
      const method = isEditMode ? "PUT" : "POST";
  
      const requestData = {
        task_name: formData.task_name,
        prof_name: formData.prof_name,
        file_type: formData.file_type,
        tos_type: formData.tos_type,
        due_date: formData.due_date,
        notes: formData.notes
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
        fetchRequirements();
        showFeedback("success", 
          isEditMode ? "Requirement updated successfully!" : "Requirement added successfully!"
        );
      } else {
        showFeedback("error", result.message || `Error ${isEditMode ? 'updating' : 'adding'} requirement`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} requirement:`, error);
      showFeedback("error", error.message || `Error ${isEditMode ? 'updating' : 'creating'} requirement`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit requirement
  const handleEdit = async (requirementId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/requirement/${requirementId}`);
      const result = await response.json();
  
      if (result.success && result.data) {
        const requirement = result.data;
        setFormData({
          requirement_id: requirement.requirement_id,
          task_name: requirement.task_name,
          prof_name: requirement.prof_name,
          file_type: requirement.file_type,
          tos_type: requirement.tos_type || "",
          due_date: requirement.due_date ? requirement.due_date.split('T')[0] : "",
          notes: requirement.notes || ""
        });
        setIsEditMode(true);
        setShowModal(true);
      } else {
        showFeedback("error", "Error loading requirement data");
      }
    } catch (error) {
      console.error("Error fetching requirement:", error);
      showFeedback("error", "Error loading requirement data");
    }
    setActionDropdown(null);
  }

  // Handle delete requirement
  const handleDelete = async (requirementId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/requirement/${requirementId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchRequirements();
        showFeedback("success", "Requirement deleted successfully!");
      } else {
        showFeedback("error", result.message || "Error deleting requirement");
      }
    } catch (error) {
      console.error("Error deleting requirement:", error);
      showFeedback("error", "Error deleting requirement");
    }
    setDeleteModalOpen(false);
    setRequirementToDelete(null);
    setActionDropdown(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (requirementId) => {
    setRequirementToDelete(requirementId);
    setDeleteModalOpen(true);
  };

  // Calculate stats for charts
  const requirementStats = {
    total: Array.isArray(requirements) ? requirements.length : 0,
    syllabus: Array.isArray(requirements) ? requirements.filter(req => req.file_type === 'syllabus').length : 0,
    tos: Array.isArray(requirements) ? requirements.filter(req => req.file_type === 'tos').length : 0,
    midterm: Array.isArray(requirements) ? requirements.filter(req => req.file_type === 'midterm-exam').length : 0,
    final: Array.isArray(requirements) ? requirements.filter(req => req.file_type === 'final-exam').length : 0,
    instrumental: Array.isArray(requirements) ? requirements.filter(req => req.file_type === 'instrumental materials').length : 0,
    allFiles: Array.isArray(requirements) ? requirements.filter(req => req.file_type === 'all-files').length : 0
  };

  // Search filter
  const filteredRequirements = (Array.isArray(requirements) ? requirements : [])
    .filter((req) =>
      [req.requirement_id, req.task_name, req.prof_name, req.file_type, req.tos_type]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

  // Chart data for file type distribution
  const fileTypeChartData = {
    labels: ['Syllabus', 'TOS', 'Midterm', 'Final Exam', 'Instrumental', 'All Files'],
    datasets: [
      {
        data: [
          requirementStats.syllabus,
          requirementStats.tos,
          requirementStats.midterm,
          requirementStats.final,
          requirementStats.instrumental,
          requirementStats.allFiles
        ],
        backgroundColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4'
        ],
        borderColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4'
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

  // Get display text for file type with TOS type
  const getFileTypeDisplay = (requirement) => {
    if (requirement.file_type === 'tos' && requirement.tos_type) {
      return `${requirement.file_type} (${requirement.tos_type})`;
    }
    return requirement.file_type;
  };

  // Get badge color for file type
  const getFileTypeBadgeColor = (fileType) => {
    switch (fileType) {
      case 'syllabus': return 'bg-purple-100 text-purple-800';
      case 'tos': return 'bg-green-100 text-green-800';
      case 'midterm-exam': return 'bg-yellow-100 text-yellow-800';
      case 'final-exam': return 'bg-red-100 text-red-800';
      case 'instrumental materials': return 'bg-indigo-100 text-indigo-800';
      case 'all-files': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredRequirements.length / requirementsPerPage);
  const startIndex = (currentPage - 1) * requirementsPerPage;
  const currentRequirements = filteredRequirements.slice(startIndex, startIndex + requirementsPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Requirement</h1>
            <p className="text-sm text-gray-500">
              Manage and track academic requirements, deadlines, and submissions
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-black text-white p-2 rounded-md hover:bg-yellow-400 hover:text-black transition-colors duration-200 flex items-center justify-center w-10 h-10"
              title="Add New Requirement"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Requirements</div>
            <div className="text-2xl font-bold text-blue-800">{requirementStats.total}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Syllabus</div>
            <div className="text-2xl font-bold text-purple-800">{requirementStats.syllabus}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">TOS</div>
            <div className="text-2xl font-bold text-green-800">{requirementStats.tos}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Exams</div>
            <div className="text-2xl font-bold text-yellow-800">
              {requirementStats.midterm + requirementStats.final}
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="text-indigo-600 text-sm font-medium">Instrumental Materials</div>
            <div className="text-2xl font-bold text-indigo-800">{requirementStats.instrumental}</div>
          </div>
          <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
            <div className="text-cyan-600 text-sm font-medium">All Files</div>
            <div className="text-2xl font-bold text-cyan-800">{requirementStats.allFiles}</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">File Type Distribution</h3>
            <div className="h-64">
              <Doughnut data={fileTypeChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Req ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Task Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Professor</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">File Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Due Date</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Created At</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRequirements.length > 0 ? (
                currentRequirements.map((requirement) => (
                  <tr key={requirement._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{requirement.requirement_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{requirement.task_name}</td>
                    <td className="px-4 py-3 text-gray-700">{requirement.prof_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFileTypeBadgeColor(requirement.file_type)}`}>
                        {getFileTypeDisplay(requirement)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        new Date(requirement.due_date) < new Date() 
                          ? 'text-red-600' 
                          : 'text-gray-700'
                      }`}>
                        {new Date(requirement.due_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(requirement.created_at).toLocaleDateString('en-US', {
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
                          setActionDropdown(actionDropdown === requirement.requirement_id ? null : requirement.requirement_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === requirement.requirement_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(requirement.requirement_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(requirement.requirement_id)}
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
                    No requirements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentRequirements.length > 0 ? (
            currentRequirements.map((requirement) => (
              <div key={requirement._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">{requirement.task_name}</h2>
                    <p className="text-sm text-gray-600 font-mono">ID: {requirement.requirement_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFileTypeBadgeColor(requirement.file_type)}`}>
                      {getFileTypeDisplay(requirement)}
                    </span>
                    
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === requirement.requirement_id ? null : requirement.requirement_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === requirement.requirement_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(requirement.requirement_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(requirement.requirement_id)}
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
                    <span className="text-gray-500">Professor:</span>
                    <p className="font-medium">{requirement.prof_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <p className={`font-medium ${
                      new Date(requirement.due_date) < new Date() ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {new Date(requirement.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {requirement.notes && (
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="text-gray-500">Notes:</span>
                    <p className="mt-1">{requirement.notes}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  Created: {new Date(requirement.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              No requirements found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentRequirements.length} of {filteredRequirements.length} requirements
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

        {/* Add/Edit Requirement Modal */}
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
                {isEditMode ? "Update Requirement" : "Add New Requirement"}
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
              {/* Requirement ID (readonly in edit mode) */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirement ID
                  </label>
                  <input
                    type="text"
                    name="requirement_id"
                    value={formData.requirement_id}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Task Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name *
                </label>
                <input
                  type="text"
                  name="task_name"
                  value={formData.task_name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Enter task name"
                />
              </div>

              {/* Professor Name - DROPDOWN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professor Name *
                </label>
                <select
                  name="prof_name"
                  value={formData.prof_name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  <option value="">Select professor</option>
                  <option value="ALL">ALL FACULTY</option>
                  {facultyList.map((faculty) => (
                    <option key={faculty.user_id} value={faculty.name}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
                {facultyList.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No faculty accounts found. Please register faculty users first.
                  </p>
                )}
                {formData.prof_name === "ALL" && (
                  <p className="text-xs text-blue-600 mt-1">
                    This requirement will be sent to ALL faculty members.
                  </p>
                )}
              </div>

              {/* File Type - Combo Box */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Type *
                </label>
                <select
                  name="file_type"
                  value={formData.file_type}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  <option value="">Select file type</option>
                  {fileTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type === 'all-files' ? 'All Files' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                {formData.file_type === "all-files" && (
                  <p className="text-xs text-blue-600 mt-1">
                    This requirement includes ALL file types.
                  </p>
                )}
              </div>

              {/* TOS Type Dropdown (only shown when file_type is "tos") */}
              {formData.file_type === "tos" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TOS Type *
                  </label>
                  <select
                    name="tos_type"
                    value={formData.tos_type}
                    onChange={handleInputChange}
                    required={formData.file_type === "tos"}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                  >
                    <option value="">Select TOS type</option>
                    {tosTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">
                    The TOS type will be included in the notification sent to faculty.
                  </p>
                </div>
              )}

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Additional notes (optional)"
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
                  {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Requirement" : "Add Requirement")}
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
              Are you sure you want to delete this requirement? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(requirementToDelete)}
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