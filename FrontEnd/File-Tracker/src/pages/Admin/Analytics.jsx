import { useState, useEffect } from "react";
import { Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
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
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [facultyPerformance, setFacultyPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  // Performance 
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [analyticsRes, facultyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/analytics`),
        fetch(`${API_BASE_URL}/api/admin/analytics/faculty-performance`)
      ]);

      // Handle analytics response
      if (analyticsRes.ok) {
        const analyticsResult = await analyticsRes.json();
        if (analyticsResult.success) {
          setAnalyticsData(analyticsResult.data);
        } else {
          throw new Error(analyticsResult.message || "Failed to fetch analytics data");
        }
      } else {
        throw new Error(`Analytics endpoint returned ${analyticsRes.status}`);
      }

      // Handle faculty performance response
      if (facultyRes.ok) {
        const facultyResult = await facultyRes.json();
        if (facultyResult.success) {
          setFacultyPerformance(facultyResult.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics data. Please try again.");
      setAnalyticsData(null);
      setFacultyPerformance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Search filter 
  const filteredUsers = facultyPerformance.filter((user) =>
    [user.faculty_id, user.faculty_name]
      .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination 
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Prepare chart data based on analytics data
  const getStatusDistributionData = () => ({
    labels: ['Pending', 'Completed', 'Rejected'],
    datasets: [
      {
        data: [
          analyticsData?.file_management.pending_files || 0,
          analyticsData?.file_management.completed_files || 0,
          analyticsData?.file_management.rejected_files || 0
        ],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderWidth: 2,
      },
    ],
  });

  const getUserDistributionData = () => ({
    labels: ['Admin', 'Faculty'],
    datasets: [
      {
        data: [
          analyticsData?.user_management.admin_count || 0,
          analyticsData?.user_management.faculty_count || 0
        ],
        backgroundColor: ['#4F46E5', '#10B981'],
        borderColor: ['#4F46E5', '#10B981'],
        borderWidth: 2,
      },
    ],
  });

  // Document Type Distribution
  const getDocumentTypeData = () => {
    const documentTypes = analyticsData?.file_management.document_type_distribution || {};
    
    const labels = Object.keys(documentTypes).map(type => {
      const typeMap = {
        'syllabus': 'Syllabus',
        'tos-midterm': 'TOS Midterm',
        'tos-final': 'TOS Final',
        'midterm-exam': 'Midterm Exam',
        'final-exam': 'Final Exam',
        'instructional-materials': 'Instructional Materials'
      };
      return typeMap[type] || type;
    });

    const data = Object.values(documentTypes);
    
    // Color palette for document types
    const backgroundColors = [
      '#4F46E5', // Indigo - Syllabus
      '#10B981', // Emerald - TOS Midterm
      '#0EA5E9', // Sky - TOS Final
      '#F59E0B', // Amber - Midterm Exam
      '#EF4444', // Red - Final Exam
      '#8B5CF6', // Violet - Instructional Materials
    ];

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors.slice(0, data.length),
          borderColor: backgroundColors.slice(0, data.length),
          borderWidth: 2,
        }
      ],
    };
  };

  // Requirement Status Distribution
  const getRequirementStatusData = () => ({
    labels: ['Overdue', 'Not Overdue'],
    datasets: [
      {
        data: [
          analyticsData?.requirement_management.overdue_requirements || 0,
          analyticsData?.requirement_management.not_overdue_requirements || 0
        ],
        backgroundColor: ['#EF4444', '#10B981'],
        borderColor: ['#EF4444', '#10B981'],
        borderWidth: 2,
      },
    ],
  });

  // System Variables Distribution
  const getSystemVariablesData = () => {
    const variableTypes = analyticsData?.system_variables?.variable_type_distribution || {
      subject_code: 0,
      course_section: 0,
      academic_year: 0,
      semester: 0
    };
    
    const labels = [
      'Subject Code',
      'Course Section', 
      'Academic Year',
      'Semester'
    ];

    const data = [
      variableTypes.subject_code || 0,
      variableTypes.course_section || 0,
      variableTypes.academic_year || 0,
      variableTypes.semester || 0
    ];

    const backgroundColors = [
      '#4F46E5', // Indigo - Subject Code
      '#10B981', // Emerald - Course Section
      '#F59E0B', // Amber - Academic Year
      '#EF4444'  // Red - Semester
    ];

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors,
          borderWidth: 2,
        }
      ],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
            <p className="text-sm text-gray-500">
              Comprehensive insights across all system modules and performance metrics
            </p>
            {error && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800 text-sm">{error}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Performance
            </button>
          </div>
        </div>

        {/* System Health Overview */}
        {analyticsData?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-sm font-medium">System Overview</div>
              <div className="text-2xl font-bold text-blue-800">
                {analyticsData.summary.system_health}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${analyticsData.summary.system_health}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 text-sm font-medium">Completion Rate</div>
              <div className="text-2xl font-bold text-green-800">
                {analyticsData.summary.completion_rate}%
              </div>
              <div className="text-sm text-green-600 mt-1">
                {analyticsData.file_management.completed_files} of {analyticsData.file_management.total_files} files
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium">Active Users</div>
              <div className="text-2xl font-bold text-purple-800">
                {analyticsData.user_management.active_rate}%
              </div>
              <div className="text-sm text-purple-600 mt-1">
                {analyticsData.user_management.online_users} online
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-orange-600 text-sm font-medium">Total Records</div>
              <div className="text-2xl font-bold text-orange-800">
                {analyticsData.summary.total_records.toLocaleString()}
              </div>
              <div className="text-sm text-orange-600 mt-1">
                Across all modules
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && analyticsData && (
          <div className="space-y-8">
            {/* Module Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* User Management Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">User Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users:</span>
                    <span className="font-semibold">{analyticsData.user_management.total_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Online:</span>
                    <span className="font-semibold text-green-600">{analyticsData.user_management.online_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admins:</span>
                    <span className="font-semibold">{analyticsData.user_management.admin_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Faculty:</span>
                    <span className="font-semibold">{analyticsData.user_management.faculty_count}</span>
                  </div>
                </div>
              </div>

              {/* File Management Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">File Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Files:</span>
                    <span className="font-semibold">{analyticsData.file_management.total_files}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-semibold text-green-600">{analyticsData.file_management.completed_files}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-yellow-600">{analyticsData.file_management.pending_files}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rejected:</span>
                    <span className="font-semibold text-red-600">{analyticsData.file_management.rejected_files}</span>
                  </div>
                </div>
              </div>

              {/* Requirements Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Requirements</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold">{analyticsData.requirement_management.total_requirements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overdue:</span>
                    <span className="font-semibold text-red-600">{analyticsData.requirement_management.overdue_requirements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Not Overdue:</span>
                    <span className="font-semibold text-green-600">{analyticsData.requirement_management.not_overdue_requirements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate:</span>
                    <span className="font-semibold text-blue-600">
                      {analyticsData.requirement_management.completion_rate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* System Variables Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Variables</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Variables:</span>
                    <span className="font-semibold">{analyticsData.system_variables.total_variables}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject Codes:</span>
                    <span className="font-semibold text-purple-600">{analyticsData.system_variables.variable_type_distribution.subject_code || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course Sections:</span>
                    <span className="font-semibold text-green-600">{analyticsData.system_variables.variable_type_distribution.course_section || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Academic Years:</span>
                    <span className="font-semibold text-yellow-600">{analyticsData.system_variables.variable_type_distribution.academic_year || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Semesters:</span>
                    <span className="font-semibold text-red-600">{analyticsData.system_variables.variable_type_distribution.semester || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* User Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">User Distribution</h3>
                <div className="h-64">
                  <Doughnut data={getUserDistributionData()} options={chartOptions} />
                </div>
              </div>

              {/* File Status Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">File Status Distribution</h3>
                <div className="h-64">
                  <Doughnut data={getStatusDistributionData()} options={chartOptions} />
                </div>
              </div>

              {/* Document Type Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Type Distribution</h3>
                <div className="h-64">
                  <Doughnut data={getDocumentTypeData()} options={chartOptions} />
                </div>
              </div>

              {/* Requirement Status */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Requirement Status</h3>
                <div className="h-64">
                  <Doughnut data={getRequirementStatusData()} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Additional Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* System Variables Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Variables Distribution</h3>
                <div className="h-64">
                  <Doughnut data={getSystemVariablesData()} options={chartOptions} />
                </div>
              </div>

              {/* System Performance */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Performance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Storage Used:</span>
                      <span className="font-semibold">{formatFileSize(analyticsData.system_performance.total_storage_used)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((analyticsData.system_performance.total_storage_used / (1024 * 1024 * 100)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Average File Size:</span>
                      <span className="font-semibold">{formatFileSize(analyticsData.system_performance.average_upload_size)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Daily Submissions:</span>
                      <span className="font-semibold">{analyticsData.system_performance.daily_submissions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Header with Search */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Faculty Performance</h2>
                <p className="text-sm text-gray-500">
                  Track and monitor faculty submission performance and completion rates
                </p>
              </div>
              <input
                type="text"
                placeholder="Search faculty..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-black text-white uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left border-r border-gray-600">Faculty Name</th>
                    <th className="px-4 py-3 text-left border-r border-gray-600">Total</th>
                    <th className="px-4 py-3 text-left border-r border-gray-600">Completed</th>
                    <th className="px-4 py-3 text-left border-r border-gray-600">Pending</th>
                    <th className="px-4 py-3 text-left border-r border-gray-600">Rejected</th>
                    <th className="px-4 py-3 text-left border-gray-600">Avg File Size</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((faculty) => (
                      <tr key={faculty.faculty_id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                        <td className="px-4 py-3 font-medium text-gray-900">{faculty.faculty_name}</td>
                        <td className="px-4 py-3 text-gray-700">{faculty.total_submissions}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{faculty.completed_submissions}</td>
                        <td className="px-4 py-3 text-yellow-600 font-medium">{faculty.pending_submissions}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{faculty.rejected_submissions}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {formatFileSize(faculty.average_file_size)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500 font-medium">
                        {search ? 'No faculty found matching your search.' : 'No faculty performance data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {currentUsers.length > 0 ? (
                currentUsers.map((faculty) => (
                  <div key={faculty.faculty_id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                    <div className="mb-3">
                      <h2 className="font-semibold text-gray-800 text-lg">{faculty.faculty_name}</h2>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p className="font-medium">{faculty.total_submissions}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <p className="font-medium text-green-600">{faculty.completed_submissions}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Pending:</span>
                        <p className="font-medium text-yellow-600">{faculty.pending_submissions}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Rejected:</span>
                        <p className="font-medium text-red-600">{faculty.rejected_submissions}</p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <span className="text-gray-500">Avg File Size:</span>
                      <span className="font-medium ml-2">{formatFileSize(faculty.average_file_size)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 font-medium">
                  {search ? 'No faculty found matching your search.' : 'No faculty performance data available.'}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
              <div className="text-sm text-gray-600">
                Showing {currentUsers.length} of {filteredUsers.length} faculty
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
          </div>
        )}

        {!analyticsData && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Analytics Data</h3>
            <p className="text-gray-600">Analytics data will appear here once the system has collected sufficient information.</p>
            <button
              onClick={fetchAnalyticsData}
              className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors"
            >
              Retry Loading Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}