import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  notification_id: {
    type: String,
    required: true,
    unique: true,
  },
  recipient_id: {
    type: String,
    required: true,
  },
  recipient_type: {
    type: String,
    required: true,
    enum: ["Admin", "Faculty"], 
  },
  recipient_name: {
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
  notes: {
    type: String,
    default: "",
  },
  related_notice_id: {
    type: String,
    default: "",
  },
  document_type: {
    type: String,
    default: "",
  },
  tos_type: {
    type: String,
    default: "",
  },
  due_date: {
    type: Date,
    default: null,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  notification_type: {
    type: String,
    enum: ["file_status_update", "general", "admin_notice"],
    default: "general"
  },
  file_id: {
    type: String,
    default: ""
  },
  file_name: {
    type: String,
    default: ""
  },
  subject_code: {
    type: String,
    default: ""
  },
  course: {
    type: String,
    default: ""
  },
  previous_status: {
    type: String,
    default: ""
  },
  new_status: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Notification", notificationSchema);