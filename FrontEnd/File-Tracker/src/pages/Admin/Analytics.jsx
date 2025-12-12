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
import { Filter, ArrowUpDown, Calendar } from 'lucide-react';

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
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [dateRangeMode, setDateRangeMode] = useState('year');
  const [selectedYear, setSelectedYear] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // Calendar states
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startCurrentMonth, setStartCurrentMonth] = useState(new Date());
  const [endCurrentMonth, setEndCurrentMonth] = useState(new Date());
  
  // Performance 
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch available years
  const fetchAvailableYears = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/available-years`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailableYears(result.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching available years:", error);
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `${API_BASE_URL}/api/admin/analytics?`;
      let facultyUrl = `${API_BASE_URL}/api/admin/analytics/faculty-performance?`;
      
      if (dateRangeMode === 'year') {
        if (selectedYear && selectedYear !== "all") {
          url += `year=${selectedYear}`;
          facultyUrl += `year=${selectedYear}`;
        }
        // If selectedYear is "all", don't add any year parameter (will get overall data)
      } else if (dateRangeMode === 'custom' && startDate && endDate) {
        // Format dates to YYYY-MM-DD
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        url += `startDate=${startStr}&endDate=${endStr}`;
        facultyUrl += `startDate=${startStr}&endDate=${endStr}`;
      }
  
      const [analyticsRes, facultyRes] = await Promise.all([
        fetch(url),
        fetch(facultyUrl)
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
    fetchAvailableYears();
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedYear, startDate, endDate, dateRangeMode]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedYear("all");
    setStartDate(null);
    setEndDate(null);
    setDateRangeMode('year');
    setCurrentPage(1);
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

  // 1. User Distribution (Admin vs Faculty)
  const getUserDistributionData = () => ({
    labels: ['Admin', 'Faculty'],
    datasets: [
      {
        data: [
          analyticsData?.user_management?.admin_count || 0,
          analyticsData?.user_management?.faculty_count || 0
        ],
        backgroundColor: ['#4F46E5', '#10B981'],
        borderColor: ['#4F46E5', '#10B981'],
        borderWidth: 2,
      },
    ],
  });

  // 2. Online Status Distribution (Online vs Offline)
  const getOnlineStatusData = () => ({
    labels: ['Online', 'Offline'],
    datasets: [
      {
        data: [
          analyticsData?.user_management?.online_status_distribution?.online || 0,
          analyticsData?.user_management?.online_status_distribution?.offline || 0
        ],
        backgroundColor: ['#10B981', '#6B7280'],
        borderColor: ['#10B981', '#6B7280'],
        borderWidth: 2,
      },
    ],
  });

  // 3. File Status Distribution
  const getStatusDistributionData = () => ({
    labels: ['Pending', 'Completed', 'Rejected'],
    datasets: [
      {
        data: [
          analyticsData?.file_management?.pending_files || 0,
          analyticsData?.file_management?.completed_files || 0,
          analyticsData?.file_management?.rejected_files || 0
        ],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderWidth: 2,
      },
    ],
  });

  // 4. Document Type Distribution
  const getDocumentTypeData = () => {
    const documentTypes = analyticsData?.file_management?.document_type_distribution || {};
    
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

  // 5. Admin Notice Document Type Distribution with All Files
  const getAdminNoticeDocTypeData = () => {
    const documentTypes = analyticsData?.admin_notice_management?.document_type_distribution || {};
    
    const labels = [
      'Syllabus',
      'TOS Midterm',
      'TOS Final',
      'Midterm Exam',
      'Final Exam',
      'Instructional Materials',
      'All Files'
    ];

    const data = [
      documentTypes.syllabus || 0,
      documentTypes['tos-midterm'] || 0,
      documentTypes['tos-final'] || 0,
      documentTypes['midterm-exam'] || 0,
      documentTypes['final-exam'] || 0,
      documentTypes['instructional-materials'] || 0,
      documentTypes['all-files'] || 0
    ];

    const backgroundColors = [
      '#4F46E5', // Indigo - Syllabus
      '#10B981', // Emerald - TOS Midterm
      '#0EA5E9', // Sky - TOS Final
      '#F59E0B', // Amber - Midterm Exam
      '#EF4444', // Red - Final Exam
      '#8B5CF6', // Violet - Instructional Materials
      '#6B7280', // Gray - All Files
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

  // 6. Admin Notice Status Distribution
  const getAdminNoticeStatusData = () => ({
    labels: ['Overdue', 'Not Overdue'],
    datasets: [
      {
        data: [
          analyticsData?.admin_notice_management?.overdue_notices || 0,
          analyticsData?.admin_notice_management?.not_overdue_notices || 0
        ],
        backgroundColor: ['#EF4444', '#10B981'],
        borderColor: ['#EF4444', '#10B981'],
        borderWidth: 2,
      },
    ],
  });

  // 7. System Variables Distribution
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

  // 8. Semester Distribution Chart - NEW
  const getSemesterDistributionData = () => {
    const semesterDist = analyticsData?.file_management?.semester_distribution || {
      '1st_semester': 0,
      '2nd_semester': 0,
      'summer': 0
    };
    
    const labels = ['1st Semester', '2nd Semester', 'Summer'];
    const data = [
      semesterDist['1st_semester'] || 0,
      semesterDist['2nd_semester'] || 0,
      semesterDist['summer'] || 0
    ];

    const backgroundColors = [
      '#4F46E5', // Indigo - 1st Semester
      '#10B981', // Emerald - 2nd Semester
      '#F59E0B'  // Amber - Summer
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

  // Custom Calendar Component
  const CustomCalendar = ({ 
    selectedDate, 
    onDateChange, 
    showCalendar, 
    setShowCalendar, 
    currentMonth, 
    setCurrentMonth 
  }) => {
    const handleDateClick = (date) => {
      onDateChange(date);
      setShowCalendar(false);
    };

    const handlePrevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const generateCalendar = () => {
      const today = new Date();
      const currentYear = currentMonth.getFullYear();
      const currentMonthIndex = currentMonth.getMonth();
      
      const firstDay = new Date(currentYear, currentMonthIndex, 1);
      const lastDay = new Date(currentYear, currentMonthIndex + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      const days = [];
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      
      return (
        <div className="absolute z-50 mt-1 p-4 bg-white border border-gray-300 rounded-lg shadow-lg w-64">
          <div className="flex justify-between items-center mb-2">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded"
              type="button"
            >
              ←
            </button>
            <span className="font-semibold">
              {new Date(currentYear, currentMonthIndex).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded"
              type="button"
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
              const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const date = new Date(dateStr);
              const isToday = day === today.getDate() && currentMonthIndex === today.getMonth();
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
              
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(date)}
                  className={`h-8 w-8 flex items-center justify-center text-sm rounded-full ${
                    isSelected 
                      ? 'bg-black text-white' 
                      : isToday 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'hover:bg-gray-100'
                  }`}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t">
            <input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateClick(new Date(e.target.value))}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        </div>
      );
    };

    return showCalendar ? generateCalendar() : null;
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header - UPDATED STRUCTURE */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics </h1>
            <p className="text-sm text-gray-500">
              Comprehensive insights across all system modules and performance metrics
            </p>
            {error && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800 text-sm">{error}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
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
        </div>

        {/* Show Filters Button - MOVED BELOW HEADER LIKE FACULTY LOAD */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full md:w-auto"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {showFilters && (
              <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>

          {/* Filtering Options - MOVED TO SHOW BELOW THE BUTTON */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 w-full mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date Range Mode Toggle */}
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date Range Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDateRangeMode('year')}
                      className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                        dateRangeMode === 'year' 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      By Year
                    </button>
                    <button
                      onClick={() => setDateRangeMode('custom')}
                      className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                        dateRangeMode === 'custom' 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Date Range
                    </button>
                  </div>
                </div>

                {/* Year Filter */}
                {dateRangeMode === 'year' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="all">All Years (Overall)</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Custom Date Range */}
                {dateRangeMode === 'custom' && (
                  <>
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={startDate ? formatDate(startDate) : ''}
                          readOnly
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                          placeholder="Select start date"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowStartCalendar(!showStartCalendar);
                            setShowEndCalendar(false);
                          }}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                      <CustomCalendar
                        selectedDate={startDate}
                        onDateChange={setStartDate}
                        showCalendar={showStartCalendar}
                        setShowCalendar={setShowStartCalendar}
                        currentMonth={startCurrentMonth}
                        setCurrentMonth={setStartCurrentMonth}
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={endDate ? formatDate(endDate) : ''}
                          readOnly
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                          placeholder="Select end date"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowEndCalendar(!showEndCalendar);
                            setShowStartCalendar(false);
                          }}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                      <CustomCalendar
                        selectedDate={endDate}
                        onDateChange={setEndDate}
                        showCalendar={showEndCalendar}
                        setShowCalendar={setShowEndCalendar}
                        currentMonth={endCurrentMonth}
                        setCurrentMonth={setEndCurrentMonth}
                      />
                    </div>
                  </>
                )}

                {/* Reset Button */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors w-full"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Filter Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="col-span-1">
                  <span className="text-xs text-gray-500">
                    Currently viewing data for:{" "}
                    <span className="font-medium text-gray-700">
                      {dateRangeMode === 'year' 
                        ? selectedYear === "all" 
                          ? "All Years (Overall)" 
                          : `Year ${selectedYear}`
                        : startDate && endDate 
                          ? `${formatDate(startDate)} to ${formatDate(endDate)}`
                          : 'Please select date range'
                      }
                    </span>
                  </span>
                </div>
                
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">
                      Mode: {dateRangeMode === 'year' ? 'By Year' : 'Custom Range'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date Range Display */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Currently viewing data for: </span>
              <span className="font-medium">
                {dateRangeMode === 'year' 
                  ? selectedYear === "all" 
                    ? "All Years (Overall)" 
                    : `Year ${selectedYear}`
                  : startDate && endDate 
                    ? `${formatDate(startDate)} to ${formatDate(endDate)}`
                    : 'Please select date range'
                }
              </span>
            </div>
            {analyticsData?.filters && (
              <div className="text-sm text-gray-500">
                Data generated on {formatDate(new Date())}
              </div>
            )}
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
                {analyticsData?.file_management?.completed_files || 0} of {analyticsData?.file_management?.total_files || 0} files
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium">Active Users</div>
              <div className="text-2xl font-bold text-purple-800">
                {analyticsData?.user_management?.active_rate || 0}%
              </div>
              <div className="text-sm text-purple-600 mt-1">
                {analyticsData?.user_management?.online_users || 0} online users
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-orange-600 text-sm font-medium">Total Records</div>
              <div className="text-2xl font-bold text-orange-800">
                {analyticsData?.summary?.total_records?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-orange-600 mt-1">
                Across all modules
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && analyticsData && (
          <div className="space-y-8">
            {/* Module Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* User Management Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">User Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users:</span>
                    <span className="font-semibold">{analyticsData?.user_management?.total_users || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Online:</span>
                    <span className="font-semibold text-green-600">{analyticsData?.user_management?.online_users || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Offline:</span>
                    <span className="font-semibold text-gray-600">{analyticsData?.user_management?.offline_users || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admins:</span>
                    <span className="font-semibold">{analyticsData?.user_management?.admin_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Faculty:</span>
                    <span className="font-semibold">{analyticsData?.user_management?.faculty_count || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Based on created_at field
                  </div>
                </div>
              </div>

              {/* File Management Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">File Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Files:</span>
                    <span className="font-semibold">{analyticsData?.file_management?.total_files || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-semibold text-green-600">{analyticsData?.file_management?.completed_files || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-yellow-600">{analyticsData?.file_management?.pending_files || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rejected:</span>
                    <span className="font-semibold text-red-600">{analyticsData?.file_management?.rejected_files || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Based on uploaded_at field
                  </div>
                </div>
              </div>

              {/* Admin Notice Card - UPDATED */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Notice</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Notices:</span>
                    <span className="font-semibold">{analyticsData?.admin_notice_management?.total_notices || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Syllabus:</span>
                    <span className="font-semibold text-blue-600">{analyticsData?.admin_notice_management?.document_type_distribution?.syllabus || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TOS Midterm:</span>
                    <span className="font-semibold text-green-600">{analyticsData?.admin_notice_management?.document_type_distribution?.['tos-midterm'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TOS Final:</span>
                    <span className="font-semibold text-green-600">{analyticsData?.admin_notice_management?.document_type_distribution?.['tos-final'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Midterm Exam:</span>
                    <span className="font-semibold text-yellow-600">{analyticsData?.admin_notice_management?.document_type_distribution?.['midterm-exam'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Final Exam:</span>
                    <span className="font-semibold text-red-600">{analyticsData?.admin_notice_management?.document_type_distribution?.['final-exam'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Instructional Materials:</span>
                    <span className="font-semibold text-purple-600">{analyticsData?.admin_notice_management?.document_type_distribution?.['instructional-materials'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">All Files:</span>
                    <span className="font-semibold text-gray-800">{analyticsData?.admin_notice_management?.document_type_distribution?.['all-files'] || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Based on created_at field
                  </div>
                </div>
              </div>

              {/* System Variables Card */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Variables</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Variables:</span>
                    <span className="font-semibold">{analyticsData?.system_variables?.total_variables || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject Codes:</span>
                    <span className="font-semibold text-purple-600">{analyticsData?.system_variables?.variable_type_distribution?.subject_code || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course Sections:</span>
                    <span className="font-semibold text-green-600">{analyticsData?.system_variables?.variable_type_distribution?.course_section || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Academic Years:</span>
                    <span className="font-semibold text-yellow-600">{analyticsData?.system_variables?.variable_type_distribution?.academic_year || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Semesters:</span>
                    <span className="font-semibold text-red-600">{analyticsData?.system_variables?.variable_type_distribution?.semester || 0}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Based on created_at field
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. User Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">User Role Distribution</h3>
                <div className="h-64">
                  <Doughnut data={getUserDistributionData()} options={chartOptions} />
                </div>
              </div>

              {/* 2. Online Status Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">User Status Distribution</h3>
                <div className="h-64">
                  <Doughnut data={getOnlineStatusData()} options={chartOptions} />
                </div>
              </div>

              {/* 3. File Status Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">File Status Distribution</h3>
                <div className="h-64">
                  <Doughnut data={getStatusDistributionData()} options={chartOptions} />
                </div>
              </div>

              {/* 4. Document Type Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Type Distribution</h3>
                <div className="h-64">
                  <Doughnut data={getDocumentTypeData()} options={chartOptions} />
                </div>
              </div>

              {/* 5. Semester Distribution - NEW */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Semester Distribution</h3>
                <div className="h-64">
                  <Doughnut data={getSemesterDistributionData()} options={chartOptions} />
                </div>
              </div>

              {/* 6. Admin Notice Document Types */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Notice Document Types</h3>
                <div className="h-64">
                  <Doughnut data={getAdminNoticeDocTypeData()} options={chartOptions} />
                </div>
              </div>

              {/* 7. Admin Notice Status */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Notice Status</h3>
                <div className="h-64">
                  <Doughnut data={getAdminNoticeStatusData()} options={chartOptions} />
                </div>
              </div>

              {/* 8. System Variables Distribution */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Variables</h3>
                <div className="h-64">
                  <Doughnut data={getSystemVariablesData()} options={chartOptions} />
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
                    <th className="px-4 py-3 text-left border-r border-gray-600">Completion Rate</th>
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
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(faculty.completion_rate || 0, 100)}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs font-medium">{Math.round(faculty.completion_rate || 0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {formatFileSize(faculty.average_file_size)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500 font-medium">
                        {search ? 'No faculty found matching your search.' : 'No faculty performance data available for the selected period.'}
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

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Completion Rate:</span>
                        <span className="font-medium">{Math.round(faculty.completion_rate || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(faculty.completion_rate || 0, 100)}%` }}
                        ></div>
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
                  {search ? 'No faculty found matching your search.' : 'No faculty performance data available for the selected period.'}
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