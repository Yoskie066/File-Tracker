import mongoose from "mongoose";

const adminNoticeSchema = new mongoose.Schema(
  {
    notice_id: { type: String, required: true, unique: true },
    prof_name: { type: String, required: true },
    faculty_id: { type: String, default: "" }, 
    document_type: { type: String, required: true },
    tos_type: { 
      type: String, 
      enum: ["", "MIDTERM TOS", "FINAL TOS", "N/A"], 
      default: "" 
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