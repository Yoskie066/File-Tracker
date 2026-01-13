import mongoose from "mongoose";
import Admin from "./AdminModel/AdminModel.js";
import Faculty from "./FacultyModel/FacultyModel.js";

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  middleInitial: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["faculty", "admin"], 
    required: true,
  },
  securityQuestion: {
    type: String,
    required: true,
  },
  securityAnswer: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to check for duplicate number across roles
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check in Faculty collection
    const existingFaculty = await Faculty.findOne({ facultyNumber: this.number });
    if (existingFaculty) {
      return next(new Error(`Number ${this.number} already exists as a faculty`));
    }
    
    // Check in Admin collection
    const existingAdmin = await Admin.findOne({ adminNumber: this.number });
    if (existingAdmin) {
      return next(new Error(`Number ${this.number} already exists as an admin`));
    }
  }
  next();
});

const User = mongoose.model("UserManagement", userSchema);
export default User;