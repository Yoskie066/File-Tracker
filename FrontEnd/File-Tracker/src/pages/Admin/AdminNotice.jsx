import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Edit, Trash2, Calendar } from "lucide-react";

// Set app element for react-modal
Modal.setAppElement("#root");

export default function AdminNoticeManagement() {
  const [adminNotices, setAdminNotices] = useState([]);
  const [facultyList, setFacultyList] = useState([]); // ADDED: Faculty list
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFaculty, setLoadingFaculty] = useState(false); // ADDED: Faculty loading state
  const [actionDropdown, setActionDropdown] = useState(null);
  const adminNoticesPerPage = 10;

  // Statistics state
  const [adminNoticeStats, setAdminNoticeStats] = useState({
    total: 0,
    syllabus: 0,
    tos: 0,
    midterm_exam: 0,
    final_exam: 0,
    instructional_materials: 0,
    all_files: 0
  });

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminNoticeToDelete, setAdminNoticeToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    notice_id: "",
    prof_name: "",
    faculty_id: "", // ADDED: Store faculty ID
    document_type: "",
    tos_type: "N/A", // ADDED: TOS type
    due_date: "",
    notes: ""
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false); // ADDED: Calendar visibility

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Document type options - updated with new types
  const documentTypeOptions = [
    "Syllabus",
    "TOS",
    "MIDTERM EXAM",
    "FINAL EXAM",
    "INSTRUCTIONAL MATERIALS",
    "all-files"
  ];

  // TOS type options
  const tosTypeOptions = [
    "MIDTERM TOS",
    "FINAL TOS"
  ];

  // Fetch admin notices from backend 
  const fetchAdminNotices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/admin-notice`);
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched admin notices:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setAdminNotices(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setAdminNotices([]);
      }
    } catch (err) {
      console.error("Error fetching admin notices:", err);
      setAdminNotices([]);
    }
  };

  // Fetch faculty list from backend
  const fetchFacultyList = async () => {
    try {
      setLoadingFaculty(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/admin-notice/faculty`);
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      
      if (result.success && Array.isArray(result.data)) {
        setFacultyList(result.data);
      } else {
        console.error("Unexpected API response format for faculty:", result);
        setFacultyList([]);
      }
    } catch (err) {
      console.error("Error fetching faculty list:", err);
      setFacultyList([]);
    } finally {
      setLoadingFaculty(false);
    }
  };

  // Fetch admin notice statistics
  const fetchAdminNoticeStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/admin-notice/stats`);
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      
      if (result.success && result.data) {
        setAdminNoticeStats(result.data);
      }
    } catch (err) {
      console.error("Error fetching admin notice stats:", err);
    }
  };

  useEffect(() => {
    fetchAdminNotices();
    fetchFacultyList();
    fetchAdminNoticeStats();
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
    
    if (name === "prof_name") {
      if (value === "ALL") {
        setFormData(prev => ({
          ...prev,
          prof_name: "ALL",
          faculty_id: ""
        }));
      } else {
        const selectedFaculty = facultyList.find(f => f.facultyName === value);
        setFormData(prev => ({
          ...prev,
          prof_name: value,
          faculty_id: selectedFaculty ? selectedFaculty.facultyId : ""
        }));
      }
    } else if (name === "document_type") {
      // Reset TOS type if not TOS
      setFormData(prev => ({
        ...prev,
        document_type: value,
        tos_type: value === "TOS" ? prev.tos_type : "N/A"
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle date change via calendar
  const handleDateChange = (dateString) => {
    setFormData(prev => ({
      ...prev,
      due_date: dateString
    }));
    setShowCalendar(false);
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
      notice_id: "",
      prof_name: "",
      faculty_id: "",
      document_type: "",
      tos_type: "N/A",
      due_date: "",
      notes: ""
    });
    setIsEditMode(false);
    setShowCalendar(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const url = isEditMode 
        ? `${API_BASE_URL}/api/admin/admin-notice/${formData.notice_id}`
        : `${API_BASE_URL}/api/admin/admin-notice`;
      
      const method = isEditMode ? "PUT" : "POST";
  
      const requestData = {
        prof_name: formData.prof_name,
        faculty_id: formData.faculty_id,
        document_type: formData.document_type,
        tos_type: formData.document_type === "TOS" ? formData.tos_type : "N/A",
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
        fetchAdminNotices();
        fetchAdminNoticeStats();
        showFeedback("success", 
          isEditMode ? "Admin notice updated successfully!" : "Admin notice added successfully!"
        );
      } else {
        showFeedback("error", result.message || `Error ${isEditMode ? 'updating' : 'adding'} admin notice`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} admin notice:`, error);
      showFeedback("error", error.message || `Error ${isEditMode ? 'updating' : 'creating'} admin notice`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit admin notice
  const handleEdit = async (noticeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-notice/${noticeId}`);
      const result = await response.json();
  
      if (result.success && result.data) {
        const adminNotice = result.data;
        setFormData({
          notice_id: adminNotice.notice_id,
          prof_name: adminNotice.prof_name,
          faculty_id: adminNotice.faculty_id || "",
          document_type: adminNotice.document_type,
          tos_type: adminNotice.tos_type || "N/A",
          due_date: adminNotice.due_date ? adminNotice.due_date.split('T')[0] : "",
          notes: adminNotice.notes || ""
        });
        setIsEditMode(true);
        setShowModal(true);
      } else {
        showFeedback("error", "Error loading admin notice data");
      }
    } catch (error) {
      console.error("Error fetching admin notice:", error);
      showFeedback("error", "Error loading admin notice data");
    }
    setActionDropdown(null);
  }

  // Handle delete admin notice
  const handleDelete = async (noticeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-notice/${noticeId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchAdminNotices();
        fetchAdminNoticeStats();
        showFeedback("success", "Admin notice deleted successfully!");
      } else {
        showFeedback("error", result.message || "Error deleting admin notice");
      }
    } catch (error) {
      console.error("Error deleting admin notice:", error);
      showFeedback("error", "Error deleting admin notice");
    }
    setDeleteModalOpen(false);
    setAdminNoticeToDelete(null);
    setActionDropdown(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (noticeId) => {
    setAdminNoticeToDelete(noticeId);
    setDeleteModalOpen(true);
  };

  // Get badge color for document type
  const getDocumentTypeBadgeColor = (documentType) => {
    switch (documentType) {
      case 'Syllabus': return 'bg-blue-100 text-blue-800';
      case 'TOS': return 'bg-purple-100 text-purple-800';
      case 'MIDTERM EXAM': return 'bg-orange-100 text-orange-800';
      case 'FINAL EXAM': return 'bg-red-100 text-red-800';
      case 'INSTRUCTIONAL MATERIALS': return 'bg-green-100 text-green-800';
      case 'all-files': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate calendar days
  const generateCalendar = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return (
      <div className="absolute z-50 mt-1 p-4 bg-white border border-gray-300 rounded-lg shadow-lg w-64">
        <div className="flex justify-between items-center mb-2">
          <button 
            onClick={() => {}}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <span className="font-semibold">
            {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => {}}
            className="p-1 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
          {Array(firstDay.getDay()).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="h-8"></div>
          ))}
          {days.map(day => {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = day === today.getDate() && currentMonth === today.getMonth();
            const isSelected = formData.due_date === dateStr;
            
            return (
              <button
                key={day}
                onClick={() => handleDateChange(dateStr)}
                className={`h-8 w-8 flex items-center justify-center text-sm rounded-full ${
                  isSelected 
                    ? 'bg-black text-white' 
                    : isToday 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t">
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          />
        </div>
      </div>
    );
  };

  // Search filter
  const filteredAdminNotices = (Array.isArray(adminNotices) ? adminNotices : [])
    .filter((notice) =>
      [notice.notice_id, notice.prof_name, notice.document_type, notice.notes]
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

  // Pagination
  const totalPages = Math.ceil(filteredAdminNotices.length / adminNoticesPerPage);
  const startIndex = (currentPage - 1) * adminNoticesPerPage;
  const currentAdminNotices = filteredAdminNotices.slice(startIndex, startIndex + adminNoticesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Notice</h1>
            <p className="text-sm text-gray-500">
              Manage and track administrative notices and deadlines
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search admin notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={() => {
                resetForm();
                fetchFacultyList();
                setShowModal(true);
              }}
              className="bg-black text-white p-2 rounded-md hover:bg-yellow-400 hover:text-black transition-colors duration-200 flex items-center justify-center w-10 h-10"
              title="Add New Admin Notice"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Statistics Cards - UPDATED */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-gray-600 text-xs font-medium">Total Files</div>
            <div className="text-xl font-bold text-gray-800">{adminNoticeStats.total}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-xs font-medium">Syllabus</div>
            <div className="text-xl font-bold text-blue-800">{adminNoticeStats.syllabus}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-xs font-medium">TOS</div>
            <div className="text-xl font-bold text-purple-800">{adminNoticeStats.tos}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="text-orange-600 text-xs font-medium">Midterm Exam</div>
            <div className="text-xl font-bold text-orange-800">{adminNoticeStats.midterm_exam}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="text-red-600 text-xs font-medium">Final Exam</div>
            <div className="text-xl font-bold text-red-800">{adminNoticeStats.final_exam}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-green-600 text-xs font-medium">Instructional Materials</div>
            <div className="text-xl font-bold text-green-800">{adminNoticeStats.instructional_materials}</div>
          </div>
          <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
            <div className="text-cyan-600 text-xs font-medium">All Files</div>
            <div className="text-xl font-bold text-cyan-800">{adminNoticeStats.all_files}</div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Notice ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Professor</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Document Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Due Date</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Notes</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Created At</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAdminNotices.length > 0 ? (
                currentAdminNotices.map((adminNotice) => (
                  <tr key={adminNotice._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{adminNotice.notice_id}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex flex-col">
                        <span>{adminNotice.prof_name}</span>
                        {adminNotice.faculty_id && (
                          <span className="text-xs text-gray-500">ID: {adminNotice.faculty_id}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeBadgeColor(adminNotice.document_type)}`}>
                        {adminNotice.document_type === 'all-files' ? 'All Files' : adminNotice.document_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {adminNotice.document_type === 'TOS' && adminNotice.tos_type ? (
                        <span className="text-xs font-medium text-purple-600">
                          {adminNotice.tos_type}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        new Date(adminNotice.due_date) < new Date() 
                          ? 'text-red-600' 
                          : 'text-gray-700'
                      }`}>
                        {new Date(adminNotice.due_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={adminNotice.notes || "No notes"}>
                      {adminNotice.notes ? adminNotice.notes.substring(0, 30) + (adminNotice.notes.length > 30 ? "..." : "") : "No notes"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(adminNotice.created_at).toLocaleDateString('en-US', {
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
                          setActionDropdown(actionDropdown === adminNotice.notice_id ? null : adminNotice.notice_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === adminNotice.notice_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(adminNotice.notice_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(adminNotice.notice_id)}
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
                    No admin notices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentAdminNotices.length > 0 ? (
            currentAdminNotices.map((adminNotice) => (
              <div key={adminNotice._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">Admin Notice</h2>
                    <p className="text-sm text-gray-600 font-mono">ID: {adminNotice.notice_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeBadgeColor(adminNotice.document_type)}`}>
                      {adminNotice.document_type === 'all-files' ? 'All Files' : adminNotice.document_type}
                    </span>
                    
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === adminNotice.notice_id ? null : adminNotice.notice_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === adminNotice.notice_id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(adminNotice.notice_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </button>
                          <button
                            onClick={() => confirmDelete(adminNotice.notice_id)}
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
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                  <div>
                    <span className="text-gray-500">Professor:</span>
                    <p className="font-medium">{adminNotice.prof_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <p className={`font-medium ${
                      new Date(adminNotice.due_date) < new Date() ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {new Date(adminNotice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {adminNotice.document_type === 'TOS' && adminNotice.tos_type && (
                  <div className="mb-2">
                    <span className="text-gray-500 text-sm">TOS Type:</span>
                    <p className="font-medium text-purple-600 text-sm">
                      {adminNotice.tos_type}
                    </p>
                  </div>
                )}

                {/* Notes in mobile view */}
                <div className="mt-2">
                  <span className="text-gray-500 text-sm">Notes:</span>
                  <p className="text-sm text-gray-600 mt-1">
                    {adminNotice.notes || "No notes provided"}
                  </p>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Created: {new Date(adminNotice.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              No admin notices found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentAdminNotices.length} of {filteredAdminNotices.length} admin notices
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

        {/* Add/Edit Admin Notice Modal */}
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
                {isEditMode ? "Update Admin Notice" : "Add New Admin Notice"}
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
              {/* Notice ID (readonly in edit mode) */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notice ID
                  </label>
                  <input
                    type="text"
                    name="notice_id"
                    value={formData.notice_id}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Faculty Name - DROPDOWN with existing faculty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty Name *
                </label>
                <select
                  name="prof_name"
                  value={formData.prof_name}
                  onChange={handleInputChange}
                  required
                  disabled={loadingFaculty}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white disabled:bg-gray-100"
                >
                  <option value="">Select Faculty</option>
                  <option value="ALL">ALL FACULTY</option>
                  {loadingFaculty ? (
                    <option>Loading faculty...</option>
                  ) : (
                    facultyList.map((faculty) => (
                      <option key={faculty._id} value={faculty.facultyName}>
                        {faculty.facultyName} (ID: {faculty.facultyId})
                      </option>
                    ))
                  )}
                </select>
                {formData.prof_name === "ALL" ? (
                  <p className="text-xs text-blue-600 mt-1">
                    This admin notice will be sent to ALL faculty members.
                  </p>
                ) : formData.prof_name && (
                  <p className="text-xs text-green-600 mt-1">
                    This admin notice will be sent only to the selected faculty member.
                  </p>
                )}
              </div>

              {/* Document Type - Combo Box */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type *
                </label>
                <select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  <option value="">Select document type</option>
                  {documentTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type === 'all-files' ? 'All Files' : type}
                    </option>
                  ))}
                </select>
              </div>

              {/* TOS Type (only shown when document_type is TOS) */}
              {formData.document_type === "TOS" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TOS Type *
                  </label>
                  <select
                    name="tos_type"
                    value={formData.tos_type}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                  >
                    <option value="">Select TOS type</option>
                    {tosTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Due Date with Calendar Picker */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
                {showCalendar && (
                  <div className="relative">
                    {generateCalendar()}
                  </div>
                )}
              </div>

              {/* Notes Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions/Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter additional instructions or notes for this admin notice..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be displayed in the faculty notification.
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
                  disabled={loading}
                  className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Notice" : "Add Notice")}
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
              Are you sure you want to delete this admin notice? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(adminNoticeToDelete)}
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