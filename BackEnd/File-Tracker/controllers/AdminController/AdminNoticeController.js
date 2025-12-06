import AdminNotice from "../../models/AdminModel/AdminNoticeModel.js";
import Notification from "../../models/FacultyModel/NotificationModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";

// Generate 10-digit unique notice_id
const generateNoticeId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Generate 10-digit unique notification_id
const generateNotificationId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create admin notice
export const createAdminNotice = async (req, res) => {
  try {
    const { recipient_id, prof_name, document_type, tos_type, due_date, notes } = req.body;

    // Validation
    if (!recipient_id || !prof_name || !document_type || !due_date) {
      return res.status(400).json({ success: false, message: "All required fields must be filled." });
    }

    // If document_type is tos, tos_type is required
    if (document_type === "tos" && !tos_type) {
      return res.status(400).json({ success: false, message: "TOS type is required for TOS documents." });
    }

    // Generate notice_id
    const notice_id = generateNoticeId();

    // Create admin notice
    const adminNotice = new AdminNotice({
      notice_id,
      recipient_id,
      prof_name,
      document_type,
      tos_type: document_type === "tos" ? tos_type : null,
      due_date,
      notes: notes || "",
    });

    const savedAdminNotice = await adminNotice.save();

    // Create notification
    const notification = new Notification({
      notification_id: generateNotificationId(),
      recipient_id,
      recipient_type: recipient_id === "ALL" ? "all_faculty" : "faculty",
      recipient_name: prof_name,
      title: `New Admin Notice: ${document_type}`,
      message: `Document submission required`,
      document_type,
      tos_type: document_type === "tos" ? tos_type : null,
      due_date,
      notes: notes || "",
      related_notice_id: notice_id,
    });

    const savedNotification = await notification.save();

    res.status(201).json({ 
      success: true, 
      message: "Admin notice created successfully", 
      data: savedAdminNotice 
    });
  } catch (error) {
    console.error("Error creating admin notice:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all admin notices
export const getAdminNotices = async (req, res) => {
  try {
    const adminNotices = await AdminNotice.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: adminNotices });
  } catch (error) {
    console.error("Error fetching admin notices:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get admin notice by ID
export const getAdminNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminNotice = await AdminNotice.findOne({ notice_id: id });
    
    if (!adminNotice) {
      return res.status(404).json({ success: false, message: "Admin notice not found" });
    }
    
    res.status(200).json({ success: true, data: adminNotice });
  } catch (error) {
    console.error("Error fetching admin notice:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update admin notice
export const updateAdminNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient_id, prof_name, document_type, tos_type, due_date, notes } = req.body;

    // Find the existing admin notice
    const existingNotice = await AdminNotice.findOne({ notice_id: id });
    if (!existingNotice) {
      return res.status(404).json({ success: false, message: "Admin notice not found" });
    }

    // If document_type is tos, tos_type is required
    if (document_type === "tos" && !tos_type) {
      return res.status(400).json({ success: false, message: "TOS type is required for TOS documents." });
    }

    // Update admin notice
    const updatedAdminNotice = await AdminNotice.findOneAndUpdate(
      { notice_id: id },
      {
        recipient_id,
        prof_name,
        document_type,
        tos_type: document_type === "tos" ? tos_type : null,
        due_date,
        notes: notes || "",
        updated_at: Date.now(),
      },
      { new: true }
    );

    // Update associated notification
    await Notification.findOneAndUpdate(
      { related_notice_id: id },
      {
        recipient_id,
        recipient_type: recipient_id === "ALL" ? "all_faculty" : "faculty",
        recipient_name: prof_name,
        title: `Updated Admin Notice: ${document_type}`,
        document_type,
        tos_type: document_type === "tos" ? tos_type : null,
        due_date,
        notes: notes || "",
        updated_at: Date.now(),
      }
    );

    res.status(200).json({
      success: true,
      message: "Admin notice updated successfully",
      data: updatedAdminNotice,
    });
  } catch (error) {
    console.error("Error updating admin notice:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete admin notice
export const deleteAdminNotice = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the admin notice
    const deletedAdminNotice = await AdminNotice.findOneAndDelete({ notice_id: id });
    if (!deletedAdminNotice) {
      return res.status(404).json({ success: false, message: "Admin notice not found" });
    }

    // Delete associated notification
    await Notification.findOneAndDelete({ related_notice_id: id });

    res.status(200).json({
      success: true,
      message: "Admin notice deleted successfully",
      data: deletedAdminNotice,
    });
  } catch (error) {
    console.error("Error deleting admin notice:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all faculty for dropdown
export const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({}, 'facultyId facultyName facultyNumber role')
      .sort({ facultyName: 1 });
    
    res.status(200).json({ 
      success: true, 
      data: faculty 
    });
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};