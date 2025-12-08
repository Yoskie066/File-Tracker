import mongoose from "mongoose";

const fileHistorySchema = new mongoose.Schema(
  {
    file_name: { 
      type: String, 
      required: true 
    },
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
    date_submitted: { 
      type: Date, 
      default: Date.now 
    },
    faculty_id: { 
      type: String, 
      required: true 
    },
    subject_code: { 
      type: String, 
      required: true 
    },
    course_sections: { 
      type: [String], 
      required: true 
    }
  },
  { 
    versionKey: false
  }
);

// Index for better query performance
fileHistorySchema.index({ faculty_id: 1, date_submitted: -1 });
fileHistorySchema.index({ date_submitted: -1 });

const FileHistory = mongoose.model("FileHistory", fileHistorySchema);
export default FileHistory;