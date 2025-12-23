import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";

// Get all task deliverables 
export const getTaskDeliverables = async (req, res) => {
  try {
    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    const taskDeliverables = await TaskDeliverables.find({ 
      faculty_id: req.faculty.facultyId 
    }).sort({ updated_at: -1 });
    
    console.log(`Found ${taskDeliverables.length} task deliverables for faculty: ${req.faculty.facultyId}`);
    
    res.status(200).json({ 
      success: true, 
      data: taskDeliverables,
      faculty: {
        facultyId: req.faculty.facultyId,
        facultyName: req.faculty.facultyName
      }
    });
  } catch (error) {
    console.error("Error fetching task deliverables:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get single task deliverables 
export const getTaskDeliverablesById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    const taskDeliverables = await TaskDeliverables.findOne({ 
      task_deliverables_id: id,
      faculty_id: req.faculty.facultyId 
    });

    if (!taskDeliverables) return res.status(404).json({ 
      success: false, 
      message: "Task deliverables not found or you don't have permission to access it" 
    });

    res.status(200).json({ success: true, data: taskDeliverables });
  } catch (error) {
    console.error("Error fetching task deliverables:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update task deliverables (for TOS type updates) - KEEP THIS FUNCTION BUT SIMPLIFY IT
export const updateTaskDeliverables = async (req, res) => {
  try {
    const { id } = req.params;
    const { tos_type } = req.body;

    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    // Validate TOS type
    if (tos_type && !['midterm', 'final', 'both'].includes(tos_type)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid TOS type. Must be 'midterm', 'final', or 'both'."
      });
    }

    const taskDeliverables = await TaskDeliverables.findOne({ 
      task_deliverables_id: id,
      faculty_id: req.faculty.facultyId 
    });

    if (!taskDeliverables) {
      return res.status(404).json({ 
        success: false, 
        message: "Task deliverables not found or you don't have permission to access it" 
      });
    }

    // Update TOS type - NOTE: We're keeping this for backward compatibility
    // but the main updates come from FileUploadController now
    if (tos_type !== undefined) {
      taskDeliverables.tos_type = tos_type;
      taskDeliverables.updated_at = new Date();
    }

    const updatedTaskDeliverables = await taskDeliverables.save();

    res.status(200).json({ 
      success: true, 
      message: "Task deliverables updated successfully",
      data: updatedTaskDeliverables 
    });
  } catch (error) {
    console.error("Error updating task deliverables:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};