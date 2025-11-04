// controllers/FacultyController/TaskDeliverablesController.js
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";
import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";

// Generate 10-digit unique task_deliverables_id
const generateTaskDeliverablesId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create task deliverables - NOW WITH FACULTY ID
export const createTaskDeliverables = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Authenticated faculty:", req.faculty);
    
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

    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    // Check if faculty loaded exists with this subject code and course section FOR THIS FACULTY
    const facultyLoaded = await FacultyLoaded.findOne({ 
      subject_code, 
      course_section,
      faculty_id: req.faculty.facultyId // ADDED FACULTY CHECK
    });

    if (!facultyLoaded) {
      return res.status(400).json({ 
        success: false, 
        message: "No faculty loaded found with the provided subject code and course section for your account."
      });
    }

    // Check if task deliverables already exists for this subject and section FOR THIS FACULTY
    const existingTaskDeliverables = await TaskDeliverables.findOne({
      subject_code,
      course_section,
      faculty_id: req.faculty.facultyId // ADDED FACULTY CHECK
    });

    if (existingTaskDeliverables) {
      return res.status(400).json({ 
        success: false, 
        message: "Task deliverables already exist for this subject code and course section."
      });
    }

    const task_deliverables_id = generateTaskDeliverablesId();

    console.log("Creating task deliverables with ID:", task_deliverables_id, "for faculty:", req.faculty.facultyId);

    const newTaskDeliverables = new TaskDeliverables({
      task_deliverables_id,
      faculty_id: req.faculty.facultyId, // ADDED FACULTY ID
      subject_code,
      course_section,
      // All other fields will use default "pending" value
    });

    const savedTaskDeliverables = await newTaskDeliverables.save();
    console.log("Task deliverables saved successfully for faculty:", req.faculty.facultyId);

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

// ✅ Get all task deliverables - NOW FILTERED BY FACULTY
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
    }).sort({ created_at: -1 });
    
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
    console.error("❌ Error fetching task deliverables:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get single task deliverables - WITH FACULTY CHECK
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
    console.error("❌ Error fetching task deliverables:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get faculty loadeds for dropdown - NOW FILTERED BY FACULTY
export const getFacultyLoadedsForTaskDeliverables = async (req, res) => {
  try {
    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    const facultyLoadeds = await FacultyLoaded.find({ 
      faculty_id: req.faculty.facultyId 
    }).select('subject_code course_section subject_title').sort({ subject_code: 1 });
    
    console.log(`Found ${facultyLoadeds.length} faculty loadeds for dropdown for faculty: ${req.faculty.facultyId}`);
    
    res.status(200).json({ success: true, data: facultyLoadeds });
  } catch (error) {
    console.error("❌ Error fetching faculty loadeds:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};