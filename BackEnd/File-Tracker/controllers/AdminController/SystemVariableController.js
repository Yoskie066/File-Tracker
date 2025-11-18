import SystemVariable from "../../models/AdminModel/SystemVariableModel.js";

// Generate 10-digit unique variable_id
const generateVariableId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create system variable
export const createSystemVariable = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    
    const { variable_name, variable_type, created_by } = req.body;

    // Validation - removed variable_value from required fields
    if (!variable_name || !variable_type || !created_by) {
      return res.status(400).json({ 
        success: false, 
        message: "All required fields must be filled.",
      });
    }

    const variable_id = generateVariableId();
    console.log("Creating system variable with ID:", variable_id);

    const newVariable = new SystemVariable({
      variable_id,
      variable_name,
      variable_type,
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
    console.error("❌ Error fetching system variables:", error);
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
    console.error("❌ Error fetching system variables by category:", error);
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
    const { variable_name, variable_type } = req.body;

    const updated = await SystemVariable.findOneAndUpdate(
      { variable_id: id },
      { 
        variable_name, 
        variable_type, 
        updated_at: new Date() 
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "System variable not found" });
    }

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