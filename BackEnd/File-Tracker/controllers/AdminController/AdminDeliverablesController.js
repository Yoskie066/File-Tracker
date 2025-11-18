import AdminDeliverables from "../../models/AdminModel/AdminDeliverablesModel.js";
import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";

// Generate 10-digit unique deliverable_id
const generateDeliverableId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Sync all file submissions to Admin Deliverables
export const syncAdminDeliverables = async (req, res) => {
  try {
    console.log("Starting Admin Deliverables sync...");

    // Get all files from FileManagement
    const files = await FileManagement.find().sort({ uploaded_at: -1 });
    console.log(`Found ${files.length} files to sync`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        // Check if this file already exists in AdminDeliverables
        const existingDeliverable = await AdminDeliverables.findOne({
          faculty_id: file.faculty_id,
          subject_code: file.subject_code,
          course_section: file.course_section,
          file_type: file.file_type,
          date_submitted: file.uploaded_at
        });

        if (existingDeliverable) {
          console.log(`Deliverable already exists: ${file.file_name}`);
          continue;
        }

        // Get faculty loaded details to get semester, school_year
        const facultyLoaded = await FacultyLoaded.findOne({
          subject_code: file.subject_code,
          course_section: file.course_section
        });

        if (!facultyLoaded) {
          console.warn(`No faculty loaded found for ${file.subject_code}-${file.course_section}`);
          continue;
        }

        // Create new admin deliverable
        const newDeliverable = new AdminDeliverables({
          deliverable_id: generateDeliverableId(),
          faculty_id: file.faculty_id,
          faculty_name: file.faculty_name,
          subject_code: file.subject_code,
          semester: facultyLoaded.semester,
          school_year: facultyLoaded.school_year,
          file_name: file.file_name,
          file_type: file.file_type,
          date_submitted: file.uploaded_at,
          status: file.status,
          course_section: file.course_section
        });

        await newDeliverable.save();
        console.log(`Synced: ${file.file_name}`);
        syncedCount++;

      } catch (error) {
        console.error(`Error syncing file ${file.file_name}:`, error);
        errorCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Admin Deliverables sync completed. ${syncedCount} new deliverables added, ${errorCount} errors.`,
      data: {
        synced: syncedCount,
        errors: errorCount,
        total: files.length
      }
    });

  } catch (error) {
    console.error("Error syncing admin deliverables:", error);
    res.status(500).json({
      success: false,
      message: "Server error during sync",
      error: error.message
    });
  }
};

// Get all admin deliverables with pagination and filters
export const getAdminDeliverables = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      semester = "",
      school_year = "",
      file_type = "",
      status = "",
      faculty_name = ""
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { faculty_name: { $regex: search, $options: 'i' } },
        { subject_code: { $regex: search, $options: 'i' } },
        { file_name: { $regex: search, $options: 'i' } }
      ];
    }

    if (semester) filter.semester = semester;
    if (school_year) filter.school_year = school_year;
    if (file_type) filter.file_type = file_type;
    if (status) filter.status = status;
    if (faculty_name) filter.faculty_name = { $regex: faculty_name, $options: 'i' };

    // Get total count for pagination
    const total = await AdminDeliverables.countDocuments(filter);
    
    // Get deliverables with pagination
    const deliverables = await AdminDeliverables.find(filter)
      .sort({ date_submitted: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get unique values for filters
    const semesters = await AdminDeliverables.distinct('semester');
    const schoolYears = await AdminDeliverables.distinct('school_year');
    const fileTypes = await AdminDeliverables.distinct('file_type');
    const statuses = await AdminDeliverables.distinct('status');
    const facultyNames = await AdminDeliverables.distinct('faculty_name');

    res.status(200).json({
      success: true,
      data: deliverables,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalRecords: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      filters: {
        semesters: semesters.filter(s => s),
        schoolYears: schoolYears.filter(s => s),
        fileTypes: fileTypes.filter(f => f),
        statuses: statuses.filter(s => s),
        facultyNames: facultyNames.filter(f => f)
      }
    });

  } catch (error) {
    console.error("Error fetching admin deliverables:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching deliverables",
      error: error.message
    });
  }
};

// Get deliverables statistics
export const getDeliverablesStats = async (req, res) => {
  try {
    const totalDeliverables = await AdminDeliverables.countDocuments();
    
    const statusStats = await AdminDeliverables.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const fileTypeStats = await AdminDeliverables.aggregate([
      {
        $group: {
          _id: '$file_type',
          count: { $sum: 1 }
        }
      }
    ]);

    const semesterStats = await AdminDeliverables.aggregate([
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentSubmissions = await AdminDeliverables.find()
      .sort({ date_submitted: -1 })
      .limit(5)
      .select('faculty_name subject_code file_type date_submitted status');

    // Convert aggregation results to object format
    const statusCounts = {};
    statusStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    const fileTypeCounts = {};
    fileTypeStats.forEach(stat => {
      fileTypeCounts[stat._id] = stat.count;
    });

    const semesterCounts = {};
    semesterStats.forEach(stat => {
      semesterCounts[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalDeliverables,
        status: statusCounts,
        fileType: fileTypeCounts,
        semester: semesterCounts,
        recentSubmissions
      }
    });

  } catch (error) {
    console.error("Error fetching deliverables stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching statistics",
      error: error.message
    });
  }
};

// Get single deliverable by ID
export const getDeliverableById = async (req, res) => {
  try {
    const { id } = req.params;
    const deliverable = await AdminDeliverables.findOne({ deliverable_id: id });

    if (!deliverable) {
      return res.status(404).json({
        success: false,
        message: "Deliverable not found"
      });
    }

    res.status(200).json({
      success: true,
      data: deliverable
    });

  } catch (error) {
    console.error("Error fetching deliverable:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching deliverable",
      error: error.message
    });
  }
};

// Delete a deliverable
export const deleteDeliverable = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await AdminDeliverables.findOneAndDelete({ deliverable_id: id });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Deliverable not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Deliverable deleted successfully",
      data: deleted
    });

  } catch (error) {
    console.error("Error deleting deliverable:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting deliverable",
      error: error.message
    });
  }
};

// Auto-sync when new file is uploaded OR status is updated
export const autoSyncDeliverable = async (fileData) => {
  try {
    const { faculty_id, faculty_name, subject_code, course_section, file_name, file_type, uploaded_at, status } = fileData;

    // Check if deliverable already exists - UPDATED QUERY
    const existingDeliverable = await AdminDeliverables.findOne({
      faculty_id,
      subject_code,
      course_section,
      file_type,
      // Use file_name as additional identifier since uploaded_at might be the same for updates
      file_name: file_name
    });

    if (existingDeliverable) {
      // UPDATE EXISTING DELIVERABLE STATUS
      existingDeliverable.status = status;
      existingDeliverable.updated_at = new Date();
      await existingDeliverable.save();
      console.log(`Updated existing deliverable status: ${file_name} -> ${status}`);
    } else {
      // Get faculty loaded details
      const facultyLoaded = await FacultyLoaded.findOne({
        subject_code,
        course_section
      });

      if (!facultyLoaded) {
        console.warn(`No faculty loaded found for auto-sync: ${subject_code}-${course_section}`);
        return;
      }

      // Create new deliverable - REMOVED SUBJECT_TITLE
      const newDeliverable = new AdminDeliverables({
        deliverable_id: generateDeliverableId(),
        faculty_id,
        faculty_name,
        subject_code,
        semester: facultyLoaded.semester,
        school_year: facultyLoaded.school_year,
        file_name,
        file_type,
        date_submitted: uploaded_at,
        status,
        course_section
      });

      await newDeliverable.save();
      console.log(`Auto-synced new deliverable: ${file_name}`);
    }

  } catch (error) {
    console.error("Error in auto-sync deliverable:", error);
  }
};