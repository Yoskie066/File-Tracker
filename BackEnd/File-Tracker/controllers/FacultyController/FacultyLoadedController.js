import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";

// Generate 10-digit unique faculty_loaded_id
const generateFacultyLoadedId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create faculty loaded
export const createFacultyLoaded = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    
    const { subject_code, subject_title, course_section, semester, school_year, day_time } = req.body;

    // Validation
    if (!subject_code || !subject_title || !course_section || !semester || !school_year || !day_time) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields must be filled.",
        missing_fields: {
          subject_code: !subject_code,
          subject_title: !subject_title,
          course_section: !course_section,
          semester: !semester,
          school_year: !school_year,
          day_time: !day_time
        }
      });
    }

    const faculty_loaded_id = generateFacultyLoadedId();

    console.log("Creating faculty loaded with ID:", faculty_loaded_id);

    const newFacultyLoaded = new FacultyLoaded({
      faculty_loaded_id,
      subject_code,
      subject_title,
      course_section,
      semester,
      school_year,
      day_time,
    });

    const savedFacultyLoaded = await newFacultyLoaded.save();
    console.log("Faculty loaded saved successfully:", savedFacultyLoaded._id);

    res.status(201).json({
      success: true,
      message: "Faculty loaded created successfully",
      data: savedFacultyLoaded,
    });

  } catch (error) {
    console.error("❌ Error creating faculty loaded:", error);
    
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
        message: "Duplicate faculty loaded ID", 
        error: "Faculty loaded ID already exists" 
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

// ✅ Get all faculty loadeds
export const getFacultyLoadeds = async (req, res) => {
  try {
    const facultyLoadeds = await FacultyLoaded.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: facultyLoadeds });
  } catch (error) {
    console.error("❌ Error fetching faculty loadeds:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get single faculty loaded
export const getFacultyLoadedById = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyLoaded = await FacultyLoaded.findOne({ faculty_loaded_id: id });

    if (!facultyLoaded) return res.status(404).json({ success: false, message: "Faculty loaded not found" });

    res.status(200).json({ success: true, data: facultyLoaded });
  } catch (error) {
    console.error("❌ Error fetching faculty loaded:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Update faculty loaded
export const updateFacultyLoaded = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_code, subject_title, course_section, semester, school_year, day_time } = req.body;

    // Find the existing faculty loaded to get old values
    const existingFacultyLoaded = await FacultyLoaded.findOne({ faculty_loaded_id: id });
    if (!existingFacultyLoaded) {
      return res.status(404).json({ success: false, message: "Faculty loaded not found" });
    }

    const oldSubjectCode = existingFacultyLoaded.subject_code;
    const oldCourseSection = existingFacultyLoaded.course_section;

    // Update faculty loaded
    const updated = await FacultyLoaded.findOneAndUpdate(
      { faculty_loaded_id: id },
      { subject_code, subject_title, course_section, semester, school_year, day_time, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Faculty loaded not found" });

    // AUTO UPDATE: Update corresponding task deliverables if subject_code or course_section changed
    if (oldSubjectCode !== subject_code || oldCourseSection !== course_section) {
      await TaskDeliverables.findOneAndUpdate(
        { subject_code: oldSubjectCode, course_section: oldCourseSection },
        { subject_code, course_section, updated_at: new Date() }
      );
      console.log(`✅ Auto-updated task deliverables from ${oldSubjectCode}-${oldCourseSection} to ${subject_code}-${course_section}`);
    }

    res.status(200).json({ success: true, message: "Faculty loaded updated successfully", data: updated });
  } catch (error) {
    console.error("❌ Error updating faculty loaded:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Delete faculty loaded - AUTO DELETE TASK DELIVERABLES
export const deleteFacultyLoaded = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the faculty loaded first to get subject_code and course_section
    const facultyLoaded = await FacultyLoaded.findOne({ faculty_loaded_id: id });
    if (!facultyLoaded) {
      return res.status(404).json({ success: false, message: "Faculty loaded not found" });
    }

    const { subject_code, course_section } = facultyLoaded;

    // AUTO DELETE: Delete corresponding task deliverables
    const deletedTaskDeliverables = await TaskDeliverables.findOneAndDelete({
      subject_code,
      course_section
    });

    if (deletedTaskDeliverables) {
      console.log(`✅ Auto-deleted task deliverables for ${subject_code}-${course_section}`);
    }

    // Delete faculty loaded
    const deleted = await FacultyLoaded.findOneAndDelete({ faculty_loaded_id: id });

    res.status(200).json({ 
      success: true, 
      message: "Faculty loaded and corresponding task deliverables deleted successfully", 
      data: {
        faculty_loaded: deleted,
        task_deliverables: deletedTaskDeliverables
      }
    });
  } catch (error) {
    console.error("❌ Error deleting faculty loaded:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};