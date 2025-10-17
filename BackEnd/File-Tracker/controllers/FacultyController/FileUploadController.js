import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createFileHistory } from "../../controllers/FacultyController/FileHistoryController.js";

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

// File Upload Controller
export const uploadFile = async (req, res) => {
  try {
    console.log("➡️ Upload request:", req.body);
    console.log("👤 Faculty user:", req.faculty);

    if (!req.file)
      return res.status(400).json({ success: false, message: "No file uploaded" });

    if (!req.faculty || !req.faculty.facultyId || !req.faculty.facultyName) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(401).json({
        success: false,
        message: "Faculty authentication required",
      });
    }

    const { file_name, file_type } = req.body;

    if (!file_type) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "File type is required",
      });
    }

    const file_id = generateFileId();

    const newFile = new FileManagement({
      file_id,
      faculty_id: req.faculty.facultyId,
      faculty_name: req.faculty.facultyName,
      file_name: file_name || req.file.originalname,
      file_type,
      file_path: req.file.path,
      original_name: req.file.originalname,
      file_size: req.file.size,
    });

    const savedFile = await newFile.save();

    // Create simplified file history record
    await createFileHistory({
      file_name: savedFile.file_name,
      file_type: savedFile.file_type,
      faculty_id: savedFile.faculty_id,
      date_submitted: new Date()
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: savedFile,
    });
  } catch (error) {
    console.error("❌ Error uploading file:", error);
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
    const files = await FileManagement.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error("❌ Error fetching files:", error);
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
    console.error("❌ Error fetching faculty files:", error);
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
    console.error("❌ Error fetching file:", error);
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
    console.error("❌ Error downloading file:", error);
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
    console.error("❌ Error deleting file:", error);
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

    const updatedFile = await FileManagement.findOneAndUpdate(
      { file_id: id },
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedFile)
      return res.status(404).json({ success: false, message: "File not found" });

    res.status(200).json({
      success: true,
      message: "File status updated successfully",
      data: updatedFile,
    });
  } catch (error) {
    console.error("❌ Error updating file status:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
