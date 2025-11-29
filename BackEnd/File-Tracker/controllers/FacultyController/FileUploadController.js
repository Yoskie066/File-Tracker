import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";
import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js"; // Import FacultyLoaded
import multer from "multer";
import path from "path";
import fs from "fs";
import { createFileHistory } from "../../controllers/FacultyController/FileHistoryController.js";
import { autoSyncDeliverable } from "../AdminController/AdminDeliverablesController.js";

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const facultyId = req.faculty?.facultyId || 'unknown';
    const uploadDir = `uploads/${facultyId}/`;
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const originalName = file.originalname.replace(/\s+/g, '_');
    cb(null, "file-" + uniqueSuffix + path.extname(originalName));
  },
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

// Get subject title from FacultyLoaded
const getSubjectTitle = async (facultyId, subjectCode, courseSection) => {
  try {
    const facultyLoaded = await FacultyLoaded.findOne({
      faculty_id: facultyId,
      subject_code: subjectCode,
      course_section: courseSection
    });
    
    return facultyLoaded ? facultyLoaded.subject_title : 'Unknown Subject';
  } catch (error) {
    console.error("Error fetching subject title:", error);
    return 'Unknown Subject';
  }
};

// Update Task Deliverables when file status changes 
const updateTaskDeliverables = async (fileData) => {
  try {
    const { faculty_id, faculty_name, subject_code, course_section, document_type, status } = fileData;
    
    console.log(`Syncing Task Deliverables for: ${subject_code}-${courseSection}`);
    console.log(`Document Type: ${document_type}, Status: ${status}`);

    // Map document_type to TaskDeliverables field name
    const fieldName = mapDocumentTypeToField(document_type);
    if (!fieldName) {
      console.warn(`No mapping found for document type: ${document_type}`);
      return;
    }

    // Find the corresponding TaskDeliverables
    let taskDeliverables = await TaskDeliverables.findOne({
      faculty_id,
      subject_code,
      course_section
    });

    if (taskDeliverables) {
      // Update ONLY the specific field based on document type and status
      const updateData = { 
        [fieldName]: status,
        updated_at: new Date()
      };
      
      const updatedTask = await TaskDeliverables.findOneAndUpdate(
        { faculty_id, subject_code, course_section },
        updateData,
        { new: true, runValidators: true }
      );
      
      console.log(`Updated TaskDeliverables: ${subject_code}-${courseSection}`);
      console.log(`Field: ${fieldName} = ${status}`);
      console.log(`Updated document:`, updatedTask);
    } else {
      console.warn(`No TaskDeliverables found for ${subject_code}-${courseSection}`);
      // Create new TaskDeliverables if doesn't exist
      const task_deliverables_id = generateFileId();
      
      const newTaskDeliverables = new TaskDeliverables({
        task_deliverables_id,
        faculty_id,
        faculty_name,
        subject_code,
        course_section,
        [fieldName]: status
      });

      const savedTask = await newTaskDeliverables.save();
      console.log(`Created new TaskDeliverables for ${subject_code}-${courseSection}`);
      console.log(`Field: ${fieldName} = ${status}`);
      console.log(`New document:`, savedTask);
    }
  } catch (error) {
    console.error("Error updating TaskDeliverables:", error);
    throw error;
  }
};

