import HistoryRecord from "../../models/AdminModel/HistoryRecordModel.js";

// Automatic sync: Create history record when status changes
export const autoSyncToHistory = async (fileData) => {
  try {
    // Only create history record for completed files
    if (fileData.status !== "completed") {
      return;
    }

    // Check if already in history
    const existingRecord = await HistoryRecord.findOne({ file_id: fileData.file_id });
    if (existingRecord) {
      return;
    }

    // Create history record
    const historyRecord = new HistoryRecord({
      file_id: fileData.file_id,
      faculty_id: fileData.faculty_id,
      faculty_name: fileData.faculty_name,
      file_name: fileData.file_name,
      document_type: fileData.document_type,
      tos_type: fileData.tos_type,
      status: fileData.status,
      subject_code: fileData.subject_code,
      subject_title: fileData.subject_title,
      course: fileData.course,
      semester: fileData.semester,
      school_year: fileData.school_year,
      file_path: fileData.file_path,
      original_name: fileData.original_name,
      file_size: fileData.file_size,
      uploaded_at: fileData.uploaded_at,
      archived_at: new Date()
    });

    await historyRecord.save();
    console.log(`Created history record: ${fileData.file_id}`);
    
  } catch (error) {
    console.error("Error creating history record:", error);
  }
};

// Get all history records with filtering
export const getHistoryRecords = async (req, res) => {
  try {
    const { 
      faculty_name, 
      document_type, 
      subject_code, 
      course,
      status, 
      semester, 
      school_year,
      search,
      sort_by = "archived_at",
      sort_order = "desc"
    } = req.query;

    // Build filter
    let filter = {};

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { file_name: { $regex: search, $options: 'i' } },
        { faculty_name: { $regex: search, $options: 'i' } },
        { subject_code: { $regex: search, $options: 'i' } },
        { subject_title: { $regex: search, $options: 'i' } },
        { file_id: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply filters
    if (faculty_name) filter.faculty_name = faculty_name;
    if (document_type) filter.document_type = document_type;
    if (subject_code) filter.subject_code = subject_code;
    if (course) filter.course = course;
    if (status) filter.status = status;
    if (semester) filter.semester = semester;
    if (school_year) filter.school_year = school_year;

    // Sort
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Get history records
    const historyRecords = await HistoryRecord.find(filter)
      .sort(sort)
      .lean();

    // Get unique values for filters
    const uniqueFaculties = await HistoryRecord.distinct('faculty_name');
    const uniqueDocumentTypes = await HistoryRecord.distinct('document_type');
    const uniqueSubjects = await HistoryRecord.distinct('subject_code');
    const uniqueSemesters = await HistoryRecord.distinct('semester');
    const uniqueSchoolYears = await HistoryRecord.distinct('school_year');
    const uniqueCourses = await HistoryRecord.distinct('course');

    // Get status counts
    const statusCounts = await HistoryRecord.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get year range from uploaded_at
    const yearStats = await HistoryRecord.aggregate([
      {
        $group: {
          _id: { $year: "$uploaded_at" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    const activeYears = yearStats.map(item => item._id);

    res.status(200).json({
      success: true,
      data: {
        records: historyRecords,
        filters: {
          faculty_names: uniqueFaculties,
          document_types: uniqueDocumentTypes,
          subject_codes: uniqueSubjects,
          courses: uniqueCourses,
          semesters: uniqueSemesters,
          school_years: uniqueSchoolYears,
          active_years: activeYears
        },
        stats: {
          total: historyRecords.length,
          status_counts: statusCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          year_stats: yearStats
        }
      }
    });

  } catch (error) {
    console.error("Error fetching history records:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get history statistics
export const getHistoryStatistics = async (req, res) => {
  try {
    // Total history records count
    const totalRecords = await HistoryRecord.countDocuments();

    // Records by uploaded year
    const recordsByYear = await HistoryRecord.aggregate([
      {
        $group: {
          _id: { $year: "$uploaded_at" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    // Records by semester for current school year
    const currentYear = new Date().getFullYear();
    const recordsBySemester = await HistoryRecord.aggregate([
      {
        $match: {
          uploaded_at: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: "$semester",
          count: { $sum: 1 }
        }
      }
    ]);

    // Records by document type
    const recordsByType = await HistoryRecord.aggregate([
      {
        $group: {
          _id: "$document_type",
          count: { $sum: 1 }
        }
      }
    ]);

    // Top faculties with most records
    const topFaculties = await HistoryRecord.aggregate([
      {
        $group: {
          _id: "$faculty_name",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Records by course
    const recordsByCourse = await HistoryRecord.aggregate([
      {
        $group: {
          _id: "$course",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_records: totalRecords,
        by_upload_year: recordsByYear,
        by_semester_current_year: recordsBySemester,
        by_document_type: recordsByType,
        by_course: recordsByCourse,
        top_faculties: topFaculties
      }
    });

  } catch (error) {
    console.error("Error fetching history statistics:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};