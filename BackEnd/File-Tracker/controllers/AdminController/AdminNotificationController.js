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
      subject_code,
      semester,
      school_year
    } = fileData;

    const notification = new AdminNotification({
      notification_id: generateNotificationId(),
      faculty_id,
      faculty_name,
      file_id,
      file_name,
      document_type,
      subject_code,
      semester,
      school_year
    });

    const savedNotification = await notification.save();
    console.log("Admin notification created:", savedNotification.notification_id);
    return savedNotification;
  } catch (error) {
    console.error("Error creating admin notification:", error);
    throw error;
  }
};

// Get all admin notifications
export const getAdminNotifications = async (req, res) => {
  try {
    console.log("Fetching all admin notifications");
    
    const notifications = await AdminNotification.find()
      .sort({ created_at: -1 });
    
    console.log(`Found ${notifications.length} notifications`);
    
    // Format the response to match the frontend expectation
    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id, // Keep the MongoDB _id
      notification_id: notification.notification_id,
      faculty_id: notification.faculty_id,
      faculty_name: notification.faculty_name,
      file_id: notification.file_id,
      file_name: notification.file_name,
      document_type: notification.document_type,
      subject_code: notification.subject_code,
      semester: notification.semester,
      school_year: notification.school_year,
      created_at: notification.created_at,
      is_read: notification.is_read || false
    }));
    
    res.status(200).json({ 
      success: true, 
      data: formattedNotifications,
      count: formattedNotifications.length
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
    const count = await AdminNotification.countDocuments({ is_read: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Mark as read
export const markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await AdminNotification.findOneAndUpdate(
      { _id: id }, 
      { is_read: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, message: "Marked as read", data: updated });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};