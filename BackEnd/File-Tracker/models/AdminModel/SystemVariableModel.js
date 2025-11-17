import mongoose from "mongoose";

const systemVariableSchema = new mongoose.Schema(
  {
    variable_id: { type: String, required: true, unique: true },
    variable_name: { type: String, required: true },
    variable_type: { 
      type: String, 
      required: true,
      enum: ['subject_code', 'course_section', 'academic_year', 'semester', 'other']
    },
    variable_value: { type: String, required: true },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    created_by: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const SystemVariable = mongoose.model("SystemVariable", systemVariableSchema);
export default SystemVariable;