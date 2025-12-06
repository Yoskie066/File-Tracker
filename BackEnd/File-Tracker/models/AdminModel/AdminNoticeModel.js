import mongoose from "mongoose";

const adminNoticeSchema = new mongoose.Schema(
  {
    notice_id: { type: String, required: true, unique: true },
    recipient_id: { type: String, required: true }, // facultyId o "ALL"
    prof_name: { type: String, required: true },
    document_type: { 
      type: String, 
      required: true,
      enum: ["syllabus", "tos", "midterm-exam", "final-exam", "instructional-materials", "all-files"]
    },
    tos_type: { 
      type: String, 
      enum: ["midterm", "final"],
      default: null 
    },
    due_date: { type: Date, required: true },
    notes: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const AdminNotice = mongoose.model("AdminNotice", adminNoticeSchema);
export default AdminNotice;