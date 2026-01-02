import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema({
  notification_id: {
    type: String,
    required: true,
    unique: true,
  },
  faculty_id: {
    type: String,
    required: true,
  },
  faculty_name: {
    type: String,
    required: true,
  },
  file_id: {
    type: String,
    required: true,
  },
  file_name: {
    type: String,
    required: true,
  },
  document_type: {
    type: String,
    required: true,
  },
  subject_code: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  school_year: {
    type: String,
    required: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("AdminNotification", adminNotificationSchema);