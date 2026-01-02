import AdminNotification from "../../models/AdminModel/AdminNotificationModel.js";

// Generate 10-digit unique notification_id
const generateNotificationId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create admin notification when faculty uploads a file
export const createAdminNotification = async (fileData) => {
  try {
    const {
      file_id,
      faculty_id,
      faculty_name,
      file_name,
      document_type,
      tos_type,
      subject_code,
      subject_title,
      course,
      semester,
      school_year
    } = fileData;

    // Create notification for all admins
    const notification = new AdminNotification({
      notification_id: generateNotificationId(),
      admin_id: "all",
      faculty_id,
      faculty_name,
      title: "New File Uploaded",
      message: `Faculty ${faculty_name} uploaded a ${document_type} file for ${subject_code}`,
      file_id,
      file_name,
      document_type,
      tos_type: tos_type || "",
      subject_code,
      subject_title,
      course,
      semester,
      school_year,
      status: "pending"
    });

    const savedNotification = await notification.save();
    console.log("Admin notification created:", savedNotification.notification_id);
    return savedNotification;
  } catch (error) {
    console.error("Error creating admin notification:", error);
    throw error;
  }
};

// Get notifications for admin
export const getAdminNotifications = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    console.log("Fetching admin notifications for adminId:", adminId);
    
    // Get notifications for all admins or specific admin
    const query = adminId === "all" 
      ? {} 
      : { admin_id: { $in: [adminId, "all"] } };
    
    const notifications = await AdminNotification.find(query)
      .sort({ created_at: -1 });
    
    console.log(`Found ${notifications.length} notifications`);
    
    res.status(200).json({ 
      success: true, 
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get unread count for admin
export const getAdminUnreadCount = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    const query = adminId === "all" 
      ? { is_read: false }
      : { 
          $or: [
            { admin_id: adminId },
            { admin_id: "all" }
          ],
          is_read: false
        };
    
    const count = await AdminNotification.countDocuments(query);
    
    res.status(200).json({ 
      success: true, 
      count 
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Mark notification as read
export const markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await AdminNotification.findOneAndUpdate(
      { notification_id: id }, 
      { is_read: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, message: "Notification marked as read", data: updated });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Mark all notifications as read for admin
export const markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    const query = adminId === "all" 
      ? { is_read: false }
      : { 
          $or: [
            { admin_id: adminId },
            { admin_id: "all" }
          ],
          is_read: false
        };
    
    const result = await AdminNotification.updateMany(query, { is_read: true });
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update notification status (when admin reviews/archives)
export const updateAdminNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await AdminNotification.findOneAndUpdate(
      { notification_id: id }, 
      { status, is_read: true },
      { new: true }
    );
    
    if (!updated) return res.status(404).json({ success: false, message: "Notification not found" });
    
    res.status(200).json({ 
      success: true, 
      message: "Notification status updated", 
      data: updated 
    });
  } catch (error) {
    console.error("Error updating notification status:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete notification
export const deleteAdminNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AdminNotification.findOneAndDelete({ notification_id: id });
    
    if (!deleted) return res.status(404).json({ success: false, message: "Notification not found" });
    
    res.status(200).json({ 
      success: true, 
      message: "Notification deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Bulk delete notifications
export const bulkDeleteAdminNotifications = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide an array of notification IDs" 
      });
    }
    
    const result = await AdminNotification.deleteMany({ 
      notification_id: { $in: ids } 
    });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notification(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error bulk deleting notifications:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};