// File Upload Controller
export const uploadFile = async (req, res) => {
  try {
    console.log("Upload request body:", req.body);
    console.log("Upload request file:", req.file);
    console.log("Faculty user:", req.faculty);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    if (!req.faculty || !req.faculty.facultyId || !req.faculty.facultyName) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(401).json({
        success: false,
        message: "Faculty authentication required",
      });
    }

    const { file_name, document_type, subject_code, course_section, tos_type } = req.body;

    console.log("Parsed form data:", { file_name, document_type, subject_code, course_section, tos_type });

    // Basic validation
    if (!document_type || !subject_code || !course_section) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Document type, subject code, and course section are required",
      });
    }

    // Validate TOS type only if document type is 'tos'
    if (document_type === 'tos' && !tos_type) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "TOS type is required for TOS files",
      });
    }

    // Get subject title from FacultyLoaded
    const subject_title = await getSubjectTitle(req.faculty.facultyId, subject_code, course_section);

    const file_id = generateFileId();

    // Determine the final document type
    let finalDocumentType = document_type;
    let finalTosType = null;

    // If document_type is 'tos', convert to specific TOS type
    if (document_type === 'tos' && tos_type) {
      finalDocumentType = `tos-${tos_type}`;
      finalTosType = tos_type;
    }

    console.log("Creating file with:", { finalDocumentType, finalTosType });

    const newFile = new FileManagement({
      file_id,
      faculty_id: req.faculty.facultyId,
      faculty_name: req.faculty.facultyName,
      file_name: file_name || req.file.originalname,
      document_type: finalDocumentType,
      tos_type: finalTosType, // This will be null for non-TOS files
      subject_code,
      course_section,
      subject_title, // Add subject title
      status: "pending", 
      file_path: req.file.path,
      original_name: req.file.originalname,
      file_size: req.file.size,
    });

    const savedFile = await newFile.save();
    console.log("File saved successfully:", savedFile);

    // Create file history record
    try {
      await createFileHistory({
        file_name: savedFile.file_name,
        document_type: savedFile.document_type,
        tos_type: savedFile.tos_type,
        faculty_id: savedFile.faculty_id,
        subject_code: savedFile.subject_code,
        course_section: savedFile.course_section,
        date_submitted: new Date()
      });
      console.log("File history created");
    } catch (historyError) {
      console.error("Error creating file history:", historyError);
      // Don't fail the upload if history fails
    }

    // Update Task Deliverables
    try {
      await updateTaskDeliverables({
        faculty_id: savedFile.faculty_id,
        faculty_name: savedFile.faculty_name,
        subject_code: savedFile.subject_code,
        course_section: savedFile.course_section,
        document_type: savedFile.document_type,
        status: savedFile.status
      });
      console.log("Task deliverables updated");
    } catch (taskError) {
      console.error("Error updating task deliverables:", taskError);
      // Don't fail the upload if task deliverables update fails
    }

    // Auto-sync to Admin Deliverables
    try {
      await autoSyncDeliverable({
        faculty_id: savedFile.faculty_id,
        faculty_name: savedFile.faculty_name,
        subject_code: savedFile.subject_code,
        course_section: savedFile.course_section,
        subject_title: savedFile.subject_title,
        file_name: savedFile.file_name,
        document_type: savedFile.document_type,
        tos_type: savedFile.tos_type,
        uploaded_at: savedFile.uploaded_at,
        status: savedFile.status
      });
      console.log("Admin deliverables synced");
    } catch (syncError) {
      console.error("Error syncing admin deliverables:", syncError);
      // Don't fail the upload if sync fails
    }

    res.status(201).json({
      success: true,
      message: "File uploaded successfully and pending admin approval",
      data: savedFile,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Server error during file upload",
      error: error.message,
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

// DOWNLOAD FILE
export const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileManagement.findOne({ file_id: id });

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Check if file exists
    if (!fs.existsSync(file.file_path)) {
      console.error(`File not found at path: ${file.file_path}`);
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Length', file.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({
        success: false,
        message: "Error downloading file",
      });
    });

  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE FILE
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileManagement.findOne({ file_id: id });

    if (!file)
      return res.status(404).json({ success: false, message: "File not found" });

    if (fs.existsSync(file.file_path)) fs.unlinkSync(file.file_path);

    await FileManagement.findOneAndDelete({ file_id: id });

    res.status(200).json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// UPDATE FILE STATUS 
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

    // Update corresponding TaskDeliverables with the EXACT same status
    await updateTaskDeliverables(updatedFile);

    // AUTO-SYNC TO ADMIN DELIVERABLES 
    await autoSyncDeliverable({
      faculty_id: updatedFile.faculty_id,
      faculty_name: updatedFile.faculty_name,
      subject_code: updatedFile.subject_code,
      course_section: updatedFile.course_section,
      subject_title: updatedFile.subject_title,
      file_name: updatedFile.file_name,
      document_type: updatedFile.document_type,
      tos_type: updatedFile.tos_type,
      uploaded_at: updatedFile.uploaded_at,
      status: updatedFile.status
    });

    console.log(`File status updated and synced across all systems: ${status}`);

    res.status(200).json({
      success: true,
      message: "File status updated successfully and synchronized with Task Deliverables & Admin Deliverables",
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