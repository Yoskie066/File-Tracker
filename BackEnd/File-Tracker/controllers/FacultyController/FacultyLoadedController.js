import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";
import SystemVariable from "../../models/AdminModel/SystemVariableModel.js"; 

// Generate 10-digit unique faculty_loaded_id
const generateFacultyLoadedId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Generate 10-digit unique task_deliverables_id
const generateTaskDeliverablesId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Get system variable details for auto-fill
const getSystemVariableDetails = async (subject_code, course, semester, school_year) => {
  try {
    const systemVariable = await SystemVariable.findOne({
      subject_code: subject_code,
      course: course,
      semester: semester,
      academic_year: school_year
    });
    
    return systemVariable;
  } catch (error) {
    console.error("Error fetching system variable details:", error);
    return null;
  }
};

// Get available subjects for faculty load dropdown
export const getSubjectsForFacultyLoad = async (req, res) => {
  try {
    const { academic_year, semester, course } = req.query;
    
    let query = {};
    
    if (academic_year) {
      query.academic_year = academic_year;
    }
    
    if (semester) {
      query.semester = semester;
    }
    
    if (course) {
      query.course = course;
    }
    
    const subjects = await SystemVariable.find(query)
      .select('subject_code subject_title course semester academic_year')
      .sort({ subject_code: 1 });
    
    // Format the response
    const formattedSubjects = subjects.map(subject => ({
      value: subject.subject_code,
      label: `${subject.subject_code} - ${subject.subject_title}`,
      subject_title: subject.subject_title,
      course: subject.course,
      semester: subject.semester,
      academic_year: subject.academic_year
    }));
    
    res.status(200).json({ 
      success: true, 
      data: formattedSubjects 
    });
  } catch (error) {
    console.error("Error fetching subjects for faculty load:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Auto-create task deliverables for faculty load
const autoCreateTaskDeliverables = async (facultyLoaded, facultyName) => {
  try {
    console.log("Auto-creating task deliverables for faculty load:", facultyLoaded.faculty_loaded_id);
    
    const newTaskDeliverables = new TaskDeliverables({
      task_deliverables_id: generateTaskDeliverablesId(),
      faculty_id: facultyLoaded.faculty_id,
      faculty_name: facultyName || "Faculty",
      subject_code: facultyLoaded.subject_code,
      subject_title: facultyLoaded.subject_title,
      course: facultyLoaded.course,
      semester: facultyLoaded.semester,
      school_year: facultyLoaded.school_year,
      // All statuses default to "pending"
      syllabus: "pending",
      tos_midterm: "pending",
      tos_final: "pending",
      midterm_exam: "pending",
      final_exam: "pending",
      instructional_materials: "pending"
    });

    await newTaskDeliverables.save();
    console.log(`Task deliverables created for ${facultyLoaded.subject_code}`);
    
    return newTaskDeliverables;
    
  } catch (error) {
    console.error("Error auto-creating task deliverables:", error);
    throw error;
  }
};

// Create faculty load - UPDATED for auto-fill
export const createFacultyLoaded = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Authenticated faculty:", req.faculty);
    
    const { subject_code, course, semester, school_year } = req.body;

    // Validation
    if (!subject_code || !course || !semester || !school_year) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields must be filled.",
        missing_fields: {
          subject_code: !subject_code,
          course: !course,
          semester: !semester,
          school_year: !school_year,
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

    // Get system variable details for auto-fill
    const systemVariable = await getSystemVariableDetails(subject_code, course, semester, school_year);
    
    if (!systemVariable) {
      return res.status(400).json({
        success: false,
        message: "System variable not found for the selected combination. Please check system variables."
      });
    }

    const subject_title = systemVariable.subject_title;

    // Check for duplicate faculty load (same subject, course, semester, school year for this faculty)
    const existingFacultyLoaded = await FacultyLoaded.findOne({
      faculty_id: req.faculty.facultyId,
      subject_code,
      course,
      semester,
      school_year
    });

    if (existingFacultyLoaded) {
      return res.status(409).json({
        success: false,
        message: "A faculty load with the same Subject Code, Course, Semester, and School Year already exists."
      });
    }

    const faculty_loaded_id = generateFacultyLoadedId();

    console.log("Creating faculty load with ID:", faculty_loaded_id, "for faculty:", req.faculty.facultyId);
    console.log("Auto-filled details:", { 
      subject_code, 
      subject_title, 
      course,
      semester, 
      school_year 
    });

    const newFacultyLoaded = new FacultyLoaded({
      faculty_loaded_id,
      faculty_id: req.faculty.facultyId,
      subject_code,
      subject_title,
      course,
      semester,
      school_year,
    });

    const savedFacultyLoaded = await newFacultyLoaded.save();
    
    // Update faculty document to include this faculty load reference
    await Faculty.findOneAndUpdate(
      { facultyId: req.faculty.facultyId },
      { $push: { facultyLoadeds: savedFacultyLoaded._id } }
    );

    console.log("Faculty load saved successfully for faculty:", req.faculty.facultyId);

    // AUTO SYNC: Create task deliverables
    try {
      const createdTaskDeliverables = await autoCreateTaskDeliverables(
        savedFacultyLoaded.toObject(),
        req.faculty.facultyName
      );
      console.log("Auto-created task deliverables");
    } catch (syncError) {
      console.error("Error in auto-sync task deliverables:", syncError);
      // Don't fail the main request if sync fails
    }

    res.status(201).json({
      success: true,
      message: "Faculty load created successfully and task deliverables auto-synced",
      data: savedFacultyLoaded,
    });

  } catch (error) {
    console.error("Error creating faculty load:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Validation Error", 
        error: error.message 
      });
    }
    
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.faculty_loaded_id) {
        return res.status(400).json({ 
          success: false, 
          message: "Duplicate faculty load ID", 
          error: "Faculty load ID already exists" 
        });
      } else {
        return res.status(409).json({
          success: false,
          message: "A faculty load with the same combination already exists for this faculty member."
        });
      }
    }

    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all faculty loads 
