import { useState, useEffect } from "react";
import { Doughnut } from 'react-chartjs-2';
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Trash2, Eye, Archive, Download, Calendar, History, Edit, Save, X } from "lucide-react";
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

Modal.setAppElement("#root");

export default function AdminDeliverables() {
  const [deliverables, setDeliverables] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const [editingTosType, setEditingTosType] = useState(null);
  const [newTosType, setNewTosType] = useState("");
  const deliverablesPerPage = 10;

  // History of Records states
  const [historyView, setHistoryView] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("all");

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deliverableToDelete, setDeliverableToDelete] = useState(null);

  // Preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deliverableToPreview, setDeliverableToPreview] = useState(null);

  // History of Records management modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

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
        const deliverablesData = result.data;
        setDeliverables(deliverablesData);
        
        // Extract available years from deliverables
        const years = [...new Set(deliverablesData.map(d => {
          const date = new Date(d.last_updated);
          return date.getFullYear();
        }))].sort((a, b) => b - a);
        
        setAvailableYears(years);
        if (years.length > 0 && !years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }
      } else {
        console.error("Unexpected API response format:", result);
        setDeliverables([]);
        setAvailableYears([]);
      }
    } catch (err) {
      console.error("Error fetching deliverables:", err);
      setDeliverables([]);
      setAvailableYears([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, []);

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

  // Handle TOS type update
  const handleTosTypeUpdate = async (deliverableId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/deliverables/${deliverableId}/tos-type`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tos_type: newTosType }),
      });

      const result = await response.json();

      if (result.success) {
        fetchDeliverables();
        setEditingTosType(null);
        setNewTosType("");
        showFeedback("success", "TOS type updated successfully!");
      } else {
        showFeedback("error", result.message || "Error updating TOS type");
      }
    } catch (error) {
      console.error("Error updating TOS type:", error);
      showFeedback("error", "Error updating TOS type");
    }
  };

  // Start editing TOS type
  const startEditingTosType = (deliverable) => {
    setEditingTosType(deliverable.admin_deliverables_id);
    setNewTosType(deliverable.tos_type || "");
  };

  // Cancel editing TOS type
  const cancelEditingTosType = () => {
    setEditingTosType(null);
    setNewTosType("");
  };

  // Handle preview deliverable
  const handlePreview = (deliverable) => {
    setDeliverableToPreview(deliverable);
    setPreviewModalOpen(true);
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

  // Get TOS type display text
  const getTosTypeDisplay = (tosType) => {
    switch (tosType) {
      case 'midterm': return 'Midterm Only';
      case 'final': return 'Final Only';
      case 'both': return 'Both Midterm & Final';
      case null: return 'Not Set';
      default: return 'Not Set';
    }
  };

  // Get TOS type badge color
  const getTosTypeColor = (tosType) => {
    switch (tosType) {
      case 'midterm': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'final': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'both': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Get unique school years and semesters for filtering
  const getUniqueSchoolYears = () => {
    const schoolYears = [...new Set(deliverables.map(d => d.school_year))].filter(Boolean).sort().reverse();
    return schoolYears;
  };

  const getUniqueSemesters = () => {
    const semesters = [...new Set(deliverables.map(d => d.semester))].filter(Boolean).sort();
    return semesters;
  };

  // Filter deliverables based on current view (history or current)
  const getFilteredDeliverables = () => {
    let filtered = Array.isArray(deliverables) ? deliverables : [];

    // Apply search filter
    filtered = filtered.filter((deliverable) =>
      [deliverable.admin_deliverables_id, deliverable.faculty_name, deliverable.subject_code, deliverable.tos_type ? getTosTypeDisplay(deliverable.tos_type) : '']
        .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
    );

    // Apply filters for history view
    if (historyView) {
      // Year filter
      filtered = filtered.filter(deliverable => {
        const deliverableYear = new Date(deliverable.last_updated).getFullYear();
        return deliverableYear === selectedYear;
      });

      // Semester filter
      if (selectedSemester !== "all") {
        filtered = filtered.filter(deliverable => deliverable.semester === selectedSemester);
      }

      // School Year filter
      if (selectedSchoolYear !== "all") {
        filtered = filtered.filter(deliverable => deliverable.school_year === selectedSchoolYear);
      }
    }

    return filtered;
  };

  const filteredDeliverables = getFilteredDeliverables();

  // Calculate stats based on current view
  const calculateStats = (deliverablesList) => {
    return {
      total: deliverablesList.length,
      pending: deliverablesList.filter(d => d.status_overall === 'pending').length,
      completed: deliverablesList.filter(d => d.status_overall === 'completed').length,
      rejected: deliverablesList.filter(d => d.status_overall === 'rejected').length
    };
  };

  const deliverableStats = calculateStats(filteredDeliverables);

  // Calculate TOS type distribution
  const tosTypeDistribution = {
    midterm: filteredDeliverables.filter(d => d.tos_type === 'midterm').length,
    final: filteredDeliverables.filter(d => d.tos_type === 'final').length,
    both: filteredDeliverables.filter(d => d.tos_type === 'both').length,
    not_set: filteredDeliverables.filter(d => !d.tos_type).length
  };

  // Chart data for status distribution
  const statusChartData = {
    labels: ['Pending', 'Completed', 'Rejected'],
    datasets: [
      {
        data: [deliverableStats.pending, deliverableStats.completed, deliverableStats.rejected],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderWidth: 2,
      },
    ],
  };

  // Chart data for TOS type distribution
  const tosTypeChartData = {
    labels: ['Midterm Only', 'Final Only', 'Both', 'Not Set'],
    datasets: [
      {
        data: [tosTypeDistribution.midterm, tosTypeDistribution.final, tosTypeDistribution.both, tosTypeDistribution.not_set],
        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#6B7280'],
        borderColor: ['#4F46E5', '#10B981', '#F59E0B', '#6B7280'],
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
  const totalPages = Math.ceil(filteredDeliverables.length / deliverablesPerPage);
  const startIndex = (currentPage - 1) * deliverablesPerPage;
  const currentDeliverables = filteredDeliverables.slice(startIndex, startIndex + deliverablesPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // History of Records functions
  const handleExportHistory = async (year) => {
    try {
      const deliverablesForYear = deliverables.filter(d => 
        new Date(d.last_updated).getFullYear() === year
      );
      
      // Create CSV content
      const headers = ['Deliverable ID', 'Faculty Name', 'Subject Code', 'TOS Type', 'Overall Status', 'Last Updated', 'Semester', 'School Year'];
      const csvContent = [
        headers.join(','),
        ...deliverablesForYear.map(d => [
          d.admin_deliverables_id,
          `"${d.faculty_name}"`,
          d.subject_code,
          d.tos_type || 'Not Set',
          d.status_overall,
          new Date(d.last_updated).toISOString(),
          d.semester,
          d.school_year
        ].join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `history-of-records-${year}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showFeedback("success", `History of Records for ${year} exported successfully!`);
    } catch (error) {
      console.error("Error exporting history:", error);
      showFeedback("error", "Error exporting history");
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {historyView ? `History of Records - ${selectedYear}` : 'Admin Deliverables'}
            </h1>
            <p className="text-sm text-gray-500">
              {historyView 
                ? `Viewing historical records and submissions for ${selectedYear}`
                : 'Monitor, review, and manage all faculty submissions'
              }
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* History of Records Filters */}
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

                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="all">All Semesters</option>
                  {getUniqueSemesters().map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>

                <select
                  value={selectedSchoolYear}
                  onChange={(e) => {
                    setSelectedSchoolYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="all">All School Years</option>
                  {getUniqueSchoolYears().map(schoolYear => (
                    <option key={schoolYear} value={schoolYear}>{schoolYear}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* View Toggle Buttons */}
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
                  <History className="w-4 h-4" />
                  History of Records
                </div>
              </button>
            </div>

            <input
              type="text"
              placeholder="Search deliverables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* History of Records Management Bar */}
        {historyView && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-800">
                  Viewing {filteredDeliverables.length} historical records from {selectedYear}
                  {selectedSemester !== "all" && ` • ${selectedSemester}`}
                  {selectedSchoolYear !== "all" && ` • ${selectedSchoolYear}`}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportHistory(selectedYear)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-yellow-500 hover:text-black transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export {selectedYear} History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total {historyView ? 'Records' : 'Deliverables'}</div>
            <div className="text-2xl font-bold text-blue-800">{deliverableStats.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Pending {historyView ? 'Records' : 'Deliverables'}</div>
            <div className="text-2xl font-bold text-yellow-800">{deliverableStats.pending}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Completed {historyView ? 'Records' : 'Deliverables'}</div>
            <div className="text-2xl font-bold text-green-800">{deliverableStats.completed}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-600 text-sm font-medium">Rejected {historyView ? 'Records' : 'Deliverables'}</div>
            <div className="text-2xl font-bold text-red-800">{deliverableStats.rejected}</div>
          </div>
        </div>

        {/* Charts Section - Hide in history view */}
        {!historyView && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Deliverables Status Distribution</h3>
              <div className="h-64">
                {deliverableStats.total > 0 ? (
                  <Doughnut data={statusChartData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">TOS Type Distribution</h3>
              <div className="h-64">
                {deliverableStats.total > 0 ? (
                  <Doughnut data={tosTypeChartData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">{historyView ? 'Record' : 'Deliverable'} ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Faculty Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject Code & Section</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Deliverables Status</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Overall Status</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Last Updated</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDeliverables.length > 0 ? (
                currentDeliverables.map((deliverable) => (
                  <tr key={deliverable._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{deliverable.admin_deliverables_id}</td>
                    <td className="px-4 py-3 text-gray-700">{deliverable.faculty_name}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 font-mono text-xs">{deliverable.subject_code}</div>
                      <div className="text-gray-500 text-xs">Section: {deliverable.course_section}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="grid grid-cols-2 gap-1">
                        <div>Syllabus: <span className={`px-1 rounded ${getStatusColor(deliverable.syllabus)}`}>{deliverable.syllabus}</span></div>
                        <div>TOS Mid: <span className={`px-1 rounded ${getStatusColor(deliverable.tos_midterm)}`}>{deliverable.tos_midterm}</span></div>
                        <div>TOS Final: <span className={`px-1 rounded ${getStatusColor(deliverable.tos_final)}`}>{deliverable.tos_final}</span></div>
                        <div>Midterm: <span className={`px-1 rounded ${getStatusColor(deliverable.midterm_exam)}`}>{deliverable.midterm_exam}</span></div>
                        <div>Final: <span className={`px-1 rounded ${getStatusColor(deliverable.final_exam)}`}>{deliverable.final_exam}</span></div>
                        <div>Materials: <span className={`px-1 rounded ${getStatusColor(deliverable.instructional_materials)}`}>{deliverable.instructional_materials}</span></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingTosType === deliverable.admin_deliverables_id ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={newTosType}
                            onChange={(e) => setNewTosType(e.target.value)}
                            className="border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-black w-24"
                          >
                            <option value="">Not Set</option>
                            <option value="midterm">Midterm Only</option>
                            <option value="final">Final Only</option>
                            <option value="both">Both</option>
                          </select>
                          <button
                            onClick={() => handleTosTypeUpdate(deliverable.admin_deliverables_id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEditingTosType}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTosTypeColor(deliverable.tos_type)}`}>
                            {getTosTypeDisplay(deliverable.tos_type)}
                          </span>
                          {!historyView && (
                            <button
                              onClick={() => startEditingTosType(deliverable)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Edit TOS Type"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deliverable.status_overall)}`}>
                        {deliverable.status_overall}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(deliverable.last_updated)}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === deliverable.admin_deliverables_id ? null : deliverable.admin_deliverables_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === deliverable.admin_deliverables_id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handlePreview(deliverable)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Details
                          </button>
                          {!historyView && (
                            <>
                              <button
                                onClick={() => startEditingTosType(deliverable)}
                                className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit TOS Type
                              </button>
                              <button
                                onClick={() => confirmDelete(deliverable.admin_deliverables_id)}
                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 font-medium">
                    {loading ? "Loading deliverables..." : `No ${historyView ? 'historical records' : 'deliverables'} found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentDeliverables.length > 0 ? (
            currentDeliverables.map((deliverable) => (
              <div key={deliverable._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">{deliverable.subject_code} - {deliverable.course_section}</h2>
                    <p className="text-sm text-gray-600 font-mono">ID: {deliverable.admin_deliverables_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deliverable.status_overall)}`}>
                      {deliverable.status_overall}
                    </span>
                    
                    {/* Mobile Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === deliverable.admin_deliverables_id ? null : deliverable.admin_deliverables_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionDropdown === deliverable.admin_deliverables_id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handlePreview(deliverable)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Details
                          </button>
                          {!historyView && (
                            <>
                              <button
                                onClick={() => startEditingTosType(deliverable)}
                                className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit TOS Type
                              </button>
                              <button
                                onClick={() => confirmDelete(deliverable.admin_deliverables_id)}
                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </>
                          )}
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
                    <span className="text-gray-500">TOS Type:</span>
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTosTypeColor(deliverable.tos_type)}`}>
                        {getTosTypeDisplay(deliverable.tos_type)}
                      </span>
                      {!historyView && (
                        <button
                          onClick={() => startEditingTosType(deliverable)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit TOS Type"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Deliverables Status:</span>
                    <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                      <div>Syllabus: <span className={`px-1 rounded ${getStatusColor(deliverable.syllabus)}`}>{deliverable.syllabus}</span></div>
                      <div>TOS Mid: <span className={`px-1 rounded ${getStatusColor(deliverable.tos_midterm)}`}>{deliverable.tos_midterm}</span></div>
                      <div>TOS Final: <span className={`px-1 rounded ${getStatusColor(deliverable.tos_final)}`}>{deliverable.tos_final}</span></div>
                      <div>Midterm: <span className={`px-1 rounded ${getStatusColor(deliverable.midterm_exam)}`}>{deliverable.midterm_exam}</span></div>
                      <div>Final: <span className={`px-1 rounded ${getStatusColor(deliverable.final_exam)}`}>{deliverable.final_exam}</span></div>
                      <div>Materials: <span className={`px-1 rounded ${getStatusColor(deliverable.instructional_materials)}`}>{deliverable.instructional_materials}</span></div>
                    </div>
                  </div>
                </div>

                {editingTosType === deliverable.admin_deliverables_id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        value={newTosType}
                        onChange={(e) => setNewTosType(e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <option value="">Not Set</option>
                        <option value="midterm">Midterm Only</option>
                        <option value="final">Final Only</option>
                        <option value="both">Both Midterm & Final</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTosTypeUpdate(deliverable.admin_deliverables_id)}
                        className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center justify-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={cancelEditingTosType}
                        className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  Updated: {formatDate(deliverable.last_updated)}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              {loading ? "Loading deliverables..." : `No ${historyView ? 'historical records' : 'deliverables'} found.`}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentDeliverables.length} of {filteredDeliverables.length} {historyView ? 'historical records' : 'deliverables'}
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

        {/* Deliverable Preview Modal */}
        <Modal
          isOpen={previewModalOpen}
          onRequestClose={() => setPreviewModalOpen(false)}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          {deliverableToPreview && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {historyView ? 'Historical Record' : 'Deliverable'} Details
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
                    <label className="block text-sm font-medium text-gray-700">{historyView ? 'Record' : 'Deliverable'} ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{deliverableToPreview.admin_deliverables_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Overall Status</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deliverableToPreview.status_overall)}`}>
                      {deliverableToPreview.status_overall}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Faculty Name</label>
                    <p className="mt-1 text-sm text-gray-900">{deliverableToPreview.faculty_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Faculty ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{deliverableToPreview.faculty_id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{deliverableToPreview.subject_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course Section</label>
                    <p className="mt-1 text-sm text-gray-900">{deliverableToPreview.course_section}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">TOS Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium ${getTosTypeColor(deliverableToPreview.tos_type)}`}>
                      {getTosTypeDisplay(deliverableToPreview.tos_type)}
                    </span>
                    {!historyView && (
                      <button
                        onClick={() => {
                          startEditingTosType(deliverableToPreview);
                          setPreviewModalOpen(false);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <Edit className="w-4 h-4 inline mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deliverables Status</label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Syllabus:</span>
                      <span className={`px-2 py-1 rounded ${getStatusColor(deliverableToPreview.syllabus)}`}>
                        {deliverableToPreview.syllabus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>TOS Midterm:</span>
                      <span className={`px-2 py-1 rounded ${getStatusColor(deliverableToPreview.tos_midterm)}`}>
                        {deliverableToPreview.tos_midterm}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>TOS Final:</span>
                      <span className={`px-2 py-1 rounded ${getStatusColor(deliverableToPreview.tos_final)}`}>
                        {deliverableToPreview.tos_final}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Midterm Exam:</span>
                      <span className={`px-2 py-1 rounded ${getStatusColor(deliverableToPreview.midterm_exam)}`}>
                        {deliverableToPreview.midterm_exam}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Final Exam:</span>
                      <span className={`px-2 py-1 rounded ${getStatusColor(deliverableToPreview.final_exam)}`}>
                        {deliverableToPreview.final_exam}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instructional Materials:</span>
                      <span className={`px-2 py-1 rounded ${getStatusColor(deliverableToPreview.instructional_materials)}`}>
                        {deliverableToPreview.instructional_materials}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Semester</label>
                    <p className="mt-1 text-sm text-gray-900">{deliverableToPreview.semester}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">School Year</label>
                    <p className="mt-1 text-sm text-gray-900">{deliverableToPreview.school_year}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(deliverableToPreview.last_updated)}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  {!historyView && (
                    <button
                      onClick={() => confirmDelete(deliverableToPreview.admin_deliverables_id)}
                      className="flex-1 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete {historyView ? 'Record' : 'Deliverable'}
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewModalOpen(false)}
                    className={`${
                      historyView ? 'flex-1' : 'flex-1'
                    } border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
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
              Are you sure you want to delete this {historyView ? 'historical record' : 'deliverable'}? This action cannot be undone.
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