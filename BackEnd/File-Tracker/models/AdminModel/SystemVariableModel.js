import mongoose from "mongoose";

const systemVariableSchema = new mongoose.Schema(
  {
    variable_id: { type: String, required: true, unique: true },
    variable_name: { type: String, required: true },
    variable_type: { 
      type: String, 
      required: true,
      enum: ['subject_code', 'course_section', 'academic_year', 'semester']
    },
    subject_title: { 
      type: String,
      required: function() {
        return this.variable_type === 'subject_code';
      }
    },
    created_by: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const SystemVariable = mongoose.model("SystemVariable", systemVariableSchema);
export default SystemVariable;