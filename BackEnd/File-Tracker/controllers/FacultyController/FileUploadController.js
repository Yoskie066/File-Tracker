import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";
import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";
import multer from "multer";
import { createFileHistory } from "../../controllers/FacultyController/FileHistoryController.js";
import path from "path";
import fs from "fs";
import { autoSyncToArchive } from "../../controllers/AdminController/AdminArchiveController.js";
import { createAdminNotification } from "../../controllers/AdminController/AdminNotificationController.js";

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File Filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "image/jpeg",
    "image/png",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (allowedMimes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type."), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

// Generate Unique File ID
const generateFileId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Helper function to map document_type to TaskDeliverables field
const mapDocumentTypeToField = (documentType) => {
  const mapping = {
    'syllabus': 'syllabus',
    'tos-midterm': 'tos_midterm',
    'tos-final': 'tos_final',
    'midterm-exam': 'midterm_exam',
    'final-exam': 'final_exam',
    'instructional-materials': 'instructional_materials'
  };
  return mapping[documentType] || null;
};

// Update Task Deliverables when file status changes
const updateTaskDeliverables = async (fileData) => {
  try {
    const { faculty_id, faculty_name, subject_code, course, document_type, status } = fileData;
    
    console.log(`Syncing Task Deliverables for: ${subject_code} - Course: ${course}`);
    console.log(`Document Type: ${document_type}, Status: ${status}`);

    // Map document_type to TaskDeliverables field name
    const fieldName = mapDocumentTypeToField(document_type);
    if (!fieldName) {
      console.warn(`No mapping found for document type: ${document_type}`);
      return;
    }

    // Update Task Deliverables for the course
    let taskDeliverables = await TaskDeliverables.findOne({
      faculty_id,
      subject_code,
      course
    });

    if (taskDeliverables) {
      const updateData = { 
        [fieldName]: status,
        updated_at: new Date()
      };
      
      const updatedTask = await TaskDeliverables.findOneAndUpdate(
        { faculty_id, subject_code, course },
        updateData,
        { new: true, runValidators: true }
      );
      
      console.log(`Updated TaskDeliverables: ${subject_code}-${course}`);
      return updatedTask;
    } else {
      console.warn(`No TaskDeliverables found for ${subject_code}-${course}`);
      return null;
    }
    
  } catch (error) {
    console.error("Error updating TaskDeliverables:", error);
    throw error;
  }
};

// File Upload Controller
export const uploadFile = async (req, res) => {
  try {
    console.log("📤 Upload request received");
    console.log("Request body:", req.body);
    console.log("Files received:", req.files ? req.files.length : 0);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No files uploaded. Please select at least one file." 
      });
    }

    if (!req.faculty || !req.faculty.facultyId || !req.faculty.facultyName) {
      return res.status(401).json({
        success: false,
        message: "Faculty authentication required. Please log in again.",
      });
    }

    const { file_name, document_type, faculty_loaded_id, tos_type } = req.body;
    console.log("📝 Form data:", { file_name, document_type, faculty_loaded_id, tos_type });

    // Basic validation
    if (!document_type || !faculty_loaded_id) {
      return res.status(400).json({
        success: false,
        message: "Document type and faculty load selection are required",
      });
    }

    // Validate TOS type only if document type is 'tos'
    if (document_type === 'tos' && !tos_type) {
      return res.status(400).json({
        success: false,
        message: "TOS type is required for TOS files. Please select Midterm or Final.",
      });
    }

    // Get faculty loaded data using faculty_loaded_id
    const facultyLoaded = await FacultyLoaded.findOne({
      faculty_loaded_id: faculty_loaded_id,
      faculty_id: req.faculty.facultyId
    });

    if (!facultyLoaded) {
      return res.status(400).json({
        success: false,
        message: "Selected faculty load not found or you don't have permission to access it.",
      });
    }

    const subject_code = facultyLoaded.subject_code;
    const subject_title = facultyLoaded.subject_title;
    const course = facultyLoaded.course;
    const semester = facultyLoaded.semester;
    const school_year = facultyLoaded.school_year;

    if (!course) {
      return res.status(400).json({
        success: false,
        message: "No course found for this subject. Please update your faculty load.",
      });
    }

    console.log("💾 Auto-synced data from faculty load:", { 
      faculty_loaded_id,
      subject_code,
      subject_title,
      course,
      semester, 
      school_year 
    });

    console.log("💾 Saving files locally...");
    
    // Determine the final document type
    let finalDocumentType = document_type;
    if (document_type === 'tos' && tos_type) {
      finalDocumentType = `tos-${tos_type}`;
    }

    // Process each uploaded file
    const allSavedFiles = [];
    
    for (const file of req.files) {
      console.log(`Processing file: ${file.originalname}`);
      
      // Create file record
      const fileId = generateFileId();
      
      const newFile = new FileManagement({
        file_id: fileId,
        faculty_id: req.faculty.facultyId,
        faculty_name: req.faculty.facultyName,
        file_name: file_name || file.originalname,
        document_type: finalDocumentType,
        tos_type: document_type === 'tos' ? tos_type : null,
        subject_code,
        course: course,
        subject_title,
        semester,
        school_year,
        status: "pending", 
        file_path: `/uploads/${file.filename}`,
        original_name: file.originalname,
        file_size: file.size,
        uploaded_at: new Date()
      });

      const savedFile = await newFile.save();
      allSavedFiles.push(savedFile);
      console.log(`✅ Created file record for: ${file.originalname} with course: ${course}`);

      // Create admin notification for this file
      try {
        await createAdminNotification({
          file_id: savedFile.file_id,
          faculty_id: savedFile.faculty_id,
          faculty_name: savedFile.faculty_name,
          file_name: savedFile.file_name,
          document_type: savedFile.document_type,
          tos_type: savedFile.tos_type,
          subject_code: savedFile.subject_code,
          subject_title: savedFile.subject_title,
          course: savedFile.course,
          semester: savedFile.semester,
          school_year: savedFile.school_year
        });
        console.log("📢 Admin notification created for new file upload");
      } catch (notificationError) {
        console.error("⚠️ Error creating admin notification:", notificationError);
      }
    }

    console.log(`🎉 Total created: ${allSavedFiles.length} file records for ${req.files.length} files`);

    // Create file history record
    try {
      for (const savedFile of allSavedFiles) {
        await createFileHistory({
          file_name: savedFile.file_name,
          document_type: savedFile.document_type,
          tos_type: savedFile.tos_type,
          faculty_id: savedFile.faculty_id,
          subject_code: savedFile.subject_code,
          course: savedFile.course,
          date_submitted: new Date()
        });
      }
      console.log("✅ File history created with auto-synced course, semester and school year");
    } catch (historyError) {
      console.error("⚠️ Error creating file history:", historyError);
    }

    // Update Task Deliverables for the course
    try {
      for (const savedFile of allSavedFiles) {
        await updateTaskDeliverables({
          faculty_id: savedFile.faculty_id,
          faculty_name: savedFile.faculty_name,
          subject_code: savedFile.subject_code,
          course: savedFile.course,
          document_type: savedFile.document_type,
          status: savedFile.status
        });
      }
      console.log("✅ Task deliverables updated for course");
    } catch (taskError) {
      console.error("⚠️ Error updating task deliverables:", taskError);
    }

    res.status(201).json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully for: ${subject_code} - ${course} (${semester}, ${school_year}). Status: Pending admin approval.`,
      data: {
        files_uploaded: req.files.length,
        subject: `${subject_code} - ${subject_title}`,
        course: course,
        semester: semester,
        school_year: school_year,
        total_records: allSavedFiles.length,
        file_details: allSavedFiles.map(file => ({
          file_id: file.file_id,
          file_name: file.file_name,
          document_type: file.document_type,
          subject_code: file.subject_code,
          course: file.course,
          semester: file.semester,
          school_year: file.school_year,
          status: file.status,
          uploaded_at: file.uploaded_at
        })),
      },
    });

  } catch (error) {
    console.error("❌ Error uploading files:", error);
    
    // Clean up uploaded files if there's an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file && file.path) {
          try {
            fs.unlinkSync(file.path);
            console.log(`🧹 Cleaned up uploaded file: ${file.filename}`);
          } catch (cleanupError) {
            console.error("Error cleaning up file:", cleanupError);
          }
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error during file upload",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// GET ALL FILES 
export const getFiles = async (req, res) => {
  try {
    const files = await FileManagement.find().sort({ uploaded_at: -1 }); 
    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET FACULTY FILES
export const getFacultyFiles = async (req, res) => {
  try {
    if (!req.faculty || !req.faculty.facultyId) {
      return res.status(401).json({
        success: false,
        message: "Faculty authentication required",
      });
    }

    const files = await FileManagement.find({
      faculty_id: req.faculty.facultyId,
    }).sort({ uploaded_at: -1 });

    res.status(200).json({ success: true, data: files });
  } catch (error) {
    console.error("Error fetching faculty files:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET FILE BY ID
export const getFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileManagement.findOne({ file_id: id });

    if (!file)
      return res.status(404).json({ success: false, message: "File not found" });

    res.status(200).json({ success: true, data: file });
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE FILE - UPDATED FOR LOCAL FILE SYSTEM
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileManagement.findOne({ file_id: id });

    if (!file)
      return res.status(404).json({ success: false, message: "File not found" });

    // Delete file from local storage if it exists
    if (file.file_path) {
      try {
        const fullPath = path.join('.', file.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Deleted file from local storage: ${fullPath}`);
        }
      } catch (fileError) {
        console.error("Error deleting file from local storage:", fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    await FileManagement.findOneAndDelete({ file_id: id });

    res.status(200).json({ 
      success: true, 
      message: "File deleted successfully from both storage and database" 
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update File Status
export const updateFileStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`Updating file status: ${id} to ${status}`);

    const updatedFile = await FileManagement.findOneAndUpdate(
      { file_id: id },
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedFile)
      return res.status(404).json({ success: false, message: "File not found" });

    // Update corresponding TaskDeliverables for the course
    await updateTaskDeliverables({
      faculty_id: updatedFile.faculty_id,
      faculty_name: updatedFile.faculty_name,
      subject_code: updatedFile.subject_code,
      course: updatedFile.course,
      document_type: updatedFile.document_type,
      status: updatedFile.status
    });

    // Auto-sync to archive if status is "completed"
    if (status === "completed") {
      await autoSyncToArchive(updatedFile);
    }

    console.log(`File status updated and synced to Task Deliverables for course: ${updatedFile.course}`);

    res.status(200).json({
      success: true,
      message: "File status updated successfully and synchronized with Task Deliverables",
      data: updatedFile,
    });
  } catch (error) {
    console.error("Error updating file status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Bulk Update All Files 
export const bulkCompleteAllFiles = async (req, res) => {
  try {
    console.log("Bulk completing all files...");
    
    // Get all pending files
    const pendingFiles = await FileManagement.find({ 
      status: { $in: ["pending", "rejected"] } 
    });

    if (pendingFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pending files found to update"
      });
    }

    const updatedFiles = [];
    const errors = [];

    // Update each file to completed
    for (const file of pendingFiles) {
      try {
        // Update file status to completed
        const updatedFile = await FileManagement.findOneAndUpdate(
          { file_id: file.file_id },
          { status: "completed" },
          { new: true, runValidators: true }
        );

        if (updatedFile) {
          // Update corresponding TaskDeliverables for the course
          await updateTaskDeliverables({
            faculty_id: updatedFile.faculty_id,
            faculty_name: updatedFile.faculty_name,
            subject_code: updatedFile.subject_code,
            course: updatedFile.course,
            document_type: updatedFile.document_type,
            status: "completed"
          });

          // Auto-sync to archive
          await autoSyncToArchive(updatedFile);

          updatedFiles.push(updatedFile);
          console.log(`Updated and archived file: ${updatedFile.file_id} - ${updatedFile.file_name}`);
        }
      } catch (fileError) {
        errors.push({
          file_id: file.file_id,
          error: fileError.message
        });
        console.error(`Error updating file ${file.file_id}:`, fileError);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully completed ${updatedFiles.length} files and auto-archived them`,
      data: {
        completed: updatedFiles.length,
        errors: errors.length,
        details: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error("Error in bulk complete:", error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk update",
      error: error.message,
    });
  }
};