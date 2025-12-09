// controllers/AdminController/AnalyticsController.js
import Analytics from "../../models/AdminModel/AnalyticsModel.js";
import User from "../../models/AdminModel/UserManagementModel.js";
import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import AdminNotice from "../../models/AdminModel/AdminNoticeModel.js";
import Admin from "../../models/AdminModel/AdminModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";
import SystemVariable from "../../models/AdminModel/SystemVariableModel.js";

// Get comprehensive analytics data with date filtering
export const getAnalyticsData = async (req, res) => {
  try {
    console.log("Analytics endpoint hit");
    
    // Get date range from query parameters
    const { startDate, endDate, year } = req.query;
    let dateFilter = {};
    
    // If year is provided, filter by year
    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      endOfYear.setHours(23, 59, 59, 999);
      dateFilter = {
        created_at: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
    }
    
    // If specific date range is provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = {
        created_at: {
          $gte: start,
          $lte: end
        }
      };
    }

    // Get user statistics from combined Admin and Faculty models
    const admins = await Admin.countDocuments();
    const faculties = await Faculty.countDocuments();
    const onlineAdmins = await Admin.countDocuments({ status: 'online' });
    const onlineFaculties = await Faculty.countDocuments({ status: 'online' });

    const totalUsers = admins + faculties;
    const onlineUsers = onlineAdmins + onlineFaculties;
    const offlineUsers = totalUsers - onlineUsers;
    const activeRate = totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0;

    // Get file management statistics with date filter
    const fileFilter = dateFilter.created_at ? { uploaded_at: dateFilter.created_at } : {};
    const totalFiles = await FileManagement.countDocuments(fileFilter);
    const pendingFiles = await FileManagement.countDocuments({ ...fileFilter, status: 'pending' });
    const completedFiles = await FileManagement.countDocuments({ ...fileFilter, status: 'completed' });
    const rejectedFiles = await FileManagement.countDocuments({ ...fileFilter, status: 'rejected' });

    // Get semester distribution from files
    const semesterDistribution = await FileManagement.aggregate([
      { $match: fileFilter },
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert semester distribution to object format
    const semesterDist = {
      '1st_semester': 0,
      '2nd_semester': 0,
      'summer': 0
    };

    semesterDistribution.forEach(item => {
      const semesterKey = item._id?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (semesterDist.hasOwnProperty(semesterKey)) {
        semesterDist[semesterKey] = item.count;
      }
    });

    // Get admin notice statistics with date filter
    const noticeFilter = dateFilter.created_at ? { created_at: dateFilter.created_at } : {};
    const totalNotices = await AdminNotice.countDocuments(noticeFilter);
    const overdueNotices = await AdminNotice.countDocuments({
      ...noticeFilter,
      due_date: { $lt: new Date() }
    });
    const notOverdueNotices = totalNotices - overdueNotices;
    const noticeCompletionRate = totalNotices > 0 ? 
      Math.round(((totalNotices - overdueNotices) / totalNotices) * 100) : 0;

    // Get admin notice document type distribution
    const adminNoticeDocDistribution = await AdminNotice.aggregate([
      { $match: noticeFilter },
      {
        $group: {
          _id: '$document_type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert admin notice document type distribution to object format
    const adminNoticeDocDist = {
      syllabus: 0,
      'tos-midterm': 0,
      'tos-final': 0,
      'midterm-exam': 0,
      'final-exam': 0,
      'instructional-materials': 0
    };

    adminNoticeDocDistribution.forEach(item => {
      if (adminNoticeDocDist.hasOwnProperty(item._id)) {
        adminNoticeDocDist[item._id] = item.count;
      }
    });

    // Get system variables statistics
    const totalVariables = await SystemVariable.countDocuments();
    const variableTypeDistribution = await SystemVariable.aggregate([
      {
        $group: {
          _id: '$variable_type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get document type distributions from FileManagement
    const documentTypeDistribution = await FileManagement.aggregate([
      { $match: fileFilter },
      {
        $group: {
          _id: '$document_type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert aggregation results to object format
    const documentTypeDist = {
      syllabus: 0,
      'tos-midterm': 0,
      'tos-final': 0,
      'midterm-exam': 0,
      'final-exam': 0,
      'instructional-materials': 0
    };

    documentTypeDistribution.forEach(item => {
      if (documentTypeDist.hasOwnProperty(item._id)) {
        documentTypeDist[item._id] = item.count;
      }
    });

    const variableTypeDist = {
      subject_code: 0,
      course_section: 0,
      academic_year: 0,
      semester: 0
    };
    variableTypeDistribution.forEach(item => {
      if (variableTypeDist.hasOwnProperty(item._id)) {
        variableTypeDist[item._id] = item.count;
      }
    });

    // Calculate system health
    const fileCompletionRate = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
    
    const systemHealth = calculateSystemHealth(
      activeRate,
      completedFiles,
      totalFiles,
      overdueNotices
    );

    // Prepare response data
    const analyticsData = {
      user_management: {
        total_users: totalUsers,
        online_users: onlineUsers,
        offline_users: offlineUsers,
        admin_count: admins,
        faculty_count: faculties,
        active_rate: activeRate,
        online_status_distribution: {
          online: onlineUsers,
          offline: offlineUsers
        }
      },
      file_management: {
        total_files: totalFiles,
        pending_files: pendingFiles,
        completed_files: completedFiles,
        rejected_files: rejectedFiles,
        document_type_distribution: documentTypeDist,
        semester_distribution: semesterDist
      },
      admin_notice_management: {
        total_notices: totalNotices,
        overdue_notices: overdueNotices,
        not_overdue_notices: notOverdueNotices,
        completion_rate: noticeCompletionRate,
        document_type_distribution: adminNoticeDocDist
      },
      system_variables: {
        total_variables: totalVariables,
        variable_type_distribution: variableTypeDist
      },
      summary: {
        total_records: totalUsers + totalFiles + totalNotices + totalVariables,
        completion_rate: fileCompletionRate,
        system_health: systemHealth
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        year: year || null
      }
    };

    res.status(200).json({
      success: true,
      data: analyticsData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics data",
      error: error.message
    });
  }
};

// Get faculty performance analytics with date filtering
export const getFacultyPerformance = async (req, res) => {
  try {
    console.log("Faculty performance endpoint hit");

    const { startDate, endDate, year } = req.query;
    let dateFilter = {};
    
    // If year is provided, filter by year
    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      endOfYear.setHours(23, 59, 59, 999);
      dateFilter = {
        uploaded_at: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
    }
    
    // If specific date range is provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = {
        uploaded_at: {
          $gte: start,
          $lte: end
        }
      };
    }

    const facultyPerformance = await FileManagement.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$faculty_id",
          faculty_name: { $first: "$faculty_name" },
          total_submissions: { $sum: 1 },
          completed_submissions: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          pending_submissions: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          rejected_submissions: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
          },
          average_file_size: { $avg: "$file_size" },
          last_submission: { $max: "$uploaded_at" }
        }
      },
      {
        $addFields: {
          completion_rate: {
            $cond: [
              { $eq: ["$total_submissions", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$completed_submissions", "$total_submissions"] },
                  100
                ]
              }
            ]
          }
        }
      },
      {
        $sort: { completion_rate: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: facultyPerformance,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        year: year || null
      }
    });

  } catch (error) {
    console.error("Error fetching faculty performance:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching faculty performance",
      error: error.message
    });
  }
};

// Get available years for analytics
export const getAvailableYears = async (req, res) => {
  try {
    // Get distinct years from FileManagement
    const fileYears = await FileManagement.aggregate([
      {
        $group: {
          _id: { $year: "$uploaded_at" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get distinct years from AdminNotice
    const noticeYears = await AdminNotice.aggregate([
      {
        $group: {
          _id: { $year: "$created_at" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Combine and deduplicate years
    const allYears = [...new Set([
      ...fileYears.map(item => item._id),
      ...noticeYears.map(item => item._id),
      new Date().getFullYear() // Include current year
    ])].sort((a, b) => b - a);

    res.status(200).json({
      success: true,
      data: allYears
    });
  } catch (error) {
    console.error("Error fetching available years:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching available years",
      error: error.message
    });
  }
};

// Helper function to calculate system health
const calculateSystemHealth = (activeRate, completedFiles, totalFiles, overdueNotices) => {
  let healthScore = 0;
  
  // Active rate contributes 30%
  healthScore += (activeRate / 100) * 30;
  
  // Completion rate contributes 40%
  const completionRate = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  healthScore += (completionRate / 100) * 40;
  
  // Overdue notices penalty (30% base - deductions)
  const overduePenalty = Math.min(overdueNotices * 2, 30);
  healthScore += (30 - overduePenalty);
  
  return Math.min(Math.round(healthScore), 100);
};

// Export functions
export default {
  getAnalyticsData,
  getFacultyPerformance,
  getAvailableYears
};