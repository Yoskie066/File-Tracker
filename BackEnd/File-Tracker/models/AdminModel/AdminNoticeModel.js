import mongoose from "mongoose";

const adminNoticeSchema = new mongoose.Schema(
  {
    notice_id: { type: String, required: true, unique: true },
    prof_name: { type: String, required: true },
    document_type: { type: String, required: true },
    due_date: { type: Date, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const AdminNotice = mongoose.model("AdminNotice", adminNoticeSchema);
export default AdminNotice;