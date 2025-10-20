import mongoose from "mongoose";

const fileManagementSchema = new mongoose.Schema(
  {
    file_id: { type: String, required: true, unique: true },
    faculty_id: { type: String, required: true }, 
    faculty_name: { type: String, required: true }, 
    file_name: { type: String, required: true },
    file_type: { 
      type: String, 
      required: true,
      enum: ['syllabus', 'tos', 'midterm-exam', 'final-exam', 'instructional-materials']
    },
    status: { 
      type: String, 
      default: "completed", 
      enum: ["pending", "completed", "rejected"]
    },
    subject_code: { type: String, required: true }, 
    course_section: { type: String, required: true },
    file_path: { type: String, required: true },
    original_name: { type: String, required: true },
    file_size: { type: Number, required: true },
    uploaded_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const FileManagement = mongoose.model("FileManagement", fileManagementSchema);
export default FileManagement;