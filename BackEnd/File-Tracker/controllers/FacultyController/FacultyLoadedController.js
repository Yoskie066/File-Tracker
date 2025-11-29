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

// Helper function to get subject title from system variables
const getSubjectTitleFromSystemVariables = async (subjectCode) => {
  try {
    const systemVariable = await SystemVariable.findOne({
      variable_type: 'subject_code',
      variable_name: subjectCode
    });
    
    return systemVariable ? systemVariable.subject_title : '';
  } catch (error) {
    console.error("Error fetching subject title:", error);
    return '';
  }
};

// Auto-create task deliverables for faculty load
const autoCreateTaskDeliverables = async (facultyLoaded) => {
  try {
    console.log("Auto-creating task deliverables for faculty load:", facultyLoaded.faculty_loaded_id);
    
    const taskDeliverablesPromises = facultyLoaded.course_sections.map(async (courseSection) => {
      // Check if task deliverables already exists for this subject and section
      const existingTaskDeliverables = await TaskDeliverables.findOne({
        faculty_id: facultyLoaded.faculty_id,
        subject_code: facultyLoaded.subject_code,
        course_section: courseSection
      });

      if (!existingTaskDeliverables) {
        const newTaskDeliverables = new TaskDeliverables({
          task_deliverables_id: generateTaskDeliverablesId(),
          faculty_id: facultyLoaded.faculty_id,
          faculty_name: facultyLoaded.faculty_name || "Faculty",
          subject_code: facultyLoaded.subject_code,
          course_section: courseSection,
          // All statuses default to "pending"
          syllabus: "pending",
          tos_midterm: "pending",
          tos_final: "pending",
          midterm_exam: "pending",
          final_exam: "pending",
          instructional_materials: "pending"
        });

        return newTaskDeliverables.save();
      } else {
        console.log(`Task deliverables already exists for ${facultyLoaded.subject_code}-${courseSection}`);
        return null;
      }
    });

    const results = await Promise.all(taskDeliverablesPromises);
    const created = results.filter(result => result !== null);
    
    console.log(`Auto-created ${created.length} task deliverables for faculty load ${facultyLoaded.faculty_loaded_id}`);
    return created;
    
  } catch (error) {
    console.error("Error auto-creating task deliverables:", error);
    throw error;
  }
};

