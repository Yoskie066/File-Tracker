import Requirement from "../../models/AdminModel/RequirementModel.js";
import Notification from "../../models/FacultyModel/NotificationModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";

// Generate 10-digit unique requirement_id
const generateRequirementId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Generate 10-digit unique notification_id
const generateNotificationId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create requirement
export const createRequirement = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    
    const { task_name, prof_name, subject_code, course_section, file_type, due_date, notes } = req.body;

    // Validation
    if (!task_name || !prof_name || !subject_code || !course_section || !file_type || !due_date) {
      return res.status(400).json({ 
        success: false, 
        message: "All required fields must be filled.",
        missing_fields: {
          task_name: !task_name,
          prof_name: !prof_name,
          subject_code: !subject_code,
          course_section: !course_section,
          file_type: !file_type,
          due_date: !due_date
        }
      });
    }

    const requirement_id = generateRequirementId();

    console.log("Creating requirement with ID:", requirement_id);

    const newRequirement = new Requirement({
      requirement_id,
      task_name,
      prof_name,
      subject_code,
      course_section,
      file_type,
      due_date: new Date(due_date), 
      notes: notes || "",
    });

    const savedRequirement = await newRequirement.save();
    console.log("Requirement saved successfully:", savedRequirement._id);

    // Create notification
    try {
      console.log("Looking for faculty with name:", prof_name);
    
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
          title: "New Requirement Assigned",
          message: `You have a new requirement: ${savedRequirement.task_name}`,
          subject_code: subject_code,
          course_section: course_section,
          file_type: file_type,
          due_date: new Date(due_date),
          notes: notes || "",
          related_requirement_id: savedRequirement.requirement_id,
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
          title: "New Task Assignment",
          message: `Admin assigned you a new task: ${task_name} for ${subject_code} - ${course_section}. Due: ${new Date(due_date).toLocaleDateString()}`,
          subject_code: subject_code,
          course_section: course_section,
          file_type: file_type,
          due_date: new Date(due_date),
          notes: notes || "",
          related_requirement_id: savedRequirement.requirement_id,
          is_read: false,
        });
    
        await fallbackNotification.save();
        console.log("Notification created with fallback ID.");
      }
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }
    res.status(201).json({
      success: true,
      message: "Requirement created successfully",
      data: savedRequirement,
    });

  } catch (error) {
    console.error("Error creating requirement:", error);
    
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
        message: "Duplicate requirement ID", 
        error: "Requirement ID already exists" 
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

// Get all requirements
export const getRequirements = async (req, res) => {
  try {
    const requirements = await Requirement.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: requirements });
  } catch (error) {
    console.error("❌ Error fetching requirements:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get single requirement
export const getRequirementById = async (req, res) => {
  try {
    const { id } = req.params;
    const requirement = await Requirement.findOne({ requirement_id: id });

    if (!requirement) return res.status(404).json({ success: false, message: "Requirement not found" });

    res.status(200).json({ success: true, data: requirement });
  } catch (error) {
    console.error("Error fetching requirement:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update requirement
export const updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const { task_name, prof_name, subject_code, course_section, file_type, due_date, notes } = req.body;

    const updated = await Requirement.findOneAndUpdate(
      { requirement_id: id },
      { task_name, prof_name, subject_code, course_section, file_type, due_date, notes, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Requirement not found" });

    await Notification.findOneAndUpdate(
      { related_requirement_id: id },
      {
        message: `You have an updated requirement: ${task_name}`,
        subject_code,
        course_section,
        file_type,
        due_date,
        notes,
      }
    );
    res.status(200).json({ success: true, message: "Requirement updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating requirement:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete requirement
export const deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Requirement.findOneAndDelete({ requirement_id: id });

    if (!deleted) return res.status(404).json({ success: false, message: "Requirement not found" });

    // Delete linked notification
    await Notification.deleteMany({ related_requirement_id: id });

    res.status(200).json({ success: true, message: "Requirement deleted successfully", data: deleted });
  } catch (error) {
    console.error("Error deleting requirement:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
