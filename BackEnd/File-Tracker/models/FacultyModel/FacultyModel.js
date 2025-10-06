import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: true,
      unique: true,
    },
    facultyName: {
      type: String,
      required: true,
      trim: true,
    },
    facultyNumber: {
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

export default mongoose.model("Faculty", facultySchema);
