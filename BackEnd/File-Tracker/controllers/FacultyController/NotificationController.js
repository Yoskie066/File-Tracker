import Notification from "../../models/FacultyModel/NotificationModel.js";

// Generate 10-digit unique notification_id
const generateNotificationId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create notification - UPDATED with new fields
export const createNotification = async (req, res) => {
  try {
    const { 
      recipient_id, 
      recipient_type, 
      recipient_name, 
      title, 
      message, 
      related_notice_id,
      notification_type,
      file_id,
      file_name,
      subject_code,
      course,
      previous_status,
      new_status,
      document_type,
      tos_type
    } = req.body;

    if (!recipient_id || !recipient_type || !recipient_name || !title || !message || !new_status) {
      return res.status(400).json({ success: false, message: "All required fields must be filled." });
    }

    const notification = new Notification({
      notification_id: generateNotificationId(),
      recipient_id,
      recipient_type,
      recipient_name,
      title,
      message,
      related_notice_id: related_notice_id || "",
      notification_type: notification_type || "file_status_update",
      file_id: file_id || "",
      file_name: file_name || "",
      subject_code: subject_code || "",
      course: course || "",
      previous_status: previous_status || "",
      new_status,
      document_type: document_type || "",
      tos_type: tos_type || "",
    });

    const savedNotification = await notification.save();
    res.status(201).json({ success: true, message: "Notification created successfully", data: savedNotification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Create file status update notification (helper function)
export const createFileStatusNotification = async (notificationData) => {
  try {
    const {
      faculty_id,
      faculty_name,
      file_id,
      file_name,
      subject_code,
      course,
      document_type,
      tos_type,
      previous_status,
      new_status,
      admin_name = "System Administrator"
    } = notificationData;

    const notification = new Notification({
      notification_id: generateNotificationId(),
      recipient_id: faculty_id,
      recipient_type: "Faculty",
      recipient_name: faculty_name,
      title: `File Status Updated: ${file_name}`,
      message: `Your ${document_type} file "${file_name}" for ${subject_code} (${course}) has been updated from "${previous_status}" to "${new_status}" by ${admin_name}.`,
      notification_type: "file_status_update",
      file_id,
      file_name,
      subject_code,
      course,
      document_type,
      tos_type,
      previous_status,
      new_status,
      is_read: false
    });

    const savedNotification = await notification.save();
    console.log(`✅ File status notification created for ${faculty_name}: ${file_name} -> ${new_status}`);
    return savedNotification;
  } catch (error) {
    console.error("Error creating file status notification:", error);
    throw error;
  }
};

// Create bulk complete notifications
export const createBulkCompleteNotifications = async (files, admin_name = "System Administrator") => {
  try {
    const notifications = [];
    
    for (const file of files) {
      const notification = new Notification({
        notification_id: generateNotificationId(),
        recipient_id: file.faculty_id,
        recipient_type: "Faculty",
        recipient_name: file.faculty_name,
        title: `Files Marked as Completed`,
        message: `Your ${file.document_type} file "${file.file_name}" for ${file.subject_code} (${file.course}) has been marked as "completed" by ${admin_name} in the bulk update.`,
        notification_type: "file_status_update",
        file_id: file.file_id,
        file_name: file.file_name,
        subject_code: file.subject_code,
        course: file.course,
        document_type: file.document_type,
        tos_type: file.tos_type || "",
        previous_status: file.status,
        new_status: "completed",
        is_read: false
      });
      
      notifications.push(notification);
    }
    
    const savedNotifications = await Notification.insertMany(notifications);
    console.log(`✅ Created ${savedNotifications.length} bulk complete notifications`);
    return savedNotifications;
  } catch (error) {
    console.error("Error creating bulk complete notifications:", error);
    throw error;
  }
};

// Get notifications by recipient_id - UPDATED to include file status notifications
export const getNotificationsByRecipient = async (req, res) => {
  try {
    const { recipient_id } = req.params;
    console.log("Fetching notifications for recipient_id:", recipient_id);
    
    const notifications = await Notification.find({ 
      recipient_id: recipient_id 
    }).sort({ created_at: -1 });
    
    console.log("Found notifications:", notifications.length);
    
    // Debug: Log what we found
    if (notifications.length > 0) {
      notifications.forEach(notification => {
        console.log(`   - Title: ${notification.title}, Type: ${notification.notification_type}, Status: ${notification.new_status}`);
      });
    }
    
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get unread count by recipient_id
export const getUnreadCount = async (req, res) => {
  try {
    const { recipient_id } = req.params;
    const count = await Notification.countDocuments({ 
      recipient_id, 
      is_read: false 
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Mark as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Notification.findOneAndUpdate(
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

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    const { recipient_id } = req.params;
    const result = await Notification.updateMany({ 
      recipient_id, 
      is_read: false 
    }, { 
      is_read: true 
    });
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

// Get notifications for faculty (including ALL notifications)
export const getFacultyNotifications = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    console.log("Fetching notifications for faculty ID:", facultyId);
    
    // Find notifications for this specific faculty member OR notifications sent to ALL faculty
    const notifications = await Notification.find({
      $or: [
        { recipient_id: facultyId }, 
        { recipient_name: "ALL" }   
      ]
    }).sort({ created_at: -1 });
    
    console.log(`Found ${notifications.length} notifications for faculty ${facultyId}`);
    
    res.status(200).json({ 
      success: true, 
      data: notifications,
      count: notifications.length
    });
    
  } catch (error) {
    console.error("Error fetching faculty notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get unread count for faculty
export const getFacultyUnreadCount = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const count = await Notification.countDocuments({
      $or: [
        { recipient_id: facultyId },
        { recipient_name: "ALL" }
      ],
      is_read: false
    });
    
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

// Get file status notifications for faculty
export const getFileStatusNotifications = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const notifications = await Notification.find({
      recipient_id: facultyId,
      notification_type: "file_status_update"
    }).sort({ created_at: -1 });
    
    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error("Error fetching file status notifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get notifications by file ID
export const getNotificationsByFileId = async (req, res) => {
  try {
    const { file_id } = req.params;
    
    const notifications = await Notification.find({
      file_id: file_id,
      notification_type: "file_status_update"
    }).sort({ created_at: -1 });
    
    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error("Error fetching notifications by file ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};