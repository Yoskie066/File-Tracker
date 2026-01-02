import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema({
  notification_id: {
    type: String,
    required: true,
    unique: true,
  },
  admin_id: {
    type: String,
    required: true,
  },
  faculty_id: {
    type: String,
    required: true,
  },
  faculty_name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
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
  tos_type: {
    type: String,
    default: "",
  },
  subject_code: {
    type: String,
    required: true,
  },
  subject_title: {
    type: String,
    required: true,
  },
  course: {
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
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "reviewed", "archived"]
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