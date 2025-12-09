import FileHistory from "../../models/FacultyModel/FileHistoryModel.js"

// Utility function to create history record
export const createFileHistory = async (data) => {
  try {
    const historyRecord = new FileHistory(data);
    await historyRecord.save();
    return historyRecord;
  } catch (error) {
    console.error("Error creating file history:", error);
    throw error;
  }
};

// Get faculty-specific file history 
export const getFacultyFileHistory = async (req, res) => {
  try {
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Faculty authentication required",
      });
    }

    const { page = 1, limit = 12, search = "" } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object for faculty
    const filter = { 
      faculty_id: req.faculty.facultyId 
    };
    
    if (search) {
      filter.$or = [
        { file_name: { $regex: search, $options: 'i' } },
        { document_type: { $regex: search, $options: 'i' } },
        { subject_code: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count for pagination
    const total = await FileHistory.countDocuments(filter);
    
    // Get faculty history records with proper sorting
    const history = await FileHistory.find(filter)
      .sort({ date_submitted: -1 }) 
      .skip(skip)
      .limit(limitNum);

    console.log(`Fetched ${history.length} files for faculty: ${req.faculty.facultyId}`);

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalRecords: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching faculty file history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching file history",
      error: error.message,
    });
  }
};