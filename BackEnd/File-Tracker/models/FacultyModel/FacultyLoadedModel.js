import mongoose from "mongoose";

const facultyLoadedSchema = new mongoose.Schema(
  {
    faculty_loaded_id: { type: String, required: true, unique: true },
    faculty_id: { type: String, required: true }, 
    subject_code: { type: String, required: true },
    subject_title: { type: String, required: true }, 
    course_section: { type: String, required: true },
    semester: { type: String, required: true },
    school_year: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Add compound index to prevent duplicates for same faculty
facultyLoadedSchema.index(
  { 
    faculty_id: 1, 
    subject_code: 1, 
    course_section: 1, 
    semester: 1, 
    school_year: 1 
  }, 
  { unique: true }
);

const FacultyLoaded = mongoose.model("FacultyLoaded", facultyLoadedSchema);
export default FacultyLoaded;