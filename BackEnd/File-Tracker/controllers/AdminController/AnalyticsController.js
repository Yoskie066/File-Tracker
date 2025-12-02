import Analytics from "../../models/AdminModel/AnalyticsModel.js";
import User from "../../models/AdminModel/UserManagementModel.js";
import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import Requirement from "../../models/AdminModel/AdminNoticeModel.js";
import Admin from "../../models/AdminModel/AdminModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";
import SystemVariable from "../../models/AdminModel/SystemVariableModel.js";

// Get comprehensive analytics data
export const getAnalyticsData = async (req, res) => {
  try {
    console.log("Analytics endpoint hit");
    
    // Get user statistics from combined Admin and Faculty models
    const admins = await Admin.countDocuments();
    const faculties = await Faculty.countDocuments();
    const onlineAdmins = await Admin.countDocuments({ status: 'online' });
    const onlineFaculties = await Faculty.countDocuments({ status: 'online' });

    const totalUsers = admins + faculties;
    const onlineUsers = onlineAdmins + onlineFaculties;
    const offlineUsers = totalUsers - onlineUsers;
    const activeRate = totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0;

    // Get file management statistics
    const totalFiles = await FileManagement.countDocuments();
    const pendingFiles = await FileManagement.countDocuments({ status: 'pending' });
    const completedFiles = await FileManagement.countDocuments({ status: 'completed' });
    const rejectedFiles = await FileManagement.countDocuments({ status: 'rejected' });

    // Get requirement statistics
    const totalRequirements = await Requirement.countDocuments();
    const overdueRequirements = await Requirement.countDocuments({
      due_date: { $lt: new Date() }
    });
    const notOverdueRequirements = totalRequirements - overdueRequirements;
    const requirementCompletionRate = totalRequirements > 0 ? 
      Math.round(((totalRequirements - overdueRequirements) / totalRequirements) * 100) : 0;

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
      overdueRequirements
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
        document_type_distribution: documentTypeDist
      },
      requirement_management: {
        total_requirements: totalRequirements,
        overdue_requirements: overdueRequirements,
        not_overdue_requirements: notOverdueRequirements,
        completion_rate: requirementCompletionRate
      },
      system_variables: {
        total_variables: totalVariables,
        variable_type_distribution: variableTypeDist
      },
      summary: {
        total_records: totalUsers + totalFiles + totalRequirements + totalVariables,
        completion_rate: fileCompletionRate,
        system_health: systemHealth
      }
    };

    // Log analytics data for debugging
    console.log("Analytics Data Summary:", {
      totalUsers,
      onlineUsers,
      offlineUsers,
      admins,
      faculties,
      totalFiles,
      completedFiles,
      totalRequirements,
      overdueRequirements,
      totalVariables,
      systemHealth
    });

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

// Get faculty performance analytics
export const getFacultyPerformance = async (req, res) => {
  try {
    console.log("Faculty performance endpoint hit");

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
    console.error("Error fetching faculty performance:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching faculty performance",
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

// Export functions
export default {
  getAnalyticsData,
  getFacultyPerformance
};