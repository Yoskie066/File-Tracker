import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema(
  {
    requirement_id: { type: String,required: true,unique: true },
    task_name: { type: String, required: true },
    prof_name: { type: String, required: true },
    subject_code: { type: String, required: true },
    course_section: { type: String, required: true },
    file_type: { type: String, required: true },
    due_date: { type: Date, required: true },
    notes: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const Requirement = mongoose.model("Requirement", requirementSchema);
export default Requirement;
