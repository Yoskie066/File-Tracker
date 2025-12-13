import Archive from "../../models/AdminModel/AdminArchiveModel.js";

// Automatic sync: Archive files when status changes to "completed"
export const autoSyncToArchive = async (fileData) => {
  try {
    // Only archive if status is "completed"
    if (fileData.status !== "completed") {
      return;
    }

    // Check if already archived
    const existingArchive = await Archive.findOne({ file_id: fileData.file_id });
    if (existingArchive) {
      return;
    }

    // Create archive record
    const archiveRecord = new Archive({
      file_id: fileData.file_id,
      faculty_id: fileData.faculty_id,
      faculty_name: fileData.faculty_name,
      file_name: fileData.file_name,
      document_type: fileData.document_type,
      tos_type: fileData.tos_type,
      status: fileData.status,
      subject_code: fileData.subject_code,
      subject_title: fileData.subject_title,
      course_sections: fileData.course_sections,
      semester: fileData.semester,
      school_year: fileData.school_year,
      file_path: fileData.file_path,
      original_name: fileData.original_name,
      file_size: fileData.file_size,
      uploaded_at: fileData.uploaded_at,
      archived_at: new Date()
    });

    await archiveRecord.save();
    console.log(`Auto-archived file: ${fileData.file_id}`);
    
  } catch (error) {
    console.error("Error auto-archiving file:", error);
  }
};

// Get all archived files with filtering
export const getArchivedFiles = async (req, res) => {
  try {
    const { 
      faculty_name, 
      document_type, 
      subject_code, 
      course_section, 
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
        { file_id: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply filters
    if (faculty_name) filter.faculty_name = faculty_name;
    if (document_type) filter.document_type = document_type;
    if (subject_code) filter.subject_code = subject_code;
    if (course_section) filter.course_sections = { $in: [course_section] };
    if (status) filter.status = status;
    if (semester) filter.semester = semester;
    if (school_year) filter.school_year = school_year;

    // Sort
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Get archived files
    const archivedFiles = await Archive.find(filter)
      .sort(sort)
      .lean();

    // Get unique values for filters
    const uniqueFaculties = await Archive.distinct('faculty_name');
    const uniqueDocumentTypes = await Archive.distinct('document_type');
    const uniqueSubjects = await Archive.distinct('subject_code');
    const uniqueSemesters = await Archive.distinct('semester');
    const uniqueSchoolYears = await Archive.distinct('school_year');
    
    // Get all course sections
    const allArchived = await Archive.find({}, 'course_sections');
    const uniqueSections = [...new Set(allArchived.flatMap(f => f.course_sections))].sort();

    // Get status counts
    const statusCounts = await Archive.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get year range from uploaded_at
    const yearStats = await Archive.aggregate([
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
        files: archivedFiles,
        filters: {
          faculty_names: uniqueFaculties,
          document_types: uniqueDocumentTypes,
          subject_codes: uniqueSubjects,
          semesters: uniqueSemesters,
          school_years: uniqueSchoolYears,
          course_sections: uniqueSections,
          active_years: activeYears
        },
        stats: {
          total: archivedFiles.length,
          status_counts: statusCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          year_stats: yearStats
        }
      }
    });

  } catch (error) {
    console.error("Error fetching archived files:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get archive statistics
export const getArchiveStatistics = async (req, res) => {
  try {
    // Total archives count
    const totalArchives = await Archive.countDocuments();

    // Archives by uploaded year (not archived_at)
    const archivesByYear = await Archive.aggregate([
      {
        $group: {
          _id: { $year: "$uploaded_at" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    // Archives by semester for current school year
    const currentYear = new Date().getFullYear();
    const archivesBySemester = await Archive.aggregate([
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

    // Archives by document type
    const archivesByType = await Archive.aggregate([
      {
        $group: {
          _id: "$document_type",
          count: { $sum: 1 }
        }
      }
    ]);

    // Top faculties with most archives
    const topFaculties = await Archive.aggregate([
      {
        $group: {
          _id: "$faculty_name",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_archives: totalArchives,
        by_upload_year: archivesByYear,
        by_semester_current_year: archivesBySemester,
        by_document_type: archivesByType,
        top_faculties: topFaculties
      }
    });

  } catch (error) {
    console.error("Error fetching archive statistics:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Delete archived file
export const deleteArchivedFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const deletedFile = await Archive.findOneAndDelete({ file_id: fileId });

    if (!deletedFile) {
      return res.status(404).json({
        success: false,
        message: "Archived file not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Archived file deleted successfully",
      data: deletedFile
    });
  } catch (error) {
    console.error("Error deleting archived file:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};