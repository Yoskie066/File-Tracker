import AdminDeliverables from "../../models/AdminModel/AdminDeliverablesModel.js";
import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";

// Generate 10-digit unique admin_deliverables_id
const generateAdminDeliverableId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Helper function to map file_type to AdminDeliverables field
const mapFileTypeToAdminField = (fileType, tosType = null) => {
  const mapping = {
    'syllabus': 'syllabus',
    'tos': tosType === 'midterm' ? 'tos_midterm' : 'tos_final',
    'tos-midterm': 'tos_midterm',
    'tos-final': 'tos_final',
    'midterm-exam': 'midterm_exam',
    'final-exam': 'final_exam',
    'instructional-materials': 'instructional_materials'
  };
  return mapping[fileType] || null;
};

// Auto-sync when new file is uploaded OR status is updated - UPDATED FUNCTION
export const autoSyncDeliverable = async (fileData) => {
  try {
    const { faculty_id, faculty_name, subject_code, course_section, file_type, tos_type, status } = fileData;

    console.log(`Auto-syncing to AdminDeliverables: ${subject_code}-${course_section}`);
    console.log(`File Type: ${file_type}, TOS Type: ${tos_type}, Status: ${status}`);

    // Map file_type to AdminDeliverables field name
    const fieldName = mapFileTypeToAdminField(file_type, tos_type);
    if (!fieldName) {
      console.warn(`No mapping found for file type in AdminDeliverables: ${file_type}`);
      return;
    }

    // Find existing AdminDeliverables record
    let adminDeliverable = await AdminDeliverables.findOne({
      faculty_id,
      subject_code,
      course_section
    });

    if (adminDeliverable) {
      // Update the specific field
      const updateData = {
        [fieldName]: status,
        last_updated: new Date()
      };

      // Update TOS type if applicable
      if (file_type.includes('tos')) {
        updateData.tos_type = tos_type;
      }

      // Update the document
      const updatedDeliverable = await AdminDeliverables.findOneAndUpdate(
        { faculty_id, subject_code, course_section },
        updateData,
        { new: true, runValidators: true }
      );

      console.log(`Updated AdminDeliverables: ${subject_code}-${course_section}`);
      console.log(`Field: ${fieldName} = ${status}`);

      // Update overall status after individual field update
      await updateOverallStatus(updatedDeliverable);
    } else {
      // Create new AdminDeliverables record
      const facultyLoaded = await FacultyLoaded.findOne({
        subject_code,
        course_section
      });

      if (!facultyLoaded) {
        console.warn(`No faculty loaded found for auto-sync: ${subject_code}-${course_section}`);
        return;
      }

      const admin_deliverables_id = generateAdminDeliverableId();

      // Create base deliverable object
      const newDeliverableData = {
        admin_deliverables_id,
        faculty_id,
        faculty_name,
        subject_code,
        course_section,
        [fieldName]: status,
        tos_type: file_type.includes('tos') ? tos_type : null,
        last_updated: new Date(),
        status_overall: "pending" // Will be calculated separately
      };

      const newAdminDeliverable = new AdminDeliverables(newDeliverableData);
      const savedDeliverable = await newAdminDeliverable.save();

      console.log(`Created new AdminDeliverables for ${subject_code}-${course_section}`);
      console.log(`Field: ${fieldName} = ${status}`);

      // Update overall status for the new deliverable
      await updateOverallStatus(savedDeliverable);
    }

  } catch (error) {
    console.error("Error in auto-sync deliverable:", error);
  }
};

// Helper function to update overall status - FIXED LOGIC
const updateOverallStatus = async (adminDeliverable) => {
  try {
    if (!adminDeliverable) return;

    const fields = [
      'syllabus', 
      'tos_midterm', 
      'tos_final', 
      'midterm_exam', 
      'final_exam', 
      'instructional_materials'
    ];

    const statuses = fields.map(field => adminDeliverable[field]);
    
    // Count statuses
    const completedCount = statuses.filter(status => status === 'completed').length;
    const rejectedCount = statuses.filter(status => status === 'rejected').length;
    const pendingCount = statuses.filter(status => status === 'pending').length;
    
    let status_overall = "pending";
    
    // If any field is rejected, overall is rejected
    if (rejectedCount > 0) {
      status_overall = 'rejected';
    } 
    // If all fields are completed, overall is completed
    else if (completedCount === 6) {
      status_overall = 'completed';
    }
    // If some are completed but none rejected, check if all required are completed
    else if (completedCount > 0 && rejectedCount === 0) {
      // For now, we'll set as pending until all are completed
      // You can adjust this logic based on your business rules
      status_overall = 'pending';
    }
    // Otherwise, it's pending
    else {
      status_overall = 'pending';
    }

    // Update the overall status
    await AdminDeliverables.findByIdAndUpdate(
      adminDeliverable._id,
      { status_overall, last_updated: new Date() }
    );

    console.log(`Updated overall status for ${adminDeliverable.subject_code}-${adminDeliverable.course_section}: ${status_overall}`);
    console.log(`Status breakdown - Completed: ${completedCount}, Rejected: ${rejectedCount}, Pending: ${pendingCount}`);

  } catch (error) {
    console.error("Error updating overall status:", error);
  }
};

// Get all admin deliverables with pagination and filters - UPDATED
export const getAdminDeliverables = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status_overall = "",
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
        { course_section: { $regex: search, $options: 'i' } }
      ];
    }

    if (status_overall) {
      // Handle case-insensitive status filtering
      filter.status_overall = { $regex: new RegExp(`^${status_overall}$`, 'i') };
    }
    
    if (faculty_name) filter.faculty_name = { $regex: faculty_name, $options: 'i' };

    // Get total count for pagination
    const total = await AdminDeliverables.countDocuments(filter);
    
    // Get deliverables with pagination
    const deliverables = await AdminDeliverables.find(filter)
      .sort({ last_updated: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get unique values for filters
    const statuses = await AdminDeliverables.distinct('status_overall');
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

// Get deliverables statistics - UPDATED COUNTING LOGIC
export const getDeliverablesStats = async (req, res) => {
  try {
    const totalDeliverables = await AdminDeliverables.countDocuments();
    
    // Get accurate counts for each status
    const completedCount = await AdminDeliverables.countDocuments({ 
      status_overall: { $regex: /^completed$/i } 
    });
    
    const rejectedCount = await AdminDeliverables.countDocuments({ 
      status_overall: { $regex: /^rejected$/i } 
    });
    
    const pendingCount = await AdminDeliverables.countDocuments({ 
      status_overall: { $regex: /^pending$/i } 
    });

    const facultyStats = await AdminDeliverables.aggregate([
      {
        $group: {
          _id: '$faculty_name',
          count: { $sum: 1 }
        }
      }
    ]).sort({ count: -1 }).limit(10);

    res.status(200).json({
      success: true,
      data: {
        total: totalDeliverables,
        status: {
          completed: completedCount,
          rejected: rejectedCount,
          pending: pendingCount
        },
        topFaculty: facultyStats
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
    const deliverable = await AdminDeliverables.findOne({ admin_deliverables_id: id });

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

// Update deliverable status - UPDATED
export const updateDeliverableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, status } = req.body;

    const validFields = ['syllabus', 'tos_midterm', 'tos_final', 'midterm_exam', 'final_exam', 'instructional_materials'];
    
    if (!validFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field name"
      });
    }

    const updatedDeliverable = await AdminDeliverables.findOneAndUpdate(
      { admin_deliverables_id: id },
      { 
        [field]: status,
        last_updated: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDeliverable) {
      return res.status(404).json({
        success: false,
        message: "Deliverable not found"
      });
    }

    // Update overall status with the updated document
    await updateOverallStatus(updatedDeliverable);

    // Get the final updated deliverable to return
    const finalDeliverable = await AdminDeliverables.findOne({ admin_deliverables_id: id });

    res.status(200).json({
      success: true,
      message: "Deliverable status updated successfully",
      data: finalDeliverable
    });

  } catch (error) {
    console.error("Error updating deliverable status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating deliverable",
      error: error.message
    });
  }
};

// Delete a deliverable
export const deleteDeliverable = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await AdminDeliverables.findOneAndDelete({ admin_deliverables_id: id });

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

// Manual sync all files to Admin Deliverables
export const syncAdminDeliverables = async (req, res) => {
  try {
    console.log("Starting manual Admin Deliverables sync...");

    // Get all files from FileManagement
    const files = await FileManagement.find().sort({ uploaded_at: -1 });
    console.log(`Found ${files.length} files to sync`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        await autoSyncDeliverable({
          faculty_id: file.faculty_id,
          faculty_name: file.faculty_name,
          subject_code: file.subject_code,
          course_section: file.course_section,
          file_type: file.file_type,
          tos_type: file.tos_type,
          status: file.status
        });
        
        syncedCount++;
      } catch (error) {
        console.error(`Error syncing file ${file.file_name}:`, error);
        errorCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Admin Deliverables sync completed. ${syncedCount} deliverables processed, ${errorCount} errors.`,
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