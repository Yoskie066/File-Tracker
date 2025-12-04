import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import TaskDeliverables from "../../models/FacultyModel/TaskDeliverablesModel.js";
import FacultyLoaded from "../../models/FacultyModel/FacultyLoadedModel.js";
import multer from "multer";
import { 
  uploadToCloudinary, 
  deleteFromCloudinary,
  getCloudinaryUrl 
} from "../../config/cloudinary.js";
import { createFileHistory } from "../../controllers/FacultyController/FileHistoryController.js";

// Multer Memory Storage Configuration (for Cloudinary)
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

  if (allowedMimes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type."), false);
};

export const upload = multer({
  storage,
  fileFilter,
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

    // Map document_type to TaskDeliverables field name
    const fieldName = mapDocumentTypeToField(document_type);
    if (!fieldName) {
      console.warn(`No mapping found for document type: ${document_type}`);
      return;
    }

    // Update Task Deliverables for EACH course section
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

// File Upload Controller - UPDATED FOR CLOUDINARY
export const uploadFile = async (req, res) => {
  try {
    console.log("📤 Upload request received");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file ? {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      bufferLength: req.file.buffer.length
    } : 'No file');

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded. Please select a file." 
      });
    }

    if (!req.faculty || !req.faculty.facultyId || !req.faculty.facultyName) {
      return res.status(401).json({
        success: false,
        message: "Faculty authentication required. Please log in again.",
      });
    }

    const { file_name, document_type, subject_code, tos_type } = req.body;
    console.log("📝 Form data:", { file_name, document_type, subject_code, tos_type });

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
        message: "TOS type is required for TOS files. Please select Midterm or Final.",
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
        message: "Subject not found in your faculty loads. Please check the subject code.",
      });
    }

    const subject_title = facultyLoaded.subject_title;
    const course_sections = facultyLoaded.course_sections || [];

    if (course_sections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No course sections found for this subject. Please update your faculty load.",
      });
    }

    console.log("☁️ Uploading to Cloudinary...");
    
    // Upload to Cloudinary with specific folder
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      `File-Tracker/faculty_${req.faculty.facultyId}`
    );

    if (!cloudinaryResult || !cloudinaryResult.secure_url) {
      throw new Error("Cloudinary upload failed - no URL returned");
    }

    console.log("✅ Cloudinary upload successful:", {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      bytes: cloudinaryResult.bytes,
      format: cloudinaryResult.format,
      folder: cloudinaryResult.folder
    });

    // Determine the final document type
    let finalDocumentType = document_type;
    if (document_type === 'tos' && tos_type) {
      finalDocumentType = `tos-${tos_type}`;
    }

    // Create file records for EACH course section
    const fileCreationPromises = course_sections.map(async (course_section) => {
      const sectionFileId = generateFileId();
      
      const newFile = new FileManagement({
        file_id: sectionFileId,
        faculty_id: req.faculty.facultyId,
        faculty_name: req.faculty.facultyName,
        file_name: `${file_name || req.file.originalname} - ${course_section}`,
        document_type: finalDocumentType,
        tos_type: document_type === 'tos' ? tos_type : null,
        subject_code,
        course_section,
        subject_title,
        status: "pending", 
        file_path: cloudinaryResult.secure_url,
        cloudinary_url: cloudinaryResult.secure_url,
        cloudinary_public_id: cloudinaryResult.public_id,
        original_name: req.file.originalname,
        file_size: cloudinaryResult.bytes || req.file.size,
        uploaded_at: new Date()
      });

      return newFile.save();
    });

    const savedFiles = await Promise.all(fileCreationPromises);
    console.log(`✅ Created ${savedFiles.length} file records for sections: ${course_sections.join(', ')}`);

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
      console.log("✅ File history created for all sections");
    } catch (historyError) {
      console.error("⚠️ Error creating file history:", historyError);
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
      console.log("✅ Task deliverables updated for all sections");
    } catch (taskError) {
      console.error("⚠️ Error updating task deliverables:", taskError);
    }

    res.status(201).json({
      success: true,
      message: `File uploaded successfully to Cloudinary for ${course_sections.length} course section(s). Status: Pending admin approval.`,
      data: savedFiles.map(file => ({
        file_id: file.file_id,
        file_name: file.file_name,
        document_type: file.document_type,
        subject_code: file.subject_code,
        course_section: file.course_section,
        status: file.status,
        uploaded_at: file.uploaded_at
      })),
    });

  } catch (error) {
    console.error("❌ Error uploading file:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file upload to Cloudinary",
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

// DOWNLOAD FILE - UPDATED FOR CLOUDINARY
export const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Download request for file ID:', id);

    const file = await FileManagement.findOne({ file_id: id });

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found in database" 
      });
    }

    if (!file.cloudinary_url) {
      return res.status(404).json({
        success: false,
        message: "Cloudinary URL not available for this file",
      });
    }

    console.log('📄 File found:', {
      file_id: file.file_id,
      original_name: file.original_name,
      cloudinary_url: file.cloudinary_url
    });

    // Generate direct Cloudinary download URL with forced attachment
    const downloadUrl = `${file.cloudinary_url}?fl_attachment=${encodeURIComponent(file.original_name)}`;
    
    console.log('🔗 Redirecting to Cloudinary URL:', downloadUrl);
    
    // Redirect to Cloudinary with download headers
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Use 302 redirect for immediate download
    res.redirect(302, downloadUrl);

  } catch (error) {
    console.error("❌ Error downloading file:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file download",
      error: error.message,
    });
  }
};

// DELETE FILE - UPDATED FOR CLOUDINARY
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await FileManagement.findOne({ file_id: id });

    if (!file)
      return res.status(404).json({ success: false, message: "File not found" });

    // Delete from Cloudinary if public_id exists
    if (file.cloudinary_public_id) {
      try {
        await deleteFromCloudinary(file.cloudinary_public_id);
        console.log(`Deleted from Cloudinary: ${file.cloudinary_public_id}`);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    await FileManagement.findOneAndDelete({ file_id: id });

    res.status(200).json({ 
      success: true, 
      message: "File deleted successfully from both Cloudinary and database" 
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

    if (!updatedFile)
      return res.status(404).json({ success: false, message: "File not found" });

    // Update corresponding TaskDeliverables
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