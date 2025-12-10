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
      minlength: 8,
      validate: {
        validator: function(v) {
          return v.length >= 8;
        },
        message: "Faculty name must be at least 8 characters long"
      }
    },
    facultyNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{8,}$/, "Faculty number must be at least 8 digits"],
      validate: {
        validator: function(v) {
          return /^\d{8,}$/.test(v); 
        },
        message: "Faculty number must contain at least 8 digits"
      }
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
    facultyLoadeds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FacultyLoaded'
    }],
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Faculty", facultySchema);