// Create faculty load - NOW WITH MULTIPLE COURSE SECTIONS
export const createFacultyLoaded = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Authenticated faculty:", req.faculty);
    
    const { subject_code, course_sections, semester, school_year } = req.body;

    // Validation
    if (!subject_code || !course_sections || !semester || !school_year) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields must be filled.",
        missing_fields: {
          subject_code: !subject_code,
          course_sections: !course_sections,
          semester: !semester,
          school_year: !school_year,
        }
      });
    }

    // Check if course_sections is an array and not empty
    if (!Array.isArray(course_sections) || course_sections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one course section must be selected."
      });
    }

    // Check if faculty is authenticated
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again."
      });
    }

    // Get subject title from system variables
    const subject_title = await getSubjectTitleFromSystemVariables(subject_code);
    
    if (!subject_title) {
      return res.status(400).json({
        success: false,
        message: "Subject title not found for the selected subject code. Please check system variables."
      });
    }

    // Check for duplicate faculty load (same subject, semester, school year for this faculty)
    const existingFacultyLoaded = await FacultyLoaded.findOne({
      faculty_id: req.faculty.facultyId,
      subject_code,
      semester,
      school_year
    });

    if (existingFacultyLoaded) {
      return res.status(409).json({
        success: false,
        message: "A faculty load with the same Subject Code, Semester, and School Year already exists."
      });
    }

    const faculty_loaded_id = generateFacultyLoadedId();

    console.log("Creating faculty load with ID:", faculty_loaded_id, "for faculty:", req.faculty.facultyId);
    console.log("Subject details:", { subject_code, subject_title, course_sections, semester, school_year });

    const newFacultyLoaded = new FacultyLoaded({
      faculty_loaded_id,
      faculty_id: req.faculty.facultyId,
      subject_code,
      subject_title,
      course_sections, // NOW AN ARRAY
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

    // AUTO SYNC: Create task deliverables for each course section
    try {
      const createdTaskDeliverables = await autoCreateTaskDeliverables({
        ...savedFacultyLoaded.toObject(),
        faculty_name: req.faculty.facultyName
      });
      console.log(`Auto-created ${createdTaskDeliverables.length} task deliverables`);
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
    const { subject_code, course_sections, semester, school_year } = req.body;

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

    // Check if course_sections is an array and not empty
    if (!Array.isArray(course_sections) || course_sections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one course section must be selected."
      });
    }

    // Get subject title from system variables for the new subject code
    const subject_title = await getSubjectTitleFromSystemVariables(subject_code);
    
    if (!subject_title) {
      return res.status(400).json({
        success: false,
        message: "Subject title not found for the selected subject code. Please check system variables."
      });
    }

    // Check for duplicate (excluding the current one)
    const duplicateFacultyLoaded = await FacultyLoaded.findOne({
      faculty_id: req.faculty.facultyId,
      subject_code,
      semester,
      school_year,
      faculty_loaded_id: { $ne: id } // Exclude current record
    });

    if (duplicateFacultyLoaded) {
      return res.status(409).json({
        success: false,
        message: "A faculty load with the same Subject Code, Semester, and School Year already exists."
      });
    }

    const oldSubjectCode = existingFacultyLoaded.subject_code;
    const oldCourseSections = existingFacultyLoaded.course_sections;

    // Update faculty load with new subject_title and course_sections
    const updated = await FacultyLoaded.findOneAndUpdate(
      { 
        faculty_loaded_id: id,
        faculty_id: req.faculty.facultyId 
      },
      { 
        subject_code, 
        subject_title,
        course_sections, // UPDATED FIELD (array)
        semester, 
        school_year, 
        updated_at: new Date() 
      },
      { new: true, runValidators: true }
    );

    // AUTO UPDATE: Handle task deliverables sync for added/removed course sections
    try {
      const addedSections = course_sections.filter(section => !oldCourseSections.includes(section));
      const removedSections = oldCourseSections.filter(section => !course_sections.includes(section));

      // Create task deliverables for newly added sections
      if (addedSections.length > 0) {
        const createPromises = addedSections.map(async (section) => {
          const existing = await TaskDeliverables.findOne({
            faculty_id: req.faculty.facultyId,
            subject_code: subject_code,
            course_section: section
          });

          if (!existing) {
            const newTask = new TaskDeliverables({
              task_deliverables_id: generateTaskDeliverablesId(),
              faculty_id: req.faculty.facultyId,
              faculty_name: req.faculty.facultyName || "Faculty",
              subject_code: subject_code,
              course_section: section,
              syllabus: "pending",
              tos_midterm: "pending",
              tos_final: "pending",
              midterm_exam: "pending",
              final_exam: "pending",
              instructional_materials: "pending"
            });
            return newTask.save();
          }
          return null;
        });

        await Promise.all(createPromises);
        console.log(`Auto-created task deliverables for new sections: ${addedSections.join(', ')}`);
      }

      // Delete task deliverables for removed sections
      if (removedSections.length > 0) {
        const deleteResult = await TaskDeliverables.deleteMany({
          faculty_id: req.faculty.facultyId,
          subject_code: oldSubjectCode,
          course_section: { $in: removedSections }
        });
        console.log(`Auto-deleted task deliverables for removed sections: ${removedSections.join(', ')}, count: ${deleteResult.deletedCount}`);
      }

      // Update subject code for existing sections if it changed
      if (oldSubjectCode !== subject_code) {
        const updateResult = await TaskDeliverables.updateMany(
          { 
            faculty_id: req.faculty.facultyId,
            subject_code: oldSubjectCode,
            course_section: { $in: course_sections }
          },
          { 
            subject_code: subject_code,
            updated_at: new Date() 
          }
        );
        console.log(`Updated subject code from ${oldSubjectCode} to ${subject_code} for ${updateResult.modifiedCount} task deliverables`);
      }

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

    const { subject_code, course_sections } = facultyLoaded;

    // AUTO DELETE: Delete corresponding task deliverables for all course sections
    const deletedTaskDeliverables = await TaskDeliverables.deleteMany({
      subject_code,
      course_section: { $in: course_sections },
      faculty_id: req.faculty.facultyId
    });

    if (deletedTaskDeliverables.deletedCount > 0) {
      console.log(`Auto-deleted ${deletedTaskDeliverables.deletedCount} task deliverables for ${subject_code} sections: ${course_sections.join(', ')}`);
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