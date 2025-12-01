import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";
import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createFileHistory } from "../../controllers/FacultyController/FileHistoryController.js";

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
const getSubjectTitle = async (facultyId, subjectCode) => {
  try {
    const facultyLoaded = await FacultyLoaded.findOne({
      faculty_id: facultyId,
      subject_code: subjectCode
    });
    
    return facultyLoaded ? facultyLoaded.subject_title : 'Unknown Subject';
  } catch (error) {
    console.error("Error fetching subject title:", error);
    return 'Unknown Subject';
  }
};

// Update Task Deliverables when file status changes - UPDATED FOR MULTIPLE SECTIONS
const updateTaskDeliverables = async (fileData) => {
  try {
    const { faculty_id, faculty_name, subject_code, course_sections, document_type, status } = fileData;
    
    console.log(`Syncing Task Deliverables for: ${subject_code} - Sections: ${course_sections.join(', ')}`);
    console.log(`Document Type: ${document_type}, Status: ${status}`);

    // Map document_type to TaskDeliverables field name
    const fieldName = mapDocumentTypeToField(document_type);
    if (!fieldName) {
      console.warn(`No mapping found for document type: ${document_type}`);
      return;
    }

    // Update Task Deliverables for EACH course section
    const updatePromises = course_sections.map(async (course_section) => {
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
        
        console.log(`Updated TaskDeliverables: ${subject_code}-${course_section}`);
        console.log(`Field: ${fieldName} = ${status}`);
        return updatedTask;
      } else {
        console.warn(`No TaskDeliverables found for ${subject_code}-${course_section}`);
        return null;
      }
    });

    await Promise.all(updatePromises);
    
  } catch (error) {
    console.error("Error updating TaskDeliverables:", error);
    throw error;
  }
};

// File Upload Controller - UPDATED FOR MULTIPLE COURSE SECTIONS
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

    const { file_name, document_type, subject_code, tos_type } = req.body;

    console.log("Parsed form data:", { file_name, document_type, subject_code, tos_type });

    // Basic validation
    if (!document_type || !subject_code) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Document type and subject code are required",
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

    // Get faculty loaded data to get course sections and subject title
    const facultyLoaded = await FacultyLoaded.findOne({
      faculty_id: req.faculty.facultyId,
      subject_code: subject_code
    });

    if (!facultyLoaded) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Subject not found in your faculty loads",
      });
    }

    const subject_title = facultyLoaded.subject_title;
    const course_sections = facultyLoaded.course_sections || [];

    if (course_sections.length === 0) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "No course sections found for this subject",
      });
    }

    const file_id = generateFileId();

    // Determine the final document type
    let finalDocumentType = document_type;
    let finalTosType = null;

    // If document_type is 'tos', convert to specific TOS type
    if (document_type === 'tos' && tos_type) {
      finalDocumentType = `tos-${tos_type}`;
      finalTosType = tos_type;
    }

    console.log("Creating file with:", { 
      finalDocumentType, 
      finalTosType, 
      course_sections: course_sections.join(', '), 
      subject_title 
    });

    // Create file records for EACH course section
    const fileCreationPromises = course_sections.map(async (course_section) => {
      const sectionFileId = generateFileId();
      
      const newFile = new FileManagement({
        file_id: sectionFileId,
        faculty_id: req.faculty.facultyId,
        faculty_name: req.faculty.facultyName,
        file_name: `${file_name} - ${course_section}`,
        document_type: finalDocumentType,
        tos_type: finalTosType,
        subject_code,
        course_section,
        subject_title,
        status: "pending", 
        file_path: req.file.path,
        original_name: req.file.originalname,
        file_size: req.file.size,
      });

      return newFile.save();
    });

    const savedFiles = await Promise.all(fileCreationPromises);
    console.log(`Created ${savedFiles.length} file records for sections: ${course_sections.join(', ')}`);

    // Create file history records
    try {
      const historyPromises = savedFiles.map(async (savedFile) => {
        await createFileHistory({
          file_name: savedFile.file_name,
          document_type: savedFile.document_type,
          tos_type: savedFile.tos_type,
          faculty_id: savedFile.faculty_id,
          subject_code: savedFile.subject_code,
          course_section: savedFile.course_section,
          date_submitted: new Date()
        });
      });
      await Promise.all(historyPromises);
      console.log("File history created for all sections");
    } catch (historyError) {
      console.error("Error creating file history:", historyError);
    }

    // Update Task Deliverables for ALL sections
    try {
      await updateTaskDeliverables({
        faculty_id: req.faculty.facultyId,
        faculty_name: req.faculty.facultyName,
        subject_code: subject_code,
        course_sections: course_sections,
        document_type: finalDocumentType,
        status: "pending"
      });
      console.log("Task deliverables updated for all sections");
    } catch (taskError) {
      console.error("Error updating task deliverables:", taskError);
    }

    res.status(201).json({
      success: true,
      message: `File uploaded successfully for ${course_sections.length} course section(s) and pending admin approval`,
      data: savedFiles,
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

    if (!fs.existsSync(file.file_path)) {
      console.error(`File not found at path: ${file.file_path}`);
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Length', file.file_size);

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
    await updateTaskDeliverables({
      faculty_id: updatedFile.faculty_id,
      faculty_name: updatedFile.faculty_name,
      subject_code: updatedFile.subject_code,
      course_sections: [updatedFile.course_section],
      document_type: updatedFile.document_type,
      status: updatedFile.status
    });

    console.log(`File status updated and synced to Task Deliverables: ${status}`);

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