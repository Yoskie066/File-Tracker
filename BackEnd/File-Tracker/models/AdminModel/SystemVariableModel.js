import mongoose from "mongoose";

const systemVariableSchema = new mongoose.Schema(
  {
    variable_id: { type: String, required: true, unique: true },
    subject_code: { type: String, required: true },
    subject_title: { type: String, required: true },
    course: { 
      type: String, 
      required: true,
      enum: ['BSCS', 'BSIT', 'BOTH']
    },
    semester: { 
      type: String, 
      required: true,
      enum: ['1st Semester', '2nd Semester', 'Summer']
    },
    academic_year: { type: String, required: true },
    created_by: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Compound index for unique combination of subject_code, course, semester, academic_year
systemVariableSchema.index(
  { 
    subject_code: 1, 
    course: 1, 
    semester: 1, 
    academic_year: 1 
  }, 
  { unique: true }
);

const SystemVariable = mongoose.model("SystemVariable", systemVariableSchema);
export default SystemVariable;