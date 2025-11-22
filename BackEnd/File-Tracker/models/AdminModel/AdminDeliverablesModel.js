import mongoose from "mongoose";

const adminDeliverablesSchema = new mongoose.Schema(
  {
    admin_deliverables_id: { 
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
    tos_type: {  
      type: String,
      enum: ['midterm', 'final', 'both', null],
      default: null
    },
    last_updated: { 
      type: Date, 
      default: Date.now 
    },
    status_overall: { 
      type: String, 
      default: "pending", 
      enum: ["pending", "completed", "rejected"] 
    }
  },
  { 
    versionKey: false 
  }
);

// Compound index for better query performance
adminDeliverablesSchema.index({ faculty_id: 1, subject_code: 1, course_section: 1 });
adminDeliverablesSchema.index({ subject_code: 1, course_section: 1 });
adminDeliverablesSchema.index({ status_overall: 1 });

const AdminDeliverables = mongoose.model("AdminDeliverables", adminDeliverablesSchema);
export default AdminDeliverables;