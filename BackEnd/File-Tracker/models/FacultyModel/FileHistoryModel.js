import mongoose from "mongoose";

const fileHistorySchema = new mongoose.Schema(
  {
    file_name: { 
      type: String, 
      required: true 
    },
    file_type: { 
      type: String, 
      required: true,
      enum: ['syllabus', 'tos', 'midterm-exam', 'final-exam', 'instructional-materials']
    },
    date_submitted: { 
      type: Date, 
      default: Date.now 
    },
    faculty_id: { 
      type: String, 
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