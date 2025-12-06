import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
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
      enum: ["faculty", "admin", "all_faculty"],
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
    document_type: {
      type: String,
      enum: ["syllabus", "tos", "midterm-exam", "final-exam", "instructional-materials", "all-files"],
      required: true,
    },
    tos_type: {
      type: String,
      enum: ["midterm", "final"],
      default: null,
    },
    due_date: {
      type: Date,
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
    is_read: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

export default mongoose.model("Notification", notificationSchema);