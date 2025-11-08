import mongoose from "mongoose";

const taskDeliverablesSchema = new mongoose.Schema(
  {
    task_deliverables_id: { type: String, required: true, unique: true },
    faculty_id: { type: String, required: true }, 
    subject_code: { type: String, required: true },
    course_section: { type: String, required: true },
    syllabus: { 
      type: String, 
      default: "pending",
      enum: ["pending", "completed", "rejected"]
    },
    tos: { 
      type: String, 
      default: "pending",
      enum: ["pending", "completed", "rejected"]
    },
    midterm_exam: { 
      type: String, 
      default: "pending",
      enum: ["pending", "completed", "rejected"]
    },
    final_exam: { 
      type: String, 
      default: "pending",
      enum: ["pending", "completed", "rejected"]
    },
    instructional_materials: { 
      type: String, 
      default: "pending",
      enum: ["pending", "completed", "rejected"]
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const TaskDeliverables = mongoose.model("TaskDeliverables", taskDeliverablesSchema);
export default TaskDeliverables;