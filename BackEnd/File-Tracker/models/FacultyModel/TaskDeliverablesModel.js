import mongoose from "mongoose";

const taskDeliverablesSchema = new mongoose.Schema(
  {
    task_deliverables_id: { 
      type: String, 
      required: true, 
      unique: true 
    },
    faculty_id: { 
      type: String, 
      required: true 
    },
    faculty_name: { 
      type: String, 
      required: true 
    },
    subject_code: { 
      type: String, 
      required: true 
    },
    course: { 
      type: String, 
      required: true 
    },
    subject_title: {
      type: String,
      required: true
    },
    semester: {
      type: String,
      required: true
    },
    school_year: {
      type: String,
      required: true
    },
    syllabus: { 
      type: String, 
      default: "pending", 
      enum: ["pending", "completed", "rejected"] 
    },
    tos_midterm: { 
      type: String, 
      default: "pending", 
      enum: ["pending", "completed", "rejected"] 
    },
    tos_final: { 
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
    updated_at: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    versionKey: false 
  }
);

// Index for better query performance
taskDeliverablesSchema.index({ faculty_id: 1, subject_code: 1, course: 1, semester: 1, school_year: 1 });
taskDeliverablesSchema.index({ subject_code: 1, course: 1 });

const TaskDeliverables = mongoose.model("TaskDeliverables", taskDeliverablesSchema);
export default TaskDeliverables;