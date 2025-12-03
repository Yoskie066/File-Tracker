import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";
import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";
import multer from "multer";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFileHistory } from "../../controllers/FacultyController/FileHistoryController.js";
import googleDriveService from "../../config/googleDrive.js";

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer Memory Storage Configuration (for Google Drive upload)
const storage = multer.memoryStorage();

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

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPEG, PNG, PPT, PPTX are allowed."), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
    const { faculty_id, faculty_name, subject_code, course_sections, document_type, status } = fileData;
    
    console.log(`Syncing Task Deliverables for: ${subject_code} - Sections: ${course_sections.join(', ')}`);
    console.log(`Document Type: ${document_type}, Status: ${status}`);

    const fieldName = mapDocumentTypeToField(document_type);
    if (!fieldName) {
      console.warn(`No mapping found for document type: ${document_type}`);
      return;
    }

    const updatePromises = course_sections.map(async (course_section) => {
      let taskDeliverables = await TaskDeliverables.findOne({
        faculty_id,
        subject_code,
        course_section
      });

      if (taskDeliverables) {
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

// File Upload Controller - UPDATED WITH FALLBACK
export const uploadFile = async (req, res) => {
  try {
    console.log("Upload request body:", req.body);
    console.log("Upload request file:", req.file);
    console.log("Faculty user:", req.faculty);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    if (!req.faculty || !req.faculty.facultyId || !req.faculty.facultyName) {
      return res.status(401).json({
        success: false,
        message: "Faculty authentication required",
      });
    }

    const { file_name, document_type, subject_code, tos_type } = req.body;

    console.log("Parsed form data:", { file_name, document_type, subject_code, tos_type });

    // Basic validation
    if (!document_type || !subject_code) {
      return res.status(400).json({
        success: false,
        message: "Document type and subject code are required",
      });
    }

    // Validate TOS type only if document type is 'tos'
    if (document_type === 'tos' && !tos_type) {
      return res.status(400).json({
        success: false,
        message: "TOS type is required for TOS files",
      });
    }

    // Get faculty loaded data
    const facultyLoaded = await FacultyLoaded.findOne({
      faculty_id: req.faculty.facultyId,
      subject_code: subject_code
    });

    if (!facultyLoaded) {
      return res.status(400).json({
        success: false,
        message: "Subject not found in your faculty loads",
      });
    }

    const subject_title = facultyLoaded.subject_title;
    const course_sections = facultyLoaded.course_sections || [];

    if (course_sections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No course sections found for this subject",
      });
    }

    let driveResponse;
    let useLocalStorage = false;
    
    // Try Google Drive upload first
    try {
      console.log("Uploading to Google Drive...");
      driveResponse = await googleDriveService.uploadFile(
        req.file,
        `${req.faculty.facultyId}_${Date.now()}_${req.file.originalname}`,
        req.file.mimetype
      );
      console.log("Google Drive upload successful:", driveResponse);
    } catch (driveError) {
      console.error("Google Drive upload failed, using local storage:", driveError);
      useLocalStorage = true;
      
      // Fallback to local storage
      const uploadsDir = path.join(__dirname, '../../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const fileName = `${req.faculty.facultyId}_${Date.now()}_${req.file.originalname}`;
      const filePath = path.join(uploadsDir, fileName);
      
      fs.writeFileSync(filePath, req.file.buffer);
      
      driveResponse = {
        fileId: fileName,
        fileName: fileName,
        webViewLink: `/uploads/${fileName}`,
        webContentLink: `/uploads/${fileName}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
      
      console.log("File saved locally:", filePath);
    }

    // Determine the final document type
    let finalDocumentType = document_type;
    let finalTosType = null;

    if (document_type === 'tos' && tos_type) {
      finalDocumentType = `tos-${tos_type}`;
      finalTosType = tos_type;
    }

    console.log("Creating file records for sections:", course_sections);

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
        
        // Google Drive fields (or local storage)
        google_drive_file_id: driveResponse.fileId,
        google_drive_file_name: driveResponse.fileName,
        google_drive_view_link: driveResponse.webViewLink,
        google_drive_download_link: driveResponse.webContentLink,
        google_drive_mime_type: driveResponse.mimeType,
        
        // Original file info
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

    const message = useLocalStorage 
      ? `File uploaded successfully to local storage for ${course_sections.length} course section(s) and pending admin approval`
      : `File uploaded successfully to Google Drive for ${course_sections.length} course section(s) and pending admin approval`;

    res.status(201).json({
      success: true,
      message,
      data: savedFiles,
      storage_type: useLocalStorage ? 'local' : 'google_drive',
      storage_info: {
        view_link: driveResponse.webViewLink,
        download_link: driveResponse.webContentLink
      }
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file upload",
      error: error.message,
    });
  }
};

// DOWNLOAD FILE - Updated for Google Drive and local fallback
export const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileManagement.findOne({ file_id: id });

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Check if file is stored locally or in Google Drive
    if (file.google_drive_download_link && !file.google_drive_download_link.startsWith('/uploads/')) {
      // Google Drive file
      try {
        const downloadUrl = await googleDriveService.generateDownloadLink(file.google_drive_file_id);
        res.redirect(downloadUrl);
        return;
      } catch (driveError) {
        console.error("Google Drive download failed:", driveError);
        // Fall back to local if Google Drive fails
      }
    }

    // Local file or fallback
    if (file.google_drive_download_link && file.google_drive_download_link.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../..', file.google_drive_download_link);
      
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', file.google_drive_mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        return;
      }
    }

    // If all else fails, send the stored link
    if (file.google_drive_download_link) {
      res.redirect(file.google_drive_download_link);
    } else {
      res.status(404).json({ success: false, message: "File not found" });
    }
    
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading file",
      error: error.message,
    });
  }
};

// DELETE FILE - Updated for Google Drive and local
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileManagement.findOne({ file_id: id });

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Delete from Google Drive if applicable
    if (file.google_drive_download_link && !file.google_drive_download_link.startsWith('/uploads/')) {
      try {
        await googleDriveService.deleteFile(file.google_drive_file_id);
        console.log(`Deleted file from Google Drive: ${file.google_drive_file_id}`);
      } catch (driveError) {
        console.error("Error deleting from Google Drive:", driveError);
      }
    }
    
    // Delete from local storage if applicable
    if (file.google_drive_download_link && file.google_drive_download_link.startsWith('/uploads/')) {
      try {
        const filePath = path.join(__dirname, '../../..', file.google_drive_download_link);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted local file: ${filePath}`);
        }
      } catch (fsError) {
        console.error("Error deleting local file:", fsError);
      }
    }

    // Delete from database
    await FileManagement.findOneAndDelete({ file_id: id });

    res.status(200).json({ 
      success: true, 
      message: "File deleted successfully" 
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

    if (!updatedFile) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

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

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

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

// BULK UPDATE ALL FILES STATUS TO COMPLETED
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
          // Update corresponding TaskDeliverables
          await updateTaskDeliverables({
            faculty_id: updatedFile.faculty_id,
            faculty_name: updatedFile.faculty_name,
            subject_code: updatedFile.subject_code,
            course_sections: [updatedFile.course_section],
            document_type: updatedFile.document_type,
            status: "completed"
          });

          updatedFiles.push(updatedFile);
          console.log(`Updated file: ${updatedFile.file_id} - ${updatedFile.file_name}`);
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
      message: `Successfully completed ${updatedFiles.length} files`,
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