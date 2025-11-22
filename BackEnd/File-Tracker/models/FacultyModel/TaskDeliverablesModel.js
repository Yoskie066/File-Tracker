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
    course_section: { 
      type: String, 
      required: true 
    },
    syllabus: { 
      type: String, 
      enum: ["pending", "completed", "rejected"], 
      default: "pending" 
    },
    tos_midterm: { 
      type: String, 
      enum: ["pending", "completed", "rejected"], 
      default: "pending" 
    },
    tos_final: { 
      type: String, 
      enum: ["pending", "completed", "rejected"], 
      default: "pending" 
    },
    midterm_exam: { 
      type: String, 
      enum: ["pending", "completed", "rejected"], 
      default: "pending" 
    },
    final_exam: { 
      type: String, 
      enum: ["pending", "completed", "rejected"], 
      default: "pending" 
    },
    instructional_materials: { 
      type: String, 
      enum: ["pending", "completed", "rejected"], 
      default: "pending" 
    },
    tos_type: {  
      type: String,
      enum: ['midterm', 'final', null],
      default: null
    },
    status: { 
      type: String, 
      enum: ["pending", "completed", "rejected"], 
      default: "pending" 
    },
    created_at: { 
      type: Date, 
      default: Date.now 
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
taskDeliverablesSchema.index({ faculty_id: 1, subject_code: 1, course_section: 1 });
taskDeliverablesSchema.index({ subject_code: 1, course_section: 1 });

const TaskDeliverables = mongoose.model("TaskDeliverables", taskDeliverablesSchema);
export default TaskDeliverables;