export const getFacultyLoadeds = async (req, res) => {
  try {
    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    // Only get faculty loads for the logged-in faculty member
    const facultyLoadeds = await FacultyLoaded.find({ 
      faculty_id: req.faculty.facultyId 
    }).sort({ created_at: -1 });
    
    console.log(`Found ${facultyLoadeds.length} faculty loads for faculty: ${req.faculty.facultyId}`);
    
    res.status(200).json({ 
      success: true, 
      data: facultyLoadeds,
      faculty: {
        facultyId: req.faculty.facultyId,
        facultyName: req.faculty.facultyName
      }
    });
  } catch (error) {
    console.error("Error fetching faculty loads:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get single faculty load 
export const getFacultyLoadedById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    const facultyLoaded = await FacultyLoaded.findOne({ 
      faculty_loaded_id: id,
      faculty_id: req.faculty.facultyId 
    });

    if (!facultyLoaded) {
      return res.status(404).json({ 
        success: false, 
        message: "Faculty load not found or you don't have permission to access it" 
      });
    }

    res.status(200).json({ success: true, data: facultyLoaded });
  } catch (error) {
    console.error("Error fetching faculty load:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update faculty load 
export const updateFacultyLoaded = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_code, course, semester, school_year } = req.body;

    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    // Find the existing faculty load with ownership check
    const existingFacultyLoaded = await FacultyLoaded.findOne({ 
      faculty_loaded_id: id,
      faculty_id: req.faculty.facultyId 
    });
    
    if (!existingFacultyLoaded) {
      return res.status(404).json({ 
        success: false, 
        message: "Faculty load not found or you don't have permission to update it" 
      });
    }

    // Get system variable details for auto-fill
    const systemVariable = await getSystemVariableDetails(subject_code, course, semester, school_year);
    
    if (!systemVariable) {
      return res.status(400).json({
        success: false,
        message: "System variable not found for the selected combination. Please check system variables."
      });
    }

    const subject_title = systemVariable.subject_title;
    const oldSubjectCode = existingFacultyLoaded.subject_code;
    const oldCourse = existingFacultyLoaded.course;

    // Check for duplicate (excluding the current one)
    const duplicateFacultyLoaded = await FacultyLoaded.findOne({
      faculty_id: req.faculty.facultyId,
      subject_code,
      course,
      semester,
      school_year,
      faculty_loaded_id: { $ne: id } // Exclude current record
    });

    if (duplicateFacultyLoaded) {
      return res.status(409).json({
        success: false,
        message: "A faculty load with the same Subject Code, Course, Semester, and School Year already exists."
      });
    }

    // Update faculty load with auto-filled details
    const updated = await FacultyLoaded.findOneAndUpdate(
      { 
        faculty_loaded_id: id,
        faculty_id: req.faculty.facultyId 
      },
      { 
        subject_code, 
        subject_title,
        course,
        semester, 
        school_year, 
        updated_at: new Date() 
      },
      { new: true, runValidators: true }
    );

    // AUTO UPDATE: Update task deliverables
    try {
      const updateResult = await TaskDeliverables.updateMany(
        { 
          faculty_id: req.faculty.facultyId,
          subject_code: oldSubjectCode,
          course: oldCourse
        },
        { 
          subject_code: subject_code,
          subject_title: subject_title,
          course: course,
          semester: semester,
          school_year: school_year,
          updated_at: new Date() 
        }
      );
      console.log(`Updated ${updateResult.modifiedCount} task deliverables for ${subject_code}`);
    } catch (syncError) {
      console.error("Error in auto-sync during update:", syncError);
      // Don't fail the main request if sync fails
    }

    res.status(200).json({ 
      success: true, 
      message: "Faculty load updated successfully and task deliverables synced", 
      data: updated 
    });
  } catch (error) {
    console.error("Error updating faculty load:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A faculty load with the same combination already exists for this faculty member."
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Delete faculty load
export const deleteFacultyLoaded = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    // Find the faculty load with ownership check
    const facultyLoaded = await FacultyLoaded.findOne({ 
      faculty_loaded_id: id,
      faculty_id: req.faculty.facultyId 
    });
    
    if (!facultyLoaded) {
      return res.status(404).json({ 
        success: false, 
        message: "Faculty load not found or you don't have permission to delete it" 
      });
    }

    const { subject_code, course } = facultyLoaded;

    // AUTO DELETE: Delete corresponding task deliverables
    const deletedTaskDeliverables = await TaskDeliverables.deleteMany({
      subject_code,
      course,
      faculty_id: req.faculty.facultyId
    });

    if (deletedTaskDeliverables.deletedCount > 0) {
      console.log(`Auto-deleted ${deletedTaskDeliverables.deletedCount} task deliverables for ${subject_code}`);
    } else {
      console.log(`No task deliverables found to delete for ${subject_code}`);
    }

    // Delete faculty load
    const deleted = await FacultyLoaded.findOneAndDelete({ 
      faculty_loaded_id: id,
      faculty_id: req.faculty.facultyId 
    });

    // Remove from faculty's facultyLoadeds array
    await Faculty.findOneAndUpdate(
      { facultyId: req.faculty.facultyId },
      { $pull: { facultyLoadeds: facultyLoaded._id } }
    );

    res.status(200).json({ 
      success: true, 
      message: "Faculty load and corresponding task deliverables deleted successfully", 
      data: {
        faculty_load: deleted,
        task_deliverables_deleted: deletedTaskDeliverables.deletedCount
      }
    });
  } catch (error) {
    console.error("Error deleting faculty load:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};