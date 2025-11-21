import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";

// Generate 10-digit unique faculty_loaded_id
const generateFacultyLoadedId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create faculty loaded - NOW PROTECTED BY FACULTY ID
export const createFacultyLoaded = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Authenticated faculty:", req.faculty);
    
    const { subject_code, subject_title, course_section, semester, school_year } = req.body;

    // Validation
    if (!subject_code || !subject_title || !course_section || !semester || !school_year) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields must be filled.",
        missing_fields: {
          subject_code: !subject_code,
          subject_title: !subject_title,
          course_section: !course_section,
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

    const faculty_loaded_id = generateFacultyLoadedId();

    console.log("Creating faculty loaded with ID:", faculty_loaded_id, "for faculty:", req.faculty.facultyId);

    const newFacultyLoaded = new FacultyLoaded({
      faculty_loaded_id,
      faculty_id: req.faculty.facultyId, 
      subject_code,
      subject_title,
      course_section,
      semester,
      school_year,
    });

    const savedFacultyLoaded = await newFacultyLoaded.save();
    
    // Update faculty document to include this faculty loaded reference
    await Faculty.findOneAndUpdate(
      { facultyId: req.faculty.facultyId },
      { $push: { facultyLoadeds: savedFacultyLoaded._id } }
    );

    console.log("Faculty loaded saved successfully for faculty:", req.faculty.facultyId);

    res.status(201).json({
      success: true,
      message: "Faculty loaded created successfully",
      data: savedFacultyLoaded,
    });

  } catch (error) {
    console.error("Error creating faculty loaded:", error);
    
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

// Get all faculty loadeds 
export const getFacultyLoadeds = async (req, res) => {
  try {
    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    // Only get faculty loadeds for the logged-in faculty member
    const facultyLoadeds = await FacultyLoaded.find({ 
      faculty_id: req.faculty.facultyId 
    }).sort({ created_at: -1 });
    
    console.log(`Found ${facultyLoadeds.length} faculty loadeds for faculty: ${req.faculty.facultyId}`);
    
    res.status(200).json({ 
      success: true, 
      data: facultyLoadeds,
      faculty: {
        facultyId: req.faculty.facultyId,
        facultyName: req.faculty.facultyName
      }
    });
  } catch (error) {
    console.error("Error fetching faculty loadeds:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get single faculty loaded 
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
        message: "Faculty loaded not found or you don't have permission to access it" 
      });
    }

    res.status(200).json({ success: true, data: facultyLoaded });
  } catch (error) {
    console.error("Error fetching faculty loaded:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update faculty loaded 
export const updateFacultyLoaded = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_code, subject_title, course_section, semester, school_year } = req.body;

    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    // Find the existing faculty loaded with ownership check
    const existingFacultyLoaded = await FacultyLoaded.findOne({ 
      faculty_loaded_id: id,
      faculty_id: req.faculty.facultyId 
    });
    
    if (!existingFacultyLoaded) {
      return res.status(404).json({ 
        success: false, 
        message: "Faculty loaded not found or you don't have permission to update it" 
      });
    }

    const oldSubjectCode = existingFacultyLoaded.subject_code;
    const oldCourseSection = existingFacultyLoaded.course_section;

    // Update faculty loaded
    const updated = await FacultyLoaded.findOneAndUpdate(
      { 
        faculty_loaded_id: id,
        faculty_id: req.faculty.facultyId 
      },
      { 
        subject_code, 
        subject_title, 
        course_section, 
        semester, 
        school_year, 
        updated_at: new Date() 
      },
      { new: true, runValidators: true }
    );

    // AUTO UPDATE: Update corresponding task deliverables if subject_code or course_section changed
    if (oldSubjectCode !== subject_code || oldCourseSection !== course_section) {
      const updateResult = await TaskDeliverables.findOneAndUpdate(
        { 
          subject_code: oldSubjectCode, 
          course_section: oldCourseSection,
          faculty_id: req.faculty.facultyId 
        },
        { 
          subject_code: subject_code, 
          course_section: course_section, 
          updated_at: new Date() 
        },
        { new: true }
      );
      
      if (updateResult) {
        console.log(`Auto-updated task deliverables from ${oldSubjectCode}-${oldCourseSection} to ${subject_code}-${course_section} for faculty: ${req.faculty.facultyId}`);
      } else {
        console.log(`No task deliverables found to update for ${oldSubjectCode}-${oldCourseSection}`);
      }
    }

    res.status(200).json({ success: true, message: "Faculty loaded updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating faculty loaded:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete faculty loaded
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

    // Find the faculty loaded with ownership check
    const facultyLoaded = await FacultyLoaded.findOne({ 
      faculty_loaded_id: id,
      faculty_id: req.faculty.facultyId 
    });
    
    if (!facultyLoaded) {
      return res.status(404).json({ 
        success: false, 
        message: "Faculty loaded not found or you don't have permission to delete it" 
      });
    }

    const { subject_code, course_section } = facultyLoaded;

    // AUTO DELETE: Delete corresponding task deliverables
    const deletedTaskDeliverables = await TaskDeliverables.findOneAndDelete({
      subject_code,
      course_section,
      faculty_id: req.faculty.facultyId
    });

    if (deletedTaskDeliverables) {
      console.log(`Auto-deleted task deliverables for ${subject_code}-${course_section} for faculty: ${req.faculty.facultyId}`);
    } else {
      console.log(`No task deliverables found to delete for ${subject_code}-${course_section}`);
    }

    // Delete faculty loaded
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
      message: "Faculty loaded and corresponding task deliverables deleted successfully", 
      data: {
        faculty_loaded: deleted,
        task_deliverables: deletedTaskDeliverables
      }
    });
  } catch (error) {
    console.error("Error deleting faculty loaded:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};