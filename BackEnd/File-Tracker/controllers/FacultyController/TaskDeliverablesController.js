import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";
import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";

// Generate 10-digit unique task_deliverables_id
const generateTaskDeliverablesId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create task deliverables
export const createTaskDeliverables = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    
    const { subject_code, course_section } = req.body;

    // Validation
    if (!subject_code || !course_section) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject code and course section are required.",
        missing_fields: {
          subject_code: !subject_code,
          course_section: !course_section
        }
      });
    }

    // Check if faculty loaded exists with this subject code and course section
    const facultyLoaded = await FacultyLoaded.findOne({ 
      subject_code, 
      course_section 
    });

    if (!facultyLoaded) {
      return res.status(400).json({ 
        success: false, 
        message: "No faculty loaded found with the provided subject code and course section."
      });
    }

    // Check if task deliverables already exists for this subject and section
    const existingTaskDeliverables = await TaskDeliverables.findOne({
      subject_code,
      course_section
    });

    if (existingTaskDeliverables) {
      return res.status(400).json({ 
        success: false, 
        message: "Task deliverables already exist for this subject code and course section."
      });
    }

    const task_deliverables_id = generateTaskDeliverablesId();

    console.log("Creating task deliverables with ID:", task_deliverables_id);

    const newTaskDeliverables = new TaskDeliverables({
      task_deliverables_id,
      subject_code,
      course_section,
      // All other fields will use default "pending" value
    });

    const savedTaskDeliverables = await newTaskDeliverables.save();
    console.log("Task deliverables saved successfully:", savedTaskDeliverables._id);

    res.status(201).json({
      success: true,
      message: "Task deliverables created successfully",
      data: savedTaskDeliverables,
    });

  } catch (error) {
    console.error("❌ Error creating task deliverables:", error);
    
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
        message: "Duplicate task deliverables ID", 
        error: "Task deliverables ID already exists" 
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

// ✅ Get all task deliverables
export const getTaskDeliverables = async (req, res) => {
  try {
    const taskDeliverables = await TaskDeliverables.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: taskDeliverables });
  } catch (error) {
    console.error("❌ Error fetching task deliverables:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get single task deliverables
export const getTaskDeliverablesById = async (req, res) => {
  try {
    const { id } = req.params;
    const taskDeliverables = await TaskDeliverables.findOne({ task_deliverables_id: id });

    if (!taskDeliverables) return res.status(404).json({ success: false, message: "Task deliverables not found" });

    res.status(200).json({ success: true, data: taskDeliverables });
  } catch (error) {
    console.error("❌ Error fetching task deliverables:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


// ✅ Get faculty loadeds for dropdown (renamed to avoid conflict)
export const getFacultyLoadedsForTaskDeliverables = async (req, res) => {
  try {
    const facultyLoadeds = await FacultyLoaded.find().select('subject_code course_section subject_title').sort({ subject_code: 1 });
    res.status(200).json({ success: true, data: facultyLoadeds });
  } catch (error) {
    console.error("❌ Error fetching faculty loadeds:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};