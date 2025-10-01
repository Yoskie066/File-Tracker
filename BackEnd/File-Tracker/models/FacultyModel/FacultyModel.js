import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
      unique: true,
    },
    adminName: {
      type: String,
      required: true,
      trim: true,
    },
    adminNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
    },
    role: {
      type: String,
      default: "faculty",
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Faculty", adminSchema);
