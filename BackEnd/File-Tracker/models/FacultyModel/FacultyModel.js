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
      minlength: 2,
      validate: {
        validator: function(v) {
          return v.length >= 2;
        },
        message: "Faculty name must be at least 2 characters long"
      }
    },
    facultyNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{2,}$/, "Faculty number must contain only numbers (minimum 2 digits)"],
      validate: {
        validator: function(v) {
          return /^\d{2,}$/.test(v);
        },
        message: "Faculty number must contain only numbers"
      },
      minlength: 2
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
    },
    securityQuestion: {
      type: String,
      required: true,
      enum: [
        "What was your first pet's name?",
        "What is your mother's maiden name?",
        "What was the name of your first school?",
        "What is your favorite book?",
        "What is your favorite movie?",
        "What is your favorite food?",
        "What is your favorite color?",
        "What is your favorite sport?",
        "What is your favorite teacher's name?",
        "What is your favorite car?"
      ]
    },
    securityAnswer: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      validate: {
        validator: function(v) {
          return v.length > 0;
        },
        message: "Security answer is required"
      }
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