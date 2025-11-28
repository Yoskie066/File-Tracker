import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema(
  {
    requirement_id: { type: String, required: true, unique: true },
    prof_name: { type: String, required: true },
    document_type: { type: String, required: true },
    due_date: { type: Date, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const Requirement = mongoose.model("Requirement", requirementSchema);
export default Requirement;