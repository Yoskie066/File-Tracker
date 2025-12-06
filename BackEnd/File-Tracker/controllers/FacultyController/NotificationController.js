import Notification from "../../models/FacultyModel/NotificationModel.js";

// Generate 10-digit unique notification_id
const generateNotificationId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Update the createNotification function to handle document_type and tos_type
export const createNotification = async (req, res) => {
  try {
    const { 
      recipient_id, 
      recipient_type, 
      recipient_name, 
      title, 
      message, 
      related_notice_id,
      document_type,
      tos_type,
      due_date,
      notes 
    } = req.body;

    if (!recipient_id || !recipient_type || !recipient_name || !title || !message || !document_type || !due_date) {
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
      document_type,
      tos_type: tos_type || null,
      due_date,
      notes: notes || "",
    });

    const savedNotification = await notification.save();
    res.status(201).json({ success: true, message: "Notification created successfully", data: savedNotification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get notifications by recipient_id
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
        console.log(`   - Title: ${notification.title}, Recipient: ${notification.recipient_id}, Name: ${notification.recipient_name}`);
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
    const count = await Notification.countDocuments({ recipient_id, is_read: false });
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
    const result = await Notification.updateMany({ recipient_id, is_read: false }, { is_read: true });
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
    
    // Debug: Log what we found
    if (notifications.length > 0) {
      notifications.forEach(notification => {
        console.log(`   - Title: ${notification.title}, Recipient: ${notification.recipient_id}, Name: ${notification.recipient_name}, Type: ${notification.recipient_name === "ALL" ? "ALL_FACULTY" : "SPECIFIC"}`);
      });
    }
    
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