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
import { useNavigate } from "react-router-dom";
import tokenService from "../../services/tokenService"

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

export default function FacultyLoadedManagement() {
  const [facultyLoadeds, setFacultyLoadeds] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const facultyLoadedsPerPage = 10;

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [facultyLoadedToDelete, setFacultyLoadedToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    faculty_loaded_id: "",
    subject_code: "",
    subject_title: "",
    course_section: "",
    semester: "",
    school_year: "",
    day_time: ""
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate(); // Add this

  // Semester options for combo box
  const semesterOptions = [
    "1st Semester",
    "2nd Semester",
    "Summer"
  ];

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
    
    fetchFacultyLoadeds();
  }, [navigate]);

  // Fetch faculty loadeds from backend 
  const fetchFacultyLoadeds = async () => {
    try {
      const token = tokenService.getFacultyAccessToken();
      if (!token) {
        console.error("No access token found");
        showFeedback("error", "Please login again");
        navigate('/auth/login');
        return;
      }

      const res = await fetch("http://localhost:3000/api/faculty/faculty-loaded", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }); 
      
      if (!res.ok) {
        if (res.status === 401) {
          tokenService.clearFacultyTokens();
          showFeedback("error", "Session expired. Please login again.");
          navigate('/auth/login');
          return;
        }
        throw new Error("Server responded with " + res.status);
      }
      
      const result = await res.json();
      console.log("Fetched faculty loadeds for current user:", result);
      
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
      course_section: "",
      semester: "",
      school_year: "",
      day_time: ""
    });
    setIsEditMode(false);
  };

  // Handle form submission - UPDATED WITH AUTH TOKEN
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

      const url = isEditMode 
        ? `http://localhost:3000/api/faculty/faculty-loaded/${formData.faculty_loaded_id}`
        : "http://localhost:3000/api/faculty/faculty-loaded";
      
      const method = isEditMode ? "PUT" : "POST";
  
      const requestData = isEditMode ? {
        subject_code: formData.subject_code,
        subject_title: formData.subject_title,
        course_section: formData.course_section,
        semester: formData.semester,
        school_year: formData.school_year,
        day_time: formData.day_time
      } : {
        subject_code: formData.subject_code,
        subject_title: formData.subject_title,
        course_section: formData.course_section,
        semester: formData.semester,
        school_year: formData.school_year,
        day_time: formData.day_time
      };
  
      console.log("Sending request to:", url);
      console.log("Request method:", method);
      console.log("Request data:", requestData);
  
      const response = await fetch(url, { 
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // ADDED THIS LINE
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
        fetchFacultyLoadeds();
        showFeedback("success", 
          isEditMode ? "Faculty loaded updated successfully!" : "Faculty loaded added successfully!"
        );
      } else {
        showFeedback("error", result.message || `Error ${isEditMode ? 'updating' : 'adding'} faculty loaded`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} faculty loaded:`, error);
      showFeedback("error", error.message || `Error ${isEditMode ? 'updating' : 'creating'} faculty loaded`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit faculty loaded - UPDATED WITH AUTH TOKEN
  const handleEdit = async (facultyLoadedId) => {
    try {
      const token = tokenService.getFacultyAccessToken();
      if (!token) {
        showFeedback("error", "Please login again");
        return;
      }

      const response = await fetch(`http://localhost:3000/api/faculty/faculty-loaded/${facultyLoadedId}`, {
        headers: {
          'Authorization': `Bearer ${token}` // ADDED THIS LINE
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearFacultyTokens();
          showFeedback("error", "Session expired. Please login again.");
          return;
        }
        throw new Error("Failed to fetch faculty loaded data");
      }

      const result = await response.json();
  
      if (result.success && result.data) {
        const facultyLoaded = result.data;
        setFormData({
          faculty_loaded_id: facultyLoaded.faculty_loaded_id,
          subject_code: facultyLoaded.subject_code,
          subject_title: facultyLoaded.subject_title,
          course_section: facultyLoaded.course_section,
          semester: facultyLoaded.semester,
          school_year: facultyLoaded.school_year,
          day_time: facultyLoaded.day_time
        });
        setIsEditMode(true);
        setShowModal(true);
      } else {
        showFeedback("error", "Error loading faculty loaded data");
      }
    } catch (error) {
      console.error("Error fetching faculty loaded:", error);
      showFeedback("error", "Error loading faculty loaded data");
    }
    setActionDropdown(null);
  }

  // Handle delete faculty loaded - UPDATED WITH AUTH TOKEN
  const handleDelete = async (facultyLoadedId) => {
    try {
      const token = tokenService.getFacultyAccessToken();
      if (!token) {
        showFeedback("error", "Please login again");
        return;
      }

      const response = await fetch(`http://localhost:3000/api/faculty/faculty-loaded/${facultyLoadedId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}` // ADDED THIS LINE
        }
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          tokenService.clearFacultyTokens();
          showFeedback("error", "Session expired. Please login again.");
          return;
        }
        throw new Error(result.message || "Error deleting faculty loaded");
      }

      if (result.success) {
        fetchFacultyLoadeds();
        showFeedback("success", "Faculty loaded deleted successfully!");
      } else {
        showFeedback("error", result.message || "Error deleting faculty loaded");
      }
    } catch (error) {
      console.error("Error deleting faculty loaded:", error);
      showFeedback("error", "Error deleting faculty loaded");
    }
    setDeleteModalOpen(false);
    setFacultyLoadedToDelete(null);
    setActionDropdown(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (facultyLoadedId) => {
    setFacultyLoadedToDelete(facultyLoadedId);
    setDeleteModalOpen(true);
  };

  // Calculate stats for charts
  const facultyLoadedStats = {
    total: Array.isArray(facultyLoadeds) ? facultyLoadeds.length : 0,
    firstSemester: Array.isArray(facultyLoadeds) ? facultyLoadeds.filter(fl => fl.semester === '1st Semester').length : 0,
    secondSemester: Array.isArray(facultyLoadeds) ? facultyLoadeds.filter(fl => fl.semester === '2nd Semester').length : 0,
    summer: Array.isArray(facultyLoadeds) ? facultyLoadeds.filter(fl => fl.semester === 'Summer').length : 0
  };

  // Search filter
  const filteredFacultyLoadeds = (Array.isArray(facultyLoadeds) ? facultyLoadeds : [])
    .filter((fl) =>
      [fl.faculty_loaded_id, fl.subject_code, fl.subject_title, fl.course_section, fl.semester, fl.school_year, fl.day_time]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

  // Chart data for semester distribution
  const semesterChartData = {
    labels: ['1st Semester', '2nd Semester', 'Summer'],
    datasets: [
      {
        data: [
          facultyLoadedStats.firstSemester,
          facultyLoadedStats.secondSemester,
          facultyLoadedStats.summer
        ],
        backgroundColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B'
        ],
        borderColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B'
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
  const totalPages = Math.ceil(filteredFacultyLoadeds.length / facultyLoadedsPerPage);
  const startIndex = (currentPage - 1) * facultyLoadedsPerPage;
  const currentFacultyLoadeds = filteredFacultyLoadeds.slice(startIndex, startIndex + facultyLoadedsPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Faculty Loaded Management</h1>
            <p className="text-sm text-gray-500">
              Manage faculty teaching loads, schedules, and course assignments
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search faculty loadeds..."
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
              title="Add New Faculty Loaded"
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
            <div className="text-blue-600 text-sm font-medium">Total Loads</div>
            <div className="text-2xl font-bold text-blue-800">{facultyLoadedStats.total}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">1st Semester</div>
            <div className="text-2xl font-bold text-purple-800">{facultyLoadedStats.firstSemester}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">2nd Semester</div>
            <div className="text-2xl font-bold text-green-800">{facultyLoadedStats.secondSemester}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Summer</div>
            <div className="text-2xl font-bold text-yellow-800">{facultyLoadedStats.summer}</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Semester Distribution</h3>
            <div className="h-64">
              <Doughnut data={semesterChartData} options={chartOptions} />
            </div>
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
                <th className="px-4 py-3 text-left border-r border-gray-600">Course Section</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Semester</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">School Year</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Day & Time</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentFacultyLoadeds.length > 0 ? (
                currentFacultyLoadeds.map((facultyLoaded) => (
                  <tr key={facultyLoaded._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{facultyLoaded.faculty_loaded_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 font-mono">{facultyLoaded.subject_code}</td>
                    <td className="px-4 py-3 text-gray-700">{facultyLoaded.subject_title}</td>
                    <td className="px-4 py-3 text-gray-700">{facultyLoaded.course_section}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        facultyLoaded.semester === '1st Semester' ? 'bg-purple-100 text-purple-800' :
                        facultyLoaded.semester === '2nd Semester' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {facultyLoaded.semester}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{facultyLoaded.school_year}</td>
                    <td className="px-4 py-3 text-gray-700">{facultyLoaded.day_time}</td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === facultyLoaded.faculty_loaded_id ? null : facultyLoaded.faculty_loaded_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === facultyLoaded.faculty_loaded_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(facultyLoaded.faculty_loaded_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(facultyLoaded.faculty_loaded_id)}
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
                    No faculty loadeds found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentFacultyLoadeds.length > 0 ? (
            currentFacultyLoadeds.map((facultyLoaded) => (
              <div key={facultyLoaded._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">{facultyLoaded.subject_title}</h2>
                    <p className="text-sm text-gray-600 font-mono">ID: {facultyLoaded.faculty_loaded_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      facultyLoaded.semester === '1st Semester' ? 'bg-purple-100 text-purple-800' :
                      facultyLoaded.semester === '2nd Semester' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {facultyLoaded.semester}
                    </span>
                    
                    {/* Mobile Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === facultyLoaded.faculty_loaded_id ? null : facultyLoaded.faculty_loaded_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === facultyLoaded.faculty_loaded_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(facultyLoaded.faculty_loaded_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(facultyLoaded.faculty_loaded_id)}
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
                    <span className="text-gray-500">Subject Code:</span>
                    <p className="font-medium font-mono">{facultyLoaded.subject_code}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Section:</span>
                    <p className="font-medium">{facultyLoaded.course_section}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">School Year:</span>
                    <p className="font-medium">{facultyLoaded.school_year}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Schedule:</span>
                    <p className="font-medium">{facultyLoaded.day_time}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Created: {new Date(facultyLoaded.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              No faculty loadeds found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentFacultyLoadeds.length} of {filteredFacultyLoadeds.length} faculty loadeds
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

        {/* Add/Edit Faculty Loaded Modal */}
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
                {isEditMode ? "Update Faculty Loaded" : "Add New Faculty Loaded"}
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
              {/* Faculty Loaded ID (readonly in edit mode) */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faculty Loaded ID
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

              {/* Subject Code */}
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
                  placeholder="Enter subject code"
                />
              </div>

              {/* Subject Title */}
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
                  placeholder="Enter subject title"
                />
              </div>

              {/* Course Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Section *
                </label>
                <input
                  type="text"
                  name="course_section"
                  value={formData.course_section}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Enter course section"
                />
              </div>

              {/* Semester - Combo Box */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester *
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  <option value="">Select semester</option>
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Year - Input Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Year *
                </label>
                <input
                  type="text"
                  name="school_year"
                  value={formData.school_year}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="e.g., 2023-2024"
                />
              </div>

              {/* Day & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day & Time *
                </label>
                <input
                  type="text"
                  name="day_time"
                  value={formData.day_time}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="e.g., MWF 8:00-9:30 AM"
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
                  {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Faculty Loaded" : "Add Faculty Loaded")}
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
              Are you sure you want to delete this faculty loaded? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(facultyLoadedToDelete)}
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