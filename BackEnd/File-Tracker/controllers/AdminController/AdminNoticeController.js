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
    console.log("Received request body:", req.body);
    
    const { prof_name, document_type, due_date, notes } = req.body;

    // Validation
    if (!prof_name || !document_type || !due_date) {
      return res.status(400).json({ 
        success: false, 
        message: "All required fields must be filled.",
        missing_fields: {
          prof_name: !prof_name,
          document_type: !document_type,
          due_date: !due_date
        }
      });
    }

    const notice_id = generateNoticeId();

    console.log("Creating admin notice with ID:", notice_id);

    const newAdminNotice = new AdminNotice({
      notice_id,
      prof_name,
      document_type,
      due_date: new Date(due_date),
      notes: notes || "",
    });

    const savedAdminNotice = await newAdminNotice.save();
    console.log("Admin notice saved successfully:", savedAdminNotice._id);

    // Create notification message
    const notificationMessage = `You have a new admin notice for document submission`;

    // Create notifications based on professor selection
    try {
      if (prof_name === "ALL") {
        // Send notification to ALL faculty members
        console.log("Sending notification to ALL faculty members");
        
        const allFaculty = await Faculty.find({});
        console.log(`Found ${allFaculty.length} faculty members`);
        
        // Create notifications for each faculty member
        const notificationPromises = allFaculty.map(faculty => {
          const notification = new Notification({
            notification_id: generateNotificationId(),
            recipient_id: faculty.facultyId,
            recipient_type: "Faculty",
            recipient_name: faculty.facultyName,
            title: "New Admin Notice",
            message: notificationMessage,
            notes: notes || "",
            document_type: document_type,
            due_date: new Date(due_date),
            related_notice_id: savedAdminNotice.notice_id,
            is_read: false,
          });
          return notification.save();
        });
        
        await Promise.all(notificationPromises);
        console.log(`Created ${notificationPromises.length} notifications for all faculty`);
        
      } else {
        // Send notification to specific faculty member only
        console.log("Looking for specific faculty with name:", prof_name);
        
        // Find faculty by name to get their facultyId
        const faculty = await Faculty.findOne({ facultyName: new RegExp(`^${prof_name}$`, "i") });
        console.log("Found faculty:", faculty);
        
        if (faculty) {
          // Create notification linked to that faculty
          const notification = new Notification({
            notification_id: generateNotificationId(),
            recipient_id: faculty.facultyId,
            recipient_type: "Faculty",
            recipient_name: faculty.facultyName,
            title: "New Admin Notice",
            message: notificationMessage,
            notes: notes || "",
            document_type: document_type,
            due_date: new Date(due_date),
            related_notice_id: savedAdminNotice.notice_id,
            is_read: false,
          });
          
          const savedNotification = await notification.save();
          console.log("Notification saved successfully:", savedNotification);
        } else {
          console.warn("Faculty not found for notification:", prof_name);
          
          // Fallback notification (if faculty name not matched)
          const fallbackNotification = new Notification({
            notification_id: generateNotificationId(),
            recipient_id: "unknown",
            recipient_type: "Faculty",
            recipient_name: prof_name,
            title: "New Admin Notice",
            message: notificationMessage,
            notes: notes || "",
            document_type: document_type,
            due_date: new Date(due_date),
            related_notice_id: savedAdminNotice.notice_id,
            is_read: false,
          });
          
          await fallbackNotification.save();
          console.log("Notification created with fallback ID.");
        }
      }
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }
    
    res.status(201).json({
      success: true,
      message: "Admin notice created successfully",
      data: savedAdminNotice,
    });

  } catch (error) {
    console.error("Error creating admin notice:", error);
    
    // More specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Validation Error", 
        error: error.message 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Duplicate notice ID", 
        error: "Notice ID already exists" 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// Get single admin notice
export const getAdminNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminNotice = await AdminNotice.findOne({ notice_id: id });

    if (!adminNotice) return res.status(404).json({ success: false, message: "Admin notice not found" });

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
    const { prof_name, document_type, due_date, notes } = req.body;

    const updateData = {
      prof_name,
      document_type,
      due_date,
      notes: notes || "",
      updated_at: new Date()
    };

    const updated = await AdminNotice.findOneAndUpdate(
      { notice_id: id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Admin notice not found" });

    // Update notification message
    const notificationMessage = `You have an updated admin notice for document submission`;

    // Update notifications
    await Notification.updateMany(
      { related_notice_id: id },
      {
        message: notificationMessage,
        notes: notes || "",
        document_type,
        due_date,
      }
    );
    
    res.status(200).json({ success: true, message: "Admin notice updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating admin notice:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete admin notice
export const deleteAdminNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AdminNotice.findOneAndDelete({ notice_id: id });

    if (!deleted) return res.status(404).json({ success: false, message: "Admin notice not found" });

    // Delete linked notification
    await Notification.deleteMany({ related_notice_id: id });

    res.status(200).json({ success: true, message: "Admin notice deleted successfully", data: deleted });
  } catch (error) {
    console.error("Error deleting admin notice:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};