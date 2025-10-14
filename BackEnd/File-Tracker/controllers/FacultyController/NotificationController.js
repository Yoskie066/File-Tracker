import Notification from "../../models/FacultyModel/NotificationModel.js";

// Generate 10-digit unique notification_id
const generateNotificationId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// ✅ Create notification
export const createNotification = async (req, res) => {
  try {
    const { recipient_id, recipient_type, recipient_name, title, message, related_requirement_id } = req.body;

    if (!recipient_id || !recipient_type || !recipient_name || !title || !message) {
      return res.status(400).json({ success: false, message: "All required fields must be filled." });
    }

    const notification = new Notification({
      notification_id: generateNotificationId(),
      recipient_id,
      recipient_type,
      recipient_name,
      title,
      message,
      related_requirement_id: related_requirement_id || "",
    });

    const savedNotification = await notification.save();
    res.status(201).json({ success: true, message: "Notification created successfully", data: savedNotification });
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get notifications by recipient_id
export const getNotificationsByRecipient = async (req, res) => {
  try {
    const { recipient_id } = req.params;
    const notifications = await Notification.find({ recipient_id }).sort({ created_at: -1 });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get unread count by recipient_name
export const getUnreadCount = async (req, res) => {
  try {
    const { recipient_name } = req.params;
    const count = await Notification.countDocuments({ recipient_name, is_read: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("❌ Error fetching unread count:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Mark as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Notification.findOneAndUpdate(
      { notification_id: id },
      { is_read: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, message: "Marked as read", data: updated });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    const { recipient_name } = req.params;
    const result = await Notification.updateMany({ recipient_name, is_read: false }, { is_read: true });
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error marking all as read:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
