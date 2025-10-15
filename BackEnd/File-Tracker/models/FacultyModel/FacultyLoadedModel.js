import mongoose from "mongoose";

const facultyLoadedSchema = new mongoose.Schema(
  {
    faculty_loaded_id: { type: String, required: true, unique: true },
    subject_code: { type: String, required: true },
    subject_title: { type: String, required: true },
    course_section: { type: String, required: true },
    semester: { type: String, required: true },
    school_year: { type: String, required: true },
    day_time: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const FacultyLoaded = mongoose.model("FacultyLoaded", facultyLoadedSchema);
export default FacultyLoaded;