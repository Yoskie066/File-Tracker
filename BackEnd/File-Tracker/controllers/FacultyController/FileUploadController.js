import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createFileHistory } from "../../controllers/FacultyController/FileHistoryController.js";
import { autoSyncDeliverable } from "../AdminController/AdminDeliverablesController.js";

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "file-" + uniqueSuffix + path.extname(file.originalname));
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

// Helper function to map file_type to TaskDeliverables field
const mapFileTypeToField = (fileType, tosType = null) => {
  const mapping = {
    'syllabus': 'syllabus',
    'tos': tosType === 'midterm' ? 'tos_midterm' : 'tos_final',
    'tos-midterm': 'tos_midterm',
    'tos-final': 'tos_final',
    'midterm-exam': 'midterm_exam',
    'final-exam': 'final_exam',
    'instructional-materials': 'instructional_materials'
  };
  return mapping[fileType] || null;
};

// Update Task Deliverables when file status changes 
const updateTaskDeliverables = async (fileData) => {
  try {
    const { faculty_id, faculty_name, subject_code, course_section, file_type, tos_type, status } = fileData;
    
    console.log(`Syncing Task Deliverables for: ${subject_code}-${course_section}`);
    console.log(`File Type: ${file_type}, TOS Type: ${tos_type}, Status: ${status}`);

    // Map file_type to TaskDeliverables field name
    const fieldName = mapFileTypeToField(file_type, tos_type);
    if (!fieldName) {
      console.warn(`No mapping found for file type: ${file_type}`);
      return;
    }

    // Find the corresponding TaskDeliverables
    let taskDeliverables = await TaskDeliverables.findOne({
      subject_code,
      course_section
    });

    if (taskDeliverables) {
      // Update ONLY the specific field based on file type and status
      const updateData = { 
        [fieldName]: status,
        tos_type: tos_type, // Update TOS type
        updated_at: new Date()
      };
      
      const updatedTask = await TaskDeliverables.findOneAndUpdate(
        { subject_code, course_section },
        updateData,
        { new: true, runValidators: true }
      );
      
      console.log(`Updated TaskDeliverables: ${subject_code}-${course_section}`);
      console.log(`Field: ${fieldName} = ${status}, TOS Type: ${tos_type}`);
      console.log(`Updated document:`, updatedTask);
    } else {
      console.warn(`No TaskDeliverables found for ${subject_code}-${course_section}`);
      // Create new TaskDeliverables if doesn't exist
      const task_deliverables_id = generateFileId();
      
      const newTaskDeliverables = new TaskDeliverables({
        task_deliverables_id,
        faculty_id,
        faculty_name,
        subject_code,
        course_section,
        [fieldName]: status,
        tos_type: tos_type, // Set TOS type
      });

      const savedTask = await newTaskDeliverables.save();
      console.log(`Created new TaskDeliverables for ${subject_code}-${course_section}`);
      console.log(`Field: ${fieldName} = ${status}, TOS Type: ${tos_type}`);
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
    console.log("Upload request:", req.body);
    console.log("Faculty user:", req.faculty);

    if (!req.file)
      return res.status(400).json({ success: false, message: "No file uploaded" });

    if (!req.faculty || !req.faculty.facultyId || !req.faculty.facultyName) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(401).json({
        success: false,
        message: "Faculty authentication required",
      });
    }

    const { file_name, file_type, subject_code, course_section, tos_type } = req.body;

    if (!file_type || !subject_code || !course_section) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "File type, subject code, and course section are required",
      });
    }

    // Validate TOS type if file type is TOS
    if (file_type === 'tos' && !tos_type) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "TOS type is required for TOS files",
      });
    }

    const file_id = generateFileId();

    // Determine the final file type and tos_type
    let finalFileType = file_type;
    let finalTosType = tos_type;

    // If file_type is 'tos', update to specific TOS type
    if (file_type === 'tos' && tos_type) {
      finalFileType = `tos-${tos_type}`;
      finalTosType = tos_type;
    }

    const newFile = new FileManagement({
      file_id,
      faculty_id: req.faculty.facultyId,
      faculty_name: req.faculty.facultyName,
      file_name: file_name || req.file.originalname,
      file_type: finalFileType,
      tos_type: finalTosType,
      subject_code,
      course_section,
      status: "pending", 
      file_path: req.file.path,
      original_name: req.file.originalname,
      file_size: req.file.size,
    });

    const savedFile = await newFile.save();

    // Create simplified file history record
    await createFileHistory({
      file_name: savedFile.file_name,
      file_type: savedFile.file_type,
      tos_type: savedFile.tos_type,
      faculty_id: savedFile.faculty_id,
      subject_code: savedFile.subject_code,
      course_section: savedFile.course_section,
      date_submitted: new Date()
    });

    // Update Task Deliverables
    await updateTaskDeliverables({
      faculty_id: savedFile.faculty_id,
      faculty_name: savedFile.faculty_name,
      subject_code: savedFile.subject_code,
      course_section: savedFile.course_section,
      file_type: savedFile.file_type,
      tos_type: savedFile.tos_type,
      status: savedFile.status
    });

    // AUTO-SYNC TO ADMIN DELIVERABLES 
    await autoSyncDeliverable({
      faculty_id: savedFile.faculty_id,
      faculty_name: savedFile.faculty_name,
      subject_code: savedFile.subject_code,
      course_section: savedFile.course_section,
      file_name: savedFile.file_name,
      file_type: savedFile.file_type,
      tos_type: savedFile.tos_type,
      uploaded_at: savedFile.uploaded_at,
      status: savedFile.status
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully and pending admin approval",
      data: savedFile,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: "Server error",
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

    if (!file)
      return res.status(404).json({ success: false, message: "File not found" });

    if (!fs.existsSync(file.file_path))
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });

    res.download(file.file_path, file.original_name);
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
      file_name: updatedFile.file_name,
      file_type: updatedFile.file_type,
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