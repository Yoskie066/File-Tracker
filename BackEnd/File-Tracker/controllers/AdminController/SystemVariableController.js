import SystemVariable from "../../models/AdminModel/SystemVariableModel.js";

// Generate 10-digit unique variable_id
const generateVariableId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Validate Academic Year format
const validateAcademicYear = (year) => {
  if (!year) return false;
  
  // Remove any extra spaces and "A.Y:" prefix if present
  const cleanedYear = year.toString().trim().replace(/^A\.Y\s*:\s*/i, '');
  
  // Check format: exactly 4 digits, hyphen, exactly 4 digits
  const yearRegex = /^\d{4}-\d{4}$/;
  
  if (!yearRegex.test(cleanedYear)) {
    return { valid: false, error: "Academic Year must be in format: 2025-2026" };
  }
  
  const [startYear, endYear] = cleanedYear.split('-').map(Number);
  
  // Check if end year is exactly one year after start year
  if (endYear !== startYear + 1) {
    return { valid: false, error: "Academic Year must be consecutive years (e.g., 2025-2026)" };
  }
  
  return { valid: true, cleaned: `${startYear}-${endYear}` };
};

// Organized Subject List Data
const subjectList = [
  // DCIT Subjects (Common to BOTH)
  { code: 'DCIT-21', title: 'Introduction to Computing', course: 'BOTH' },
  { code: 'DCIT-22', title: 'Computer Programming I', course: 'BOTH' },
  { code: 'DCIT-23', title: 'Computer Programming II', course: 'BOTH' },
  { code: 'DCIT-24', title: 'Information Management', course: 'BOTH' },
  { code: 'DCIT-25', title: 'Data Structures and Algorithms', course: 'BOTH' },
  { code: 'DCIT-26', title: 'Applications Development and Emerging Technologies', course: 'BOTH' },
  { code: 'DCIT-50', title: 'Object Oriented Programming', course: 'BOTH' },
  { code: 'DCIT-55', title: 'Advanced Database System', course: 'BSIT' },
  { code: 'DCIT-55', title: 'Advanced Database Management System', course: 'BSCS' },
  { code: 'DCIT-60', title: 'Methods of Research', course: 'BOTH' },
  { code: 'DCIT-65', title: 'Social and Professional Issues', course: 'BOTH' },

  // INSY Subjects
  { code: 'INSY-50', title: 'Fundamentals of Information Systems', course: 'BSCS' },
  { code: 'INSY-55', title: 'System Analysis and Design', course: 'BSIT' },

  // COSC Subjects
  { code: 'COSC-50', title: 'Discrete Structure', course: 'BSIT' },
  { code: 'COSC-50', title: 'Discrete Structure 1', course: 'BSCS' },
  { code: 'COSC-55', title: 'Discrete Structures II', course: 'BSCS' },
  { code: 'COSC-60', title: 'Digital Logic Design', course: 'BSCS' },
  { code: 'COSC-65', title: 'Architecture and Organization', course: 'BSCS' },
  { code: 'COSC-70', title: 'Software Engineering I', course: 'BSCS' },
  { code: 'COSC-75', title: 'Software Engineering II', course: 'BSCS' },
  { code: 'COSC-80', title: 'Operating Systems', course: 'BSCS' },
  { code: 'COSC-85', title: 'Networks and Communication', course: 'BSCS' },
  { code: 'COSC-90', title: 'Design and Analysis of Algorithm', course: 'BSCS' },
  { code: 'COSC-95', title: 'Programming Languages', course: 'BSCS' },
  { code: 'COSC-100', title: 'Automata Theory and Formal Languages', course: 'BSCS' },
  { code: 'COSC-101', title: 'Computer Graphics and Visual Computing', course: 'BSCS' },
  { code: 'COSC-105', title: 'Intelligent Systems', course: 'BSCS' },
  { code: 'COSC-106', title: 'Introduction to Game Development', course: 'BSCS' },
  { code: 'COSC-110', title: 'Numerical and Symbolic Computation', course: 'BSCS' },
  { code: 'COSC-111', title: 'Internet of Things', course: 'BSCS' },
  { code: 'COSC-199', title: 'Practicum (240 hrs.)', course: 'BSCS' },
  { code: 'COSC-200A', title: 'Undergraduate Thesis I', course: 'BSCS' },
  { code: 'COSC-200B', title: 'Undergraduate Thesis II', course: 'BSCS' },

  // ITEC Subjects
  { code: 'ITEC-50', title: 'Web System and Technologies 1', course: 'BSIT' },
  { code: 'ITEC-50', title: 'Web Systems and Technologies', course: 'BSCS' },
  { code: 'ITEC-55', title: 'Platform Technologies', course: 'BSIT' },
  { code: 'ITEC-60', title: 'Integrated Programming and Technologies 1', course: 'BSIT' },
  { code: 'ITEC-65', title: 'Open Source Technology', course: 'BSIT' },
  { code: 'ITEC-70', title: 'Multimedia Systems', course: 'BSIT' },
  { code: 'ITEC-80', title: 'Introduction to Human Computer Interaction', course: 'BSIT' },
  { code: 'ITEC-80', title: 'Human Computer Interaction', course: 'BSCS' },
  { code: 'ITEC-85', title: 'Information Assurance and Security', course: 'BOTH' },
  { code: 'ITEC-90', title: 'Network Fundamentals', course: 'BSIT' },
  { code: 'ITEC-95', title: 'Quantitative Methods (Modeling & Simulation)', course: 'BSIT' },
  { code: 'ITEC-100', title: 'Information Assurance and Security 2', course: 'BSIT' },
  { code: 'ITEC-101', title: 'IT ELECTIVE 1 (Human Computer Interaction 2)', course: 'BSIT' },
  { code: 'ITEC-105', title: 'Network Management', course: 'BSIT' },
  { code: 'ITEC-106', title: 'IT ELECTIVE 2 (Web System and Technologies 2)', course: 'BSIT' },
  { code: 'ITEC-110', title: 'Systems Administration and Maintenance', course: 'BSIT' },
  { code: 'ITEC-111', title: 'IT ELECTIVE 3 (Integrated Programming and Technologies 2)', course: 'BSIT' },
  { code: 'ITEC-116', title: 'IT ELECTIVE 4 (Systems Integration and Architecture 2)', course: 'BSIT' },
  { code: 'ITEC-199', title: 'Practicum (minimum 486 hours)', course: 'BSIT' },
  { code: 'ITEC-200A', title: 'Capstone Project and Research 1', course: 'BSIT' },
  { code: 'ITEC-200B', title: 'Capstone Project and Research 2', course: 'BSIT' },
];

// Helper function to get subject details by code and course
const getSubjectDetails = (subjectCode, course) => {
  return subjectList.find(subject => 
    subject.code === subjectCode && subject.course === course
  );
};

// Get all subjects for dropdown
export const getAllSubjects = async (req, res) => {
  try {
    // Format subjects for dropdown
    const formattedSubjects = subjectList.map(subject => ({
      value: subject.code,
      label: `${subject.code} - ${subject.title}`,
      subject_code: subject.code,
      subject_title: subject.title,
      course: subject.course
    }));

    // Sort by subject code
    formattedSubjects.sort((a, b) => a.subject_code.localeCompare(b.subject_code));

    res.status(200).json({ 
      success: true, 
      data: formattedSubjects 
    });
  } catch (error) {
    console.error("Error getting all subjects:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get subject codes (for backward compatibility)
export const getSubjectCodes = async (req, res) => {
  try {
    // Group subjects by code with their possible courses
    const groupedSubjects = {};
    
    subjectList.forEach(subject => {
      if (!groupedSubjects[subject.code]) {
        groupedSubjects[subject.code] = {
          code: subject.code,
          titles: [],
          courses: []
        };
      }
      
      if (!groupedSubjects[subject.code].titles.includes(subject.title)) {
        groupedSubjects[subject.code].titles.push(subject.title);
      }
      
      if (!groupedSubjects[subject.code].courses.includes(subject.course)) {
        groupedSubjects[subject.code].courses.push(subject.course);
      }
    });

    // Convert to array and sort by code
    const subjects = Object.values(groupedSubjects).sort((a, b) => 
      a.code.localeCompare(b.code)
    );

    res.status(200).json({ 
      success: true, 
      data: subjects 
    });
  } catch (error) {
    console.error("Error getting subject codes:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get subject titles for a specific code and course
export const getSubjectTitles = async (req, res) => {
  try {
    const { subject_code, course } = req.query;
    
    if (!subject_code || !course) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject code and course are required." 
      });
    }

    const subjects = subjectList.filter(subject => 
      subject.code === subject_code && 
      (subject.course === course || subject.course === 'BOTH')
    );

    res.status(200).json({ 
      success: true, 
      data: subjects.map(s => s.title)
    });
  } catch (error) {
    console.error("Error getting subject titles:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Create system variable
export const createSystemVariable = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    
    const { 
      subject_code, 
      course, 
      semester, 
      academic_year, 
      created_by 
    } = req.body;

    // Validation 
    if (!subject_code || !course || !semester || !academic_year || !created_by) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required.",
        missing_fields: {
          subject_code: !subject_code,
          course: !course,
          semester: !semester,
          academic_year: !academic_year,
          created_by: !created_by
        }
      });
    }

    // Validate course enum
    const validCourses = ['BSCS', 'BSIT', 'BOTH'];
    if (!validCourses.includes(course)) {
      return res.status(400).json({
        success: false,
        message: "Course must be one of: BSCS, BSIT, BOTH"
      });
    }

    // Validate semester enum
    const validSemesters = ['1st Semester', '2nd Semester', 'Summer'];
    if (!validSemesters.includes(semester)) {
      return res.status(400).json({
        success: false,
        message: "Semester must be one of: 1st Semester, 2nd Semester, Summer"
      });
    }

    // Validate Academic Year format
    const validationResult = validateAcademicYear(academic_year);
    if (!validationResult.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validationResult.error,
      });
    }

    // Store with format: A.Y: 2025-2026
    const formattedAcademicYear = `A.Y: ${validationResult.cleaned}`;

    // Get subject title from static list
    const subjectDetails = getSubjectDetails(subject_code, course);
    if (!subjectDetails) {
      return res.status(400).json({
        success: false,
        message: `Subject code '${subject_code}' not found for course '${course}'.`
      });
    }

    const subject_title = subjectDetails.title;

    // Check for duplicate
    const existingVariables = await SystemVariable.find({ 
      subject_code: subject_code,
      course: course,
      semester: semester,
      academic_year: formattedAcademicYear
    });

    if (existingVariables.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A system variable with the same Subject Code, Course, Semester, and Academic Year already exists."
      });
    }

    const variable_id = generateVariableId();
    console.log("Creating system variable with ID:", variable_id);

    const newVariable = new SystemVariable({
      variable_id,
      subject_code,
      subject_title,
      course,
      semester,
      academic_year: formattedAcademicYear,
      created_by,
    });

    const savedVariable = await newVariable.save();
    console.log("System variable saved successfully:", savedVariable._id);

    res.status(201).json({
      success: true,
      message: "System variable created successfully",
      data: savedVariable,
    });

  } catch (error) {
    console.error("Error creating system variable:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "Validation Error", error: error.message });
    }

    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Duplicate entry: This combination of Subject Code, Course, Semester, and Academic Year already exists." 
      });
    }

    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all system variables
export const getSystemVariables = async (req, res) => {
  try {
    const variables = await SystemVariable.find().sort({ created_at: -1 });
    res.status(200).json({ success: true, data: variables });
  } catch (error) {
    console.error("Error fetching system variables:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get single system variable by ID
export const getSystemVariableById = async (req, res) => {
  try {
    const { id } = req.params;
    const variable = await SystemVariable.findOne({ variable_id: id });

    if (!variable) {
      return res.status(404).json({ success: false, message: "System variable not found" });
    }

    res.status(200).json({ success: true, data: variable });

  } catch (error) {
    console.error("Error fetching system variable:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update system variable
export const updateSystemVariable = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      subject_code, 
      course, 
      semester, 
      academic_year 
    } = req.body;

    // Find existing variable
    const existingVariable = await SystemVariable.findOne({ variable_id: id });
    if (!existingVariable) {
      return res.status(404).json({ success: false, message: "System variable not found" });
    }

    // Validate all required fields
    if (!subject_code || !course || !semester || !academic_year) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required.",
      });
    }

    // Validate course enum
    const validCourses = ['BSCS', 'BSIT', 'BOTH'];
    if (!validCourses.includes(course)) {
      return res.status(400).json({
        success: false,
        message: "Course must be one of: BSCS, BSIT, BOTH"
      });
    }

    // Validate semester enum
    const validSemesters = ['1st Semester', '2nd Semester', 'Summer'];
    if (!validSemesters.includes(semester)) {
      return res.status(400).json({
        success: false,
        message: "Semester must be one of: 1st Semester, 2nd Semester, Summer"
      });
    }

    // Validate Academic Year format
    const validationResult = validateAcademicYear(academic_year);
    if (!validationResult.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validationResult.error,
      });
    }

    // Store with format: A.Y: 2025-2026
    const formattedAcademicYear = `A.Y: ${validationResult.cleaned}`;

    // Get subject title from static list
    const subjectDetails = getSubjectDetails(subject_code, course);
    if (!subjectDetails) {
      return res.status(400).json({
        success: false,
        message: `Subject code '${subject_code}' not found for course '${course}'.`
      });
    }

    const subject_title = subjectDetails.title;

    // Check for duplicate (excluding the current one)
    const duplicateVariable = await SystemVariable.findOne({
      subject_code: subject_code,
      course: course,
      semester: semester,
      academic_year: formattedAcademicYear,
      variable_id: { $ne: id }
    });

    if (duplicateVariable) {
      return res.status(409).json({
        success: false,
        message: "A system variable with the same Subject Code, Course, Semester, and Academic Year already exists."
      });
    }

    const updated = await SystemVariable.findOneAndUpdate(
      { variable_id: id },
      { 
        subject_code, 
        subject_title,
        course,
        semester,
        academic_year: formattedAcademicYear,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: "System variable updated successfully", 
      data: updated 
    });

  } catch (error) {
    console.error("Error updating system variable:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry: This combination of Subject Code, Course, Semester, and Academic Year already exists."
      });
    }
    
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete system variable
export const deleteSystemVariable = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SystemVariable.findOneAndDelete({ variable_id: id });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "System variable not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "System variable deleted successfully", 
      data: deleted 
    });

  } catch (error) {
    console.error("Error deleting system variable:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get variable statistics
export const getVariableStats = async (req, res) => {
  try {
    const totalVariables = await SystemVariable.countDocuments();
    
    // Count unique subject_code + course combinations
    const uniqueSubjectCourseCombinations = await SystemVariable.aggregate([
      {
        $group: {
          _id: {
            subject_code: "$subject_code",
            course: "$course"
          }
        }
      },
      {
        $count: "unique_combinations"
      }
    ]);

    // Count by course
    const courseCounts = await SystemVariable.aggregate([
      { $group: { _id: "$course", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalVariables,
        unique_combinations: uniqueSubjectCourseCombinations[0]?.unique_combinations || 0,
        by_course: courseCounts
      }
    });

  } catch (error) {
    console.error("Error fetching variable stats:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get system variables for faculty load selection
export const getVariablesForFacultyLoad = async (req, res) => {
  try {
    const { academic_year, semester } = req.query;
    
    let query = {};
    
    if (academic_year) {
      query.academic_year = academic_year;
    }
    
    if (semester) {
      query.semester = semester;
    }
    
    const variables = await SystemVariable.find(query).sort({ 
      subject_code: 1,
      course: 1 
    });
    
    res.status(200).json({ success: true, data: variables });
  } catch (error) {
    console.error("Error fetching variables for faculty load:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};