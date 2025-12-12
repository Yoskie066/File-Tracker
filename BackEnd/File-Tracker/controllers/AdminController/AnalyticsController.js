import Analytics from "../../models/AdminModel/AnalyticsModel.js";
import User from "../../models/AdminModel/UserManagementModel.js";
import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import AdminNotice from "../../models/AdminModel/AdminNoticeModel.js";
import SystemVariable from "../../models/AdminModel/SystemVariableModel.js";

// Get comprehensive analytics data with date filtering
export const getAnalyticsData = async (req, res) => {
  try {
    console.log("Analytics endpoint hit");
    
    // Get date range from query parameters
    const { startDate, endDate, year } = req.query;
    
    // Initialize empty filters for each collection
    let userFilter = {};
    let fileFilter = {};
    let noticeFilter = {};
    let systemVariableFilter = {};

    // If year is provided, filter by year
    if (year && year !== "all") {
      const startOfYear = new Date(`${year}-01-01`);
      startOfYear.setUTCHours(0, 0, 0, 0);
      const endOfYear = new Date(`${year}-12-31`);
      endOfYear.setUTCHours(23, 59, 59, 999);
      
      userFilter = {
        created_at: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
      
      fileFilter = {
        uploaded_at: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
      
      noticeFilter = {
        created_at: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
      
      systemVariableFilter = {
        created_at: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
    }
    
    // If specific date range is provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      
      userFilter = {
        created_at: {
          $gte: start,
          $lte: end
        }
      };
      
      fileFilter = {
        uploaded_at: {
          $gte: start,
          $lte: end
        }
      };
      
      noticeFilter = {
        created_at: {
          $gte: start,
          $lte: end
        }
      };
      
      systemVariableFilter = {
        created_at: {
          $gte: start,
          $lte: end
        }
      };
    }

    // USER MANAGEMENT - Based on created_at from UserManagement Model
    const totalUsers = await User.countDocuments(userFilter);
    const adminCount = await User.countDocuments({ ...userFilter, role: 'admin' });
    const facultyCount = await User.countDocuments({ ...userFilter, role: 'faculty' });
    
    // For online users, we check current status (not based on created_at)
    const onlineAdmins = await User.countDocuments({ role: 'admin', status: 'online' });
    const onlineFaculties = await User.countDocuments({ role: 'faculty', status: 'online' });

    const onlineUsers = onlineAdmins + onlineFaculties;
    const offlineUsers = totalUsers - onlineUsers;
    const activeRate = totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0;

    // FILE MANAGEMENT - Based on uploaded_at from FileManagement Model
    const totalFiles = await FileManagement.countDocuments(fileFilter);
    const pendingFiles = await FileManagement.countDocuments({ ...fileFilter, status: 'pending' });
    const completedFiles = await FileManagement.countDocuments({ ...fileFilter, status: 'completed' });
    const rejectedFiles = await FileManagement.countDocuments({ ...fileFilter, status: 'rejected' });

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
      if (item._id) {
        // Normalize semester name
        const semesterKey = item._id.toLowerCase().replace(/\s+/g, '_');
        if (semesterDist.hasOwnProperty(semesterKey)) {
          semesterDist[semesterKey] = item.count;
        }
      }
    });

    // ADMIN NOTICE MANAGEMENT - Based on created_at from AdminNotice Model
    const totalNotices = await AdminNotice.countDocuments(noticeFilter);
    const overdueNotices = await AdminNotice.countDocuments({
      ...noticeFilter,
      due_date: { $lt: new Date() }
    });
    const notOverdueNotices = totalNotices - overdueNotices;
    const noticeCompletionRate = totalNotices > 0 ? 
      Math.round(((totalNotices - overdueNotices) / totalNotices) * 100) : 0;

    // Get admin notice document type distribution
    const adminNoticeData = await AdminNotice.find(noticeFilter);
    
    // Calculate admin notice document type distribution
    const adminNoticeDocDist = {
      syllabus: 0,
      'tos-midterm': 0,
      'tos-final': 0,
      'midterm-exam': 0,
      'final-exam': 0,
      'instructional-materials': 0,
      'all-files': 0
    };

    adminNoticeData.forEach(notice => {
      const docType = notice.document_type?.toLowerCase() || '';
      
      if (docType.includes('syllabus')) {
        adminNoticeDocDist.syllabus++;
      } else if (docType.includes('tos')) {
        if (notice.tos_type === 'MIDTERM TOS') {
          adminNoticeDocDist['tos-midterm']++;
        } else if (notice.tos_type === 'FINAL TOS') {
          adminNoticeDocDist['tos-final']++;
        } else if (docType.includes('midterm')) {
          adminNoticeDocDist['tos-midterm']++;
        } else if (docType.includes('final')) {
          adminNoticeDocDist['tos-final']++;
        }
      } else if (docType.includes('midterm') || docType.includes('midterm exam')) {
        adminNoticeDocDist['midterm-exam']++;
      } else if (docType.includes('final') || docType.includes('final exam')) {
        adminNoticeDocDist['final-exam']++;
      } else if (docType.includes('instructional') || docType.includes('instructional materials')) {
        adminNoticeDocDist['instructional-materials']++;
      } else if (docType.includes('all-files')) {
        adminNoticeDocDist['all-files']++;
      }
    });

    // SYSTEM VARIABLES - Based on created_at from SystemVariable Model
    const totalVariables = await SystemVariable.countDocuments(systemVariableFilter);
    const variableTypeDistribution = await SystemVariable.aggregate([
      { $match: systemVariableFilter },
      {
        $group: {
          _id: '$variable_type',
          count: { $sum: 1 }
        }
      }
    ]);

    const variableTypeDist = {
      subject_code: 0,
      course_section: 0,
      academic_year: 0,
      semester: 0
    };
    
    variableTypeDistribution.forEach(item => {
      if (item._id && variableTypeDist.hasOwnProperty(item._id)) {
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
        admin_count: adminCount,
        faculty_count: facultyCount,
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
    let fileFilter = {};
    
    // If year is provided, filter by year
    if (year && year !== "all") {
      const startOfYear = new Date(`${year}-01-01`);
      startOfYear.setUTCHours(0, 0, 0, 0);
      const endOfYear = new Date(`${year}-12-31`);
      endOfYear.setUTCHours(23, 59, 59, 999);
      fileFilter = {
        uploaded_at: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
    }
    
    // If specific date range is provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      fileFilter = {
        uploaded_at: {
          $gte: start,
          $lte: end
        }
      };
    }

    const facultyPerformance = await FileManagement.aggregate([
      { $match: fileFilter },
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
    // Get distinct years from UserManagement (created_at)
    const userYears = await User.aggregate([
      {
        $group: {
          _id: { $year: "$created_at" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get distinct years from FileManagement (uploaded_at)
    const fileYears = await FileManagement.aggregate([
      {
        $group: {
          _id: { $year: "$uploaded_at" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get distinct years from AdminNotice (created_at)
    const noticeYears = await AdminNotice.aggregate([
      {
        $group: {
          _id: { $year: "$created_at" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get distinct years from SystemVariable (created_at)
    const systemVariableYears = await SystemVariable.aggregate([
      {
        $group: {
          _id: { $year: "$created_at" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Combine and deduplicate years
    const allYears = [
      ...new Set([
        ...userYears.map(item => item._id),
        ...fileYears.map(item => item._id),
        ...noticeYears.map(item => item._id),
        ...systemVariableYears.map(item => item._id),
        new Date().getFullYear() // Include current year
      ])
    ]
    .filter(year => year !== null)
    .sort((a, b) => b - a);

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