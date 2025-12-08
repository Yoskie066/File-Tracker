import SystemVariable from "../../models/AdminModel/SystemVariableModel.js";

// Generate 10-digit unique variable_id
const generateVariableId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create system variable - MODIFIED
export const createSystemVariable = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    
    const { variable_type, created_by } = req.body;
    let variable_name, subject_title, subject_code;

    // Validation 
    if (!variable_type || !created_by) {
      return res.status(400).json({ 
        success: false, 
        message: "Variable Type and Created By are required.",
      });
    }

    // Extract data based on variable_type
    if (variable_type === 'subject_code') {
      subject_code = req.body.subject_code;
      subject_title = req.body.subject_title;
      if (!subject_code || !subject_title) {
        return res.status(400).json({ 
          success: false, 
          message: "Subject Code and Subject Title are required for Subject Code type.",
        });
      }
      variable_name = subject_code;
    } else if (variable_type === 'course_section') {
      const course_section = req.body.course_section;
      if (!course_section) {
        return res.status(400).json({ 
          success: false, 
          message: "Course/Section is required for Course Section type.",
        });
      }
      variable_name = course_section;
    } else if (variable_type === 'semester') {
      const semester = req.body.semester;
      if (!semester) {
        return res.status(400).json({ 
          success: false, 
          message: "Semester is required for Semester type.",
        });
      }
      variable_name = semester;
    } else if (variable_type === 'academic_year') {
      const academic_year = req.body.academic_year;
      if (!academic_year) {
        return res.status(400).json({ 
          success: false, 
          message: "Academic Year is required for Academic Year type.",
        });
      }
      variable_name = academic_year;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid variable type.",
      });
    }

    // Check for duplicate
    const existingVariable = await SystemVariable.findOne({
      variable_type,
      variable_name
    });

    if (existingVariable) {
      return res.status(409).json({
        success: false,
        message: `A ${variable_type.replace('_', ' ')} with this name already exists.`
      });
    }

    const variable_id = generateVariableId();
    console.log("Creating system variable with ID:", variable_id);

    const newVariable = new SystemVariable({
      variable_id,
      variable_name,
      variable_type,
      subject_title: variable_type === 'subject_code' ? subject_title : undefined,
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
      return res.status(400).json({ success: false, message: "Duplicate variable ID" });
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

// Get system variables by category/type
export const getVariablesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const variables = await SystemVariable.find({ variable_type: category }).sort({ created_at: -1 });
    res.status(200).json({ success: true, data: variables });
  } catch (error) {
    console.error("Error fetching system variables by category:", error);
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

// Update system variable - MODIFIED
export const updateSystemVariable = async (req, res) => {
  try {
    const { id } = req.params;
    const { variable_type } = req.body;
    let variable_name, subject_title;

    // Find existing variable
    const existingVariable = await SystemVariable.findOne({ variable_id: id });
    if (!existingVariable) {
      return res.status(404).json({ success: false, message: "System variable not found" });
    }

    // Extract data based on variable_type
    if (variable_type === 'subject_code') {
      variable_name = req.body.subject_code;
      subject_title = req.body.subject_title;
      if (!variable_name || !subject_title) {
        return res.status(400).json({ 
          success: false, 
          message: "Subject Code and Subject Title are required for Subject Code type.",
        });
      }
    } else if (variable_type === 'course_section') {
      variable_name = req.body.course_section;
      if (!variable_name) {
        return res.status(400).json({ 
          success: false, 
          message: "Course/Section is required for Course Section type.",
        });
      }
    } else if (variable_type === 'semester') {
      variable_name = req.body.semester;
      if (!variable_name) {
        return res.status(400).json({ 
          success: false, 
          message: "Semester is required for Semester type.",
        });
      }
    } else if (variable_type === 'academic_year') {
      variable_name = req.body.academic_year;
      if (!variable_name) {
        return res.status(400).json({ 
          success: false, 
          message: "Academic Year is required for Academic Year type.",
        });
      }
    }

    // Check for duplicate (excluding current one)
    const duplicateVariable = await SystemVariable.findOne({
      variable_type,
      variable_name,
      variable_id: { $ne: id }
    });

    if (duplicateVariable) {
      return res.status(409).json({
        success: false,
        message: `A ${variable_type.replace('_', ' ')} with this name already exists.`
      });
    }

    const updateData = {
      variable_name, 
      variable_type, 
      updated_at: new Date()
    };

    // Only include subject_title if variable_type is subject_code
    if (variable_type === 'subject_code') {
      updateData.subject_title = subject_title;
    } else {
      // Remove subject_title if changing from subject_code to another type
      updateData.subject_title = undefined;
    }

    const updated = await SystemVariable.findOneAndUpdate(
      { variable_id: id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: "System variable updated successfully", 
      data: updated 
    });

  } catch (error) {
    console.error("Error updating system variable:", error);
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
    
    const typeCounts = await SystemVariable.aggregate([
      { $group: { _id: "$variable_type", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalVariables,
        by_type: typeCounts
      }
    });

  } catch (error) {
    console.error("Error fetching variable stats:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};