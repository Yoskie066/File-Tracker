import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, MoreVertical, Eye, Edit, Trash2, Download, BarChart3 } from "lucide-react";

export default function AdminDeliverables() {
  const [deliverables, setDeliverables] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const deliverablesPerPage = 10;

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deliverableToDelete, setDeliverableToDelete] = useState(null);

  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deliverableToUpdate, setDeliverableToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch deliverables from backend
  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/deliverables`);
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched deliverables:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setDeliverables(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setDeliverables([]);
      }
    } catch (err) {
      console.error("Error fetching deliverables:", err);
      setDeliverables([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/deliverables/stats`);
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, []);

  useEffect(() => {
    if (showStats) {
      fetchStats();
    }
  }, [showStats]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Show feedback modal
  const showFeedback = (type, message) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setFeedbackModalOpen(true);
  };

  // Get file type label with TOS type support
  const getFileTypeLabel = (fileType, tosType = null) => {
    // Handle TOS files with specific types
    if (fileType === 'tos-midterm' || (fileType === 'tos' && tosType === 'midterm')) {
      return 'TOS (TOS-Midterm)';
    }
    if (fileType === 'tos-final' || (fileType === 'tos' && tosType === 'final')) {
      return 'TOS (TOS-Final)';
    }

    const typeMap = {
      'syllabus': 'Syllabus',
      'tos': 'TOS',
      'midterm-exam': 'Midterm Exam',
      'final-exam': 'Final Exam',
      'instructional-materials': 'Instructional Materials'
    };
    return typeMap[fileType] || fileType;
  };

  // Get status badge color and icon
  const getStatusDetails = (status) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
  };

  // Handle update status
  const handleUpdateStatus = async () => {
    if (!deliverableToUpdate || !newStatus) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/deliverables/${deliverableToUpdate.deliverable_id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        fetchDeliverables(); 
        setStatusModalOpen(false);
        setDeliverableToUpdate(null);
        setNewStatus("");
        showFeedback("success", "Deliverable status updated successfully!");
      } else {
        showFeedback("error", result.message || "Error updating deliverable status");
      }
    } catch (error) {
      console.error("Error updating deliverable status:", error);
      showFeedback("error", "Error updating deliverable status");
    }
  };

  // Open status update modal
  const openStatusModal = (deliverable) => {
    setDeliverableToUpdate(deliverable);
    setNewStatus(deliverable.status);
    setStatusModalOpen(true);
    setActionDropdown(null);
  };

  // Handle delete deliverable
  const handleDelete = async (deliverableId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/deliverables/${deliverableId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchDeliverables();
        showFeedback("success", "Deliverable deleted successfully!");
      } else {
        showFeedback("error", result.message || "Error deleting deliverable");
      }
    } catch (error) {
      console.error("Error deleting deliverable:", error);
      showFeedback("error", "Error deleting deliverable");
    }
    setDeleteModalOpen(false);
    setDeliverableToDelete(null);
    setActionDropdown(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (deliverableId) => {
    setDeliverableToDelete(deliverableId);
    setDeleteModalOpen(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Search filter
  const filteredDeliverables = deliverables.filter(deliverable =>
    [deliverable.deliverable_id, deliverable.faculty_name, deliverable.file_name, deliverable.file_type, deliverable.subject_code, deliverable.course_section, deliverable.tos_type]
      .some(field => field?.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredDeliverables.length / deliverablesPerPage);
  const startIndex = (currentPage - 1) * deliverablesPerPage;
  const currentDeliverables = filteredDeliverables.slice(startIndex, startIndex + deliverablesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Calculate stats from deliverables data
  const deliverableStats = {
    total: deliverables.length,
    pending: deliverables.filter(d => d.status === 'pending').length,
    completed: deliverables.filter(d => d.status === 'completed').length,
    rejected: deliverables.filter(d => d.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Deliverables</h1>
            <p className="text-sm text-gray-500">
              Monitor and manage all faculty deliverables and their submission status
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              {showStats ? "Hide Stats" : "Show Stats"}
            </button>
            <input
              type="text"
              placeholder="Search deliverables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Deliverables</div>
            <div className="text-2xl font-bold text-blue-800">{deliverableStats.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">{deliverableStats.pending}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Completed</div>
            <div className="text-2xl font-bold text-green-800">{deliverableStats.completed}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-600 text-sm font-medium">Rejected</div>
            <div className="text-2xl font-bold text-red-800">{deliverableStats.rejected}</div>
          </div>
        </div>

        {/* Advanced Statistics Section */}
        {showStats && (
          <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Statistics</h3>
            {statsLoading ? (
              <div className="text-center py-4">Loading statistics...</div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* File Type Statistics */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">By File Type</h4>
                  <div className="space-y-2">
                    {stats.fileTypeStats && stats.fileTypeStats.map((typeStat) => (
                      <div key={typeStat._id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{getFileTypeLabel(typeStat._id)}</span>
                        <div className="flex gap-2">
                          <span className="text-blue-600">{typeStat.count}</span>
                          <span className="text-green-600">({typeStat.completed})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Faculty */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Top Faculty</h4>
                  <div className="space-y-2">
                    {stats.facultyStats && stats.facultyStats.map((facultyStat) => (
                      <div key={facultyStat._id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 truncate max-w-[120px]">{facultyStat.faculty_name}</span>
                        <div className="flex gap-2">
                          <span className="text-blue-600">{facultyStat.count}</span>
                          <span className="text-green-600">({facultyStat.completed})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Recent Activity (7 days)</h4>
                  <div className="space-y-2">
                    {stats.recentActivity && stats.recentActivity.map((activity) => (
                      <div key={activity._id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{activity._id}</span>
                        <span className="text-blue-600">{activity.count} submissions</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No statistics available</div>
            )}
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Deliverable ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Faculty Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">File Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">File Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject & Section</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Status</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Uploaded At</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDeliverables.length > 0 ? (
                currentDeliverables.map((deliverable) => {
                  const statusDetails = getStatusDetails(deliverable.status);
                  const StatusIcon = statusDetails.icon;
                  
                  return (
                    <tr key={deliverable._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{deliverable.deliverable_id}</td>
                      <td className="px-4 py-3 text-gray-700">{deliverable.faculty_name}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{deliverable.file_name}</td>
                      <td className="px-4 py-3 text-gray-700">{getFileTypeLabel(deliverable.file_type, deliverable.tos_type)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {deliverable.tos_type ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                            {deliverable.tos_type}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {deliverable.subject_code} - {deliverable.course_section}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {deliverable.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {formatDate(deliverable.uploaded_at)}
                      </td>
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionDropdown(actionDropdown === deliverable.deliverable_id ? null : deliverable.deliverable_id);
                          }}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {actionDropdown === deliverable.deliverable_id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                              onClick={() => openStatusModal(deliverable)}
                              className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Update Status
                            </button>
                            <button
                              onClick={() => confirmDelete(deliverable.deliverable_id)}
                              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500 font-medium">
                    {loading ? "Loading deliverables..." : "No deliverables found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentDeliverables.length > 0 ? (
            currentDeliverables.map((deliverable) => {
              const statusDetails = getStatusDetails(deliverable.status);
              const StatusIcon = statusDetails.icon;
              
              return (
                <div key={deliverable._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-800">{deliverable.file_name}</h2>
                      <p className="text-sm text-gray-600 font-mono">ID: {deliverable.deliverable_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {deliverable.status}
                      </span>
                      
                      {/* Mobile Actions Dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionDropdown(actionDropdown === deliverable.deliverable_id ? null : deliverable.deliverable_id);
                          }}
                          className="p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {actionDropdown === deliverable.deliverable_id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                              onClick={() => openStatusModal(deliverable)}
                              className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Update Status
                            </button>
                            <button
                              onClick={() => confirmDelete(deliverable.deliverable_id)}
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
                      <span className="text-gray-500">Faculty:</span>
                      <p className="font-medium">{deliverable.faculty_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium">{getFileTypeLabel(deliverable.file_type, deliverable.tos_type)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">TOS Type:</span>
                      <p className="font-medium capitalize">{deliverable.tos_type || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Subject:</span>
                      <p className="font-medium">{deliverable.subject_code} - {deliverable.course_section}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Uploaded:</span>
                      <p className="font-medium text-xs">{formatDate(deliverable.uploaded_at)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              {loading ? "Loading deliverables..." : "No deliverables found."}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentDeliverables.length} of {filteredDeliverables.length} deliverables
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

        {/* Status Update Modal */}
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${statusModalOpen ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-lg max-w-md w-full mx-auto my-8">
            {deliverableToUpdate && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Update Deliverable Status
                  </h3>
                  <button
                    onClick={() => setStatusModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deliverable: <span className="font-semibold">{deliverableToUpdate.file_name}</span>
                    </label>
                    <p className="text-sm text-gray-600 mb-4">
                      Type: {getFileTypeLabel(deliverableToUpdate.file_type, deliverableToUpdate.tos_type)}
                      {deliverableToUpdate.tos_type && ` (${deliverableToUpdate.tos_type})`}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Faculty: {deliverableToUpdate.faculty_name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setStatusModalOpen(false)}
                      className="flex-1 border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateStatus}
                      className="flex-1 bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-yellow-500 hover:text-black transition-colors"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${deleteModalOpen ? 'block' : 'hidden'}`}>
          <div className="bg-white p-6 rounded-xl max-w-sm mx-auto shadow-lg">
            <div className="flex flex-col items-center text-center">
              <XCircle className="text-red-500 w-12 h-12 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this deliverable? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deliverableToDelete)}
                  className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${feedbackModalOpen ? 'block' : 'hidden'}`}>
          <div className="bg-white p-6 rounded-xl max-w-sm mx-auto shadow-lg">
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
          </div>
        </div>
      </div>
    </div>
  );
}