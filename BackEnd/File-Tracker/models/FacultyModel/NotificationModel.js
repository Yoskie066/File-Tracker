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
  related_requirement_id: {
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
});

export default mongoose.model("Notification", notificationSchema);
