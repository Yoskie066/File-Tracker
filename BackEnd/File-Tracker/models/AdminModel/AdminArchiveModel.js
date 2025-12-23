import mongoose from "mongoose";

const archiveSchema = new mongoose.Schema(
  {
    file_id: { type: String, required: true },
    faculty_id: { type: String, required: true }, 
    faculty_name: { type: String, required: true }, 
    file_name: { type: String, required: true },
    document_type: { 
      type: String, 
      required: true,
      enum: ['syllabus', 'tos', 'tos-midterm', 'tos-final', 'midterm-exam', 'final-exam', 'instructional-materials'] 
    },
    tos_type: {  
      type: String,
      enum: ['midterm', 'final', null],
      default: null
    },
    status: { 
      type: String, 
      enum: ["pending", "completed", "rejected"]
    },
    subject_code: { type: String, required: true }, 
    subject_title: { type: String, required: true },
    course: { type: String, required: true }, 
    semester: { type: String, required: true },
    school_year: { type: String, required: true },
    file_path: { type: String, required: true },
    original_name: { type: String, required: true },
    file_size: { type: Number, required: true },
    uploaded_at: { type: Date, required: true },
    archived_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const Archive = mongoose.model("Archive", archiveSchema);
export default Archive;