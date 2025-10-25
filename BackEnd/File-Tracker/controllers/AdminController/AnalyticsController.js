import Analytics from "../../models/AdminModel/AnalyticsModel.js";
import User from "../../models/AdminModel/UserManagementModel.js";
import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import AdminDeliverables from "../../models/AdminModel/AdminDeliverablesModel.js";
import Requirement from "../../models/AdminModel/RequirementModel.js";
import Admin from "../../models/AdminModel/AdminModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";

// Get comprehensive analytics data
export const getAnalyticsData = async (req, res) => {
  try {
    console.log("📊 Analytics endpoint hit");
    
    // Get user statistics from combined Admin and Faculty models
    const admins = await Admin.countDocuments();
    const faculties = await Faculty.countDocuments();
    const onlineAdmins = await Admin.countDocuments({ status: 'online' });
    const onlineFaculties = await Faculty.countDocuments({ status: 'online' });

    const totalUsers = admins + faculties;
    const onlineUsers = onlineAdmins + onlineFaculties;
    const activeRate = totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0;

    // Get file management statistics
    const totalFiles = await FileManagement.countDocuments();
    const pendingFiles = await FileManagement.countDocuments({ status: 'pending' });
    const completedFiles = await FileManagement.countDocuments({ status: 'completed' });
    const rejectedFiles = await FileManagement.countDocuments({ status: 'rejected' });

    // Get deliverable statistics
    const totalDeliverables = await AdminDeliverables.countDocuments();
    const pendingDeliverables = await AdminDeliverables.countDocuments({ status: 'pending' });
    const completedDeliverables = await AdminDeliverables.countDocuments({ status: 'completed' });
    const rejectedDeliverables = await AdminDeliverables.countDocuments({ status: 'rejected' });

    // Get requirement statistics
    const totalRequirements = await Requirement.countDocuments();
    const overdueRequirements = await Requirement.countDocuments({
      due_date: { $lt: new Date() }
    });

    // Get file type distributions
    const fileTypeDistribution = await FileManagement.aggregate([
      {
        $group: {
          _id: '$file_type',
          count: { $sum: 1 }
        }
      }
    ]);

    const deliverableTypeDistribution = await AdminDeliverables.aggregate([
      {
        $group: {
          _id: '$file_type',
          count: { $sum: 1 }
        }
      }
    ]);

    const requirementTypeDistribution = await Requirement.aggregate([
      {
        $group: {
          _id: '$file_type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert aggregation results to object format
    const fileTypeDist = {};
    fileTypeDistribution.forEach(item => {
      fileTypeDist[item._id] = item.count;
    });

    const deliverableTypeDist = {};
    deliverableTypeDistribution.forEach(item => {
      deliverableTypeDist[item._id] = item.count;
    });

    const requirementTypeDist = {};
    requirementTypeDistribution.forEach(item => {
      requirementTypeDist[item._id] = item.count;
    });

    // Get storage stats
    const storageStats = await FileManagement.aggregate([
      {
        $group: {
          _id: null,
          totalStorage: { $sum: '$file_size' },
          avgFileSize: { $avg: '$file_size' }
        }
      }
    ]);

    const dailySubmissions = await FileManagement.countDocuments({
      uploaded_at: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const storageData = storageStats[0] || { totalStorage: 0, avgFileSize: 0 };

    // Calculate system health
    const completionRate = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
    
    const systemHealth = calculateSystemHealth(
      activeRate,
      completedFiles,
      totalFiles,
      overdueRequirements
    );

    // Prepare response data
    const analyticsData = {
      user_management: {
        total_users: totalUsers,
        online_users: onlineUsers,
        offline_users: totalUsers - onlineUsers,
        admin_count: admins,
        faculty_count: faculties,
        active_rate: activeRate
      },
      file_management: {
        total_files: totalFiles,
        pending_files: pendingFiles,
        completed_files: completedFiles,
        rejected_files: rejectedFiles,
        file_type_distribution: fileTypeDist
      },
      admin_deliverables: {
        total_deliverables: totalDeliverables,
        pending_deliverables: pendingDeliverables,
        completed_deliverables: completedDeliverables,
        rejected_deliverables: rejectedDeliverables,
        deliverable_type_distribution: deliverableTypeDist
      },
      requirement_management: {
        total_requirements: totalRequirements,
        requirement_type_distribution: requirementTypeDist,
        overdue_requirements: overdueRequirements
      },
      system_performance: {
        total_storage_used: storageData.totalStorage,
        average_upload_size: storageData.avgFileSize,
        daily_submissions: dailySubmissions,
        storage_efficiency: totalFiles > 0 ? (storageData.totalStorage / totalFiles) : 0
      },
      summary: {
        total_records: totalUsers + totalFiles + totalDeliverables + totalRequirements,
        completion_rate: completionRate,
        system_health: systemHealth
      }
    };

    // Log analytics data for debugging
    console.log("📊 Analytics Data Summary:", {
      totalUsers,
      onlineUsers,
      admins,
      faculties,
      totalFiles,
      completedFiles,
      systemHealth
    });

    res.status(200).json({
      success: true,
      data: analyticsData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error fetching analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics data",
      error: error.message
    });
  }
};

// Get analytics trends
export const getAnalyticsTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    console.log(`📈 Trends endpoint hit for ${days} days`);

    // Get user registration trends from both Admin and Faculty
    const adminTrends = await Admin.aggregate([
      {
        $match: {
          registeredAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$registeredAt" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const facultyTrends = await Faculty.aggregate([
      {
        $match: {
          registeredAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$registeredAt" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Combine admin and faculty trends
    const userTrendsMap = new Map();

    // Add admin trends
    adminTrends.forEach(trend => {
      userTrendsMap.set(trend._id, (userTrendsMap.get(trend._id) || 0) + trend.count);
    });

    // Add faculty trends
    facultyTrends.forEach(trend => {
      userTrendsMap.set(trend._id, (userTrendsMap.get(trend._id) || 0) + trend.count);
    });

    // Convert back to array and sort
    const userTrends = Array.from(userTrendsMap, ([_id, count]) => ({ _id, count }))
      .sort((a, b) => a._id.localeCompare(b._id));

    // Get file submission trends
    const fileTrends = await FileManagement.aggregate([
      {
        $match: {
          uploaded_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$uploaded_at" }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get deliverable trends
    const deliverableTrends = await AdminDeliverables.aggregate([
      {
        $match: {
          date_submitted: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date_submitted" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        user_trends: userTrends,
        file_trends: fileTrends,
        deliverable_trends: deliverableTrends
      },
      period: `${days} days`
    });

  } catch (error) {
    console.error("❌ Error fetching analytics trends:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics trends",
      error: error.message
    });
  }
};

// Get faculty performance analytics
export const getFacultyPerformance = async (req, res) => {
  try {
    console.log("👨‍🏫 Faculty performance endpoint hit");

    const facultyPerformance = await FileManagement.aggregate([
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
      data: facultyPerformance
    });

  } catch (error) {
    console.error("❌ Error fetching faculty performance:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching faculty performance",
      error: error.message
    });
  }
};

// Get system overview with real-time data
export const getSystemOverview = async (req, res) => {
  try {
    console.log("🖥️ System overview endpoint hit");

    // Get real-time user status
    const onlineAdmins = await Admin.countDocuments({ status: 'online' });
    const onlineFaculties = await Faculty.countDocuments({ status: 'online' });
    const totalOnline = onlineAdmins + onlineFaculties;

    // Get recent activities
    const recentFiles = await FileManagement.find()
      .sort({ uploaded_at: -1 })
      .limit(5)
      .select('file_name faculty_name status uploaded_at');

    const recentDeliverables = await AdminDeliverables.find()
      .sort({ date_submitted: -1 })
      .limit(5)
      .select('file_name faculty_name status date_submitted');

    // Get system metrics
    const totalStorage = await FileManagement.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$file_size' }
        }
      }
    ]);

    const fileStatusDistribution = await FileManagement.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const systemOverview = {
      online_users: totalOnline,
      recent_activities: {
        files: recentFiles,
        deliverables: recentDeliverables
      },
      storage_usage: totalStorage[0]?.total || 0,
      file_status: fileStatusDistribution.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: systemOverview
    });

  } catch (error) {
    console.error("❌ Error fetching system overview:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching system overview",
      error: error.message
    });
  }
};

// Store analytics snapshot
export const storeAnalyticsSnapshot = async (req, res) => {
  try {
    const { period = 'daily' } = req.body;

    // Get current analytics data
    const admins = await Admin.countDocuments();
    const faculties = await Faculty.countDocuments();
    const onlineAdmins = await Admin.countDocuments({ status: 'online' });
    const onlineFaculties = await Faculty.countDocuments({ status: 'online' });

    const totalUsers = admins + faculties;
    const onlineUsers = onlineAdmins + onlineFaculties;

    const totalFiles = await FileManagement.countDocuments();
    const pendingFiles = await FileManagement.countDocuments({ status: 'pending' });
    const completedFiles = await FileManagement.countDocuments({ status: 'completed' });
    const rejectedFiles = await FileManagement.countDocuments({ status: 'rejected' });

    const totalDeliverables = await AdminDeliverables.countDocuments();
    const totalRequirements = await Requirement.countDocuments();

    const storageStats = await FileManagement.aggregate([
      {
        $group: {
          _id: null,
          totalStorage: { $sum: '$file_size' }
        }
      }
    ]);

    // Generate analytics ID
    const generateAnalyticsId = () => {
      return 'ANL' + Math.floor(100000 + Math.random() * 900000).toString();
    };

    const newAnalytics = new Analytics({
      analytics_id: generateAnalyticsId(),
      period: period,
      date: new Date(),
      user_stats: {
        total_users: totalUsers,
        online_users: onlineUsers,
        offline_users: totalUsers - onlineUsers,
        admin_count: admins,
        faculty_count: faculties,
        active_rate: totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0
      },
      file_stats: {
        total_files: totalFiles,
        pending_files: pendingFiles,
        completed_files: completedFiles,
        rejected_files: rejectedFiles
      },
      deliverable_stats: {
        total_deliverables: totalDeliverables
      },
      requirement_stats: {
        total_requirements: totalRequirements
      },
      system_stats: {
        total_storage_used: storageStats[0]?.totalStorage || 0,
        daily_submissions: totalFiles
      }
    });

    await newAnalytics.save();

    res.status(201).json({
      success: true,
      message: "Analytics snapshot stored successfully",
      data: newAnalytics
    });

  } catch (error) {
    console.error("❌ Error storing analytics snapshot:", error);
    res.status(500).json({
      success: false,
      message: "Server error while storing analytics snapshot",
      error: error.message
    });
  }
};

// Get analytics by date range
export const getAnalyticsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of the day

    // Get files within date range
    const filesInRange = await FileManagement.countDocuments({
      uploaded_at: { $gte: start, $lte: end }
    });

    const completedFilesInRange = await FileManagement.countDocuments({
      uploaded_at: { $gte: start, $lte: end },
      status: 'completed'
    });

    const deliverablesInRange = await AdminDeliverables.countDocuments({
      date_submitted: { $gte: start, $lte: end }
    });

    // Get user registrations in range
    const adminRegistrations = await Admin.countDocuments({
      registeredAt: { $gte: start, $lte: end }
    });

    const facultyRegistrations = await Faculty.countDocuments({
      registeredAt: { $gte: start, $lte: end }
    });

    const dateRangeData = {
      date_range: {
        start: startDate,
        end: endDate
      },
      files: {
        total: filesInRange,
        completed: completedFilesInRange,
        completion_rate: filesInRange > 0 ? Math.round((completedFilesInRange / filesInRange) * 100) : 0
      },
      deliverables: {
        total: deliverablesInRange
      },
      user_registrations: {
        admins: adminRegistrations,
        faculty: facultyRegistrations,
        total: adminRegistrations + facultyRegistrations
      }
    };

    res.status(200).json({
      success: true,
      data: dateRangeData
    });

  } catch (error) {
    console.error("❌ Error fetching analytics by date range:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching date range analytics",
      error: error.message
    });
  }
};

// Helper function to calculate system health
const calculateSystemHealth = (activeRate, completedFiles, totalFiles, overdueRequirements) => {
  let healthScore = 0;
  
  // Active rate contributes 30%
  healthScore += (activeRate / 100) * 30;
  
  // Completion rate contributes 40%
  const completionRate = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  healthScore += (completionRate / 100) * 40;
  
  // Overdue requirements penalty (30% base - deductions)
  const overduePenalty = Math.min(overdueRequirements * 2, 30);
  healthScore += (30 - overduePenalty);
  
  return Math.min(Math.round(healthScore), 100);
};

// Export all functions
export default {
  getAnalyticsData,
  getAnalyticsTrends,
  getFacultyPerformance,
  getSystemOverview,
  storeAnalyticsSnapshot,
  getAnalyticsByDateRange
};