import AdminDeliverables from "../../models/AdminModel/AdminDeliverablesModel.js";

// Generate Unique Deliverable ID
const generateDeliverableId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Auto-sync deliverable from file upload
export const autoSyncDeliverable = async (data) => {
  try {
    const { faculty_id, faculty_name, subject_code, course_section, file_name, file_type, tos_type, uploaded_at, status } = data;

    console.log(`Auto-syncing deliverable for: ${faculty_name} - ${subject_code}-${course_section}`);
    console.log(`File: ${file_name}, Type: ${file_type}, TOS Type: ${tos_type}, Status: ${status}`);

    const deliverable_id = generateDeliverableId();

    const newDeliverable = new AdminDeliverables({
      deliverable_id,
      faculty_id,
      faculty_name,
      subject_code,
      course_section,
      file_name,
      file_type,
      tos_type,
      status,
      uploaded_at,
      synced_at: new Date()
    });

    const savedDeliverable = await newDeliverable.save();
    
    console.log(`Successfully synced deliverable: ${savedDeliverable.deliverable_id}`);
    return savedDeliverable;
  } catch (error) {
    console.error("Error auto-syncing deliverable:", error);
    throw error;
  }
};

// GET ALL ADMIN DELIVERABLES
export const getAdminDeliverables = async (req, res) => {
  try {
    const deliverables = await AdminDeliverables.find().sort({ uploaded_at: -1 });
    
    res.status(200).json({
      success: true,
      data: deliverables,
    });
  } catch (error) {
    console.error("Error fetching admin deliverables:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET DELIVERABLE BY ID
export const getDeliverableById = async (req, res) => {
  try {
    const { id } = req.params;
    const deliverable = await AdminDeliverables.findOne({ deliverable_id: id });

    if (!deliverable)
      return res.status(404).json({ success: false, message: "Deliverable not found" });

    res.status(200).json({ success: true, data: deliverable });
  } catch (error) {
    console.error("Error fetching deliverable:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// UPDATE DELIVERABLE STATUS
export const updateDeliverableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedDeliverable = await AdminDeliverables.findOneAndUpdate(
      { deliverable_id: id },
      { 
        status,
        synced_at: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDeliverable)
      return res.status(404).json({ success: false, message: "Deliverable not found" });

    res.status(200).json({
      success: true,
      message: "Deliverable status updated successfully",
      data: updatedDeliverable,
    });
  } catch (error) {
    console.error("Error updating deliverable status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE DELIVERABLE
export const deleteDeliverable = async (req, res) => {
  try {
    const { id } = req.params;
    const deliverable = await AdminDeliverables.findOne({ deliverable_id: id });

    if (!deliverable)
      return res.status(404).json({ success: false, message: "Deliverable not found" });

    await AdminDeliverables.findOneAndDelete({ deliverable_id: id });

    res.status(200).json({ 
      success: true, 
      message: "Deliverable deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting deliverable:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET DELIVERABLES BY FACULTY
export const getFacultyDeliverables = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const deliverables = await AdminDeliverables.find({ 
      faculty_id: facultyId 
    }).sort({ uploaded_at: -1 });

    res.status(200).json({
      success: true,
      data: deliverables,
    });
  } catch (error) {
    console.error("Error fetching faculty deliverables:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET DELIVERABLES BY SUBJECT AND SECTION
export const getDeliverablesBySubjectSection = async (req, res) => {
  try {
    const { subject_code, course_section } = req.params;

    const deliverables = await AdminDeliverables.find({
      subject_code,
      course_section
    }).sort({ uploaded_at: -1 });

    res.status(200).json({
      success: true,
      data: deliverables,
    });
  } catch (error) {
    console.error("Error fetching subject-section deliverables:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET DELIVERABLES STATISTICS
export const getDeliverablesStats = async (req, res) => {
  try {
    const totalDeliverables = await AdminDeliverables.countDocuments();
    const pendingDeliverables = await AdminDeliverables.countDocuments({ status: 'pending' });
    const completedDeliverables = await AdminDeliverables.countDocuments({ status: 'completed' });
    const rejectedDeliverables = await AdminDeliverables.countDocuments({ status: 'rejected' });

    // Get stats by file type
    const fileTypeStats = await AdminDeliverables.aggregate([
      {
        $group: {
          _id: '$file_type',
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get stats by faculty
    const facultyStats = await AdminDeliverables.aggregate([
      {
        $group: {
          _id: '$faculty_id',
          faculty_name: { $first: '$faculty_name' },
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await AdminDeliverables.aggregate([
      {
        $match: {
          uploaded_at: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$uploaded_at'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalDeliverables,
        pending: pendingDeliverables,
        completed: completedDeliverables,
        rejected: rejectedDeliverables,
        fileTypeStats,
        facultyStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error("Error fetching deliverables statistics:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// SYNC ADMIN DELIVERABLES (if needed)
export const syncAdminDeliverables = async (req, res) => {
  try {
    // This function can be used to manually sync deliverables if needed
    // For now, we'll just return a success message since auto-sync is handled by file upload
    res.status(200).json({
      success: true,
      message: "Admin deliverables sync functionality ready. Auto-sync is handled during file upload."
    });
  } catch (error) {
    console.error("Error syncing admin deliverables